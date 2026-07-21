export * from './types';
import { supabaseForumService } from './adapters/supabaseForum';
import { supabaseForumEventsService } from './adapters/supabaseForumEvents';

export const forumService = supabaseForumService;
export const forumEventsService = supabaseForumEventsService;
