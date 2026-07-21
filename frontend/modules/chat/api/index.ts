export * from './types';
import { supabaseChatService } from './adapters/supabaseChat';
export const chatService = supabaseChatService;
