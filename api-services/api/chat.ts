import { supabase } from '../supabase';
import { ChatConversation, ChatMessage } from '../../types/index';
import { getAppUrl } from '../../utils/appUrl';
import { retry } from '../../utils/retry';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function assertUUID(value: string, label: string): void {
    if (!UUID_RE.test(value)) throw new Error(`Invalid ${label}`);
}

async function verifyConversationAccess(userId: string, conversationId: string) {
    assertUUID(userId, 'userId');
    assertUUID(conversationId, 'conversationId');
    const { data: conv } = await supabase
        .from('chat_conversations')
        .select('id')
        .eq('id', conversationId)
        .or(`guest_id.eq.${userId},host_id.eq.${userId}`)
        .maybeSingle();

    if (!conv) throw new Error('Not authorized for this conversation');
}

export const chatService = {
    // Get all conversations for the current user
    async getConversations() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Fetch conversations where I am guest or host
        assertUUID(user.id, 'userId');
        // guest_id and host_id are UUIDs - user.id is validated UUID from Supabase Auth
        const { data, error } = await supabase
            .from('chat_conversations')
            .select(`
                *,
                property:properties(title, images),
                guest:profiles!chat_conversations_guest_id_fkey(full_name, avatar_url),
                host:profiles!chat_conversations_host_id_fkey(full_name, avatar_url)
            `)
            .or(`guest_id.eq.${user.id},host_id.eq.${user.id}`)
            .order('updated_at', { ascending: false });

        if (error) throw error;

        // Batch fetch last message and unread count for all conversations
        interface ConversationInfoRow {
            conversation_id: string;
            last_message_created_at: string | null;
            last_message_text: string | null;
            last_message_sender_id: string | null;
            unread_count: number;
        }
        const { data: infoRows } = await supabase
            .rpc('get_conversations_info', { p_user_id: user.id }) as { data: ConversationInfoRow[] | null };

        const infoMap = new Map(
            (infoRows || []).map(row => [row.conversation_id, row])
        );

        const conversations = data.map(conv => {
            const info = infoMap.get(conv.id);
            return {
                ...conv,
                last_message: info ? {
                    id: null, // Not needed for snippet
                    conversation_id: conv.id,
                    sender_id: info.last_message_sender_id,
                    text: info.last_message_text,
                    is_read: true, // Not needed for snippet
                    created_at: info.last_message_created_at,
                } : null,
                unread_count: info?.unread_count || 0
            };
        });

        return conversations as ChatConversation[];
    },

    // Get messages for a specific conversation
    async getMessages(conversationId: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        await verifyConversationAccess(user.id, conversationId);

        const { data, error } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data as ChatMessage[];
    },

    // Send a message
    async sendMessage(conversationId: string, content: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        await verifyConversationAccess(user.id, conversationId);

        // Content validation
        const trimmed = content.trim().slice(0, 5000);
        if (!trimmed) throw new Error('Message cannot be empty');

        const { data, error } = await supabase
            .from('chat_messages')
            .insert([{
                conversation_id: conversationId,
                sender_id: user.id,
                content: trimmed
            }])
            .select()
            .single();

        if (error) throw error;

        // Update conversation updated_at
        await supabase
            .from('chat_conversations')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', conversationId);

        // Notify recipient via Email (Fire-and-forget)
        (async () => {
             try {
                 const { data: conv } = await supabase
                    .from('chat_conversations')
                    .select('guest_id, host_id, property:properties(title)')
                    .eq('id', conversationId)
                    .single();
                 
                 if (conv) {
                    const recipientId = user.id === conv.guest_id ? conv.host_id : conv.guest_id;
                    const senderName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';

                    await retry(() => supabase.functions.invoke('send-email', {
                        body: {
                            type: 'new_chat_message',
                            userId: recipientId,
                            data: {
                                senderName,
                                messagePreview: content.length > 50 ? content.substring(0, 50) + '...' : content,
                                link: getAppUrl('/host/inbox'), // Simplify to inbox for now
                            }
                        }
                    }));
                 }
            } catch (e) {
                console.error('Failed to send chat notification', e);
            }
        })();

        return data as ChatMessage;
    },

    // Create or retrieve existing conversation
    // Uses upsert with DB-level conflict resolution to avoid TOCTOU race conditions
    async createConversation(propertyId: string, hostId: string) {
        assertUUID(propertyId, 'propertyId');
        assertUUID(hostId, 'hostId');
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const MAX_RETRIES = 3;
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            // Try upsert: insert with on_conflict_do_nothing
            const { data, error } = await supabase
                .from('chat_conversations')
                .insert([{
                    property_id: propertyId,
                    guest_id: user.id,
                    host_id: hostId
                }])
                .select()
                .single();

            if (!error) {
                return data.id;
            }

            // If unique constraint violation, race won — fetch existing
            if (error.code === '23505' || error.message?.includes('duplicate')) {
                const { data: existing, error: fetchError } = await supabase
                    .from('chat_conversations')
                    .select('id')
                    .eq('property_id', propertyId)
                    .eq('guest_id', user.id)
                    .eq('host_id', hostId)
                    .maybeSingle();

                if (fetchError) {
                    if (attempt < MAX_RETRIES) {
                        await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempt)));
                        continue;
                    }
                    throw fetchError;
                }

                if (existing) return existing.id;
            }

            // Non-retriable error or exhausted retries
            if (attempt === MAX_RETRIES) throw error;
        }

        throw new Error('Failed to create or find conversation');
    },

    // Create or retrieve a direct conversation between admin (as host) and a user (as guest), no property
    async createDirectConversation(guestId: string): Promise<string> {
        assertUUID(guestId, 'guestId');
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('chat_conversations')
            .insert([{ guest_id: guestId, host_id: user.id }])
            .select('id')
            .single();

        if (!error) return data.id;

        // Conversation already exists — fetch it
        if (error.code === '23505' || error.message?.includes('duplicate')) {
            const { data: existing, error: fetchError } = await supabase
                .from('chat_conversations')
                .select('id')
                .eq('guest_id', guestId)
                .eq('host_id', user.id)
                .is('property_id', null)
                .maybeSingle();

            if (fetchError) throw fetchError;
            if (existing) return existing.id;
        }

        throw error;
    },

    // Mark messages as read
    async markAsRead(conversationId: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Mark all messages in this conversation NOT sent by me as read
        const { error } = await supabase
            .from('chat_messages')
            .update({ is_read: true })
            .eq('conversation_id', conversationId)
            .neq('sender_id', user.id)
            .eq('is_read', false);

        if (error) throw error;
    },

    // Clear chat history (Delete messages)
    async clearHistory(conversationId: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        await verifyConversationAccess(user.id, conversationId);

        const { error } = await supabase
            .from('chat_messages')
            .delete()
            .eq('conversation_id', conversationId);

        if (error) throw error;
    },

    // Submit a report
    async submitReport(data: {
        reporter_id: string;
        reported_id?: string;
        conversation_id: string;
        reason: string;
        description: string;
    }) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Derive reporter_id from the authenticated session
        const { error } = await supabase
            .from('chat_reports')
            .insert([{
                ...data,
                reporter_id: user.id
            }]);

        if (error) throw error;
    },

    // Subscribe to messages (Realtime) — verifies access before subscribing
    subscribeToMessages(conversationId: string, callback: (message: ChatMessage) => void) {
        const channel = supabase
            .channel(`conversation:${conversationId}`);

        // Verify user has access to this conversation before allowing subscription
        const subscription = channel
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_messages',
                    filter: `conversation_id=eq.${conversationId}`
                },
                (payload) => {
                    callback(payload.new as ChatMessage);
                }
            );

        // Validate access when subscribing
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (!user) {
                console.warn('Cannot subscribe without authentication');
                return;
            }
            verifyConversationAccess(user.id, conversationId).catch(() => {
                console.warn(`User does not have access to conversation ${conversationId}`);
                subscription.unsubscribe();
            });
        });

        return subscription.subscribe();
    }
};
