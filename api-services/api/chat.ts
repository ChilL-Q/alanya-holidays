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
        
        // Fetch last message for each conversation to display snippet
        const conversations = await Promise.all(data.map(async (conv: any) => {
            const { data: lastMsg } = await supabase
                .from('chat_messages')
                .select('*')
                .eq('conversation_id', conv.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            
            // Count unread messages (if I am the receiver)
            // If I am guest, sender was host, and vice versa.
            // Actually, simply count messages where sender_id != me AND is_read = false
            const { count } = await supabase
                .from('chat_messages')
                .select('*', { count: 'exact', head: true })
                .eq('conversation_id', conv.id)
                .neq('sender_id', user.id)
                .eq('is_read', false);

            return {
                ...conv,
                last_message: lastMsg,
                unread_count: count || 0
            };
        }));

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
    async createConversation(propertyId: string, hostId: string) {
        assertUUID(propertyId, 'propertyId');
        assertUUID(hostId, 'hostId');
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Check if exists first
        const { data: existing } = await supabase
            .from('chat_conversations')
            .select('id')
            .eq('property_id', propertyId)
            .eq('guest_id', user.id)
            .eq('host_id', hostId)
            .maybeSingle();

        if (existing) return existing.id;

        // Create new
        try {
            const { data, error } = await supabase
                .from('chat_conversations')
                .insert([{
                    property_id: propertyId,
                    guest_id: user.id,
                    host_id: hostId
                }])
                .select()
                .single();

            if (error) {
                // If conflict, try to fetch again
                if (error.code === '23505' || error.message?.includes('duplicate')) {
                    const { data: retry } = await supabase
                        .from('chat_conversations')
                        .select('id')
                        .eq('property_id', propertyId)
                        .eq('guest_id', user.id)
                        .eq('host_id', hostId)
                        .maybeSingle();
                    if (retry) return retry.id;
                }
                throw error;
            }
            return data.id;
        } catch (err) {
            console.error('Error creating conversation:', err);
            throw err;
        }


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

    // Subscribe to messages (Realtime)
    subscribeToMessages(conversationId: string, callback: (message: ChatMessage) => void) {
        return supabase
            .channel(`conversation:${conversationId}`)
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
            )
            .subscribe();
    }
};
