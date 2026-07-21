import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

const sanitizeString = (str: string) => {
  if (!str) return '';
  return str.replace(/<[^>]*>?/gm, '').trim();
};

@Injectable()
export class MessagesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async sendMessage(data: any) {
    const supabase = this.supabaseService.getClient();
    const sanitized = {
      name: sanitizeString(data.name).slice(0, 200),
      email: sanitizeString(data.email).slice(0, 320),
      subject: data.subject ? sanitizeString(data.subject).slice(0, 500) : null,
      message: sanitizeString(data.message).slice(0, 10000),
    };

    const { error } = await supabase.from('messages').insert([sanitized]);
    if (error) throw new Error(error.message);

    // Notify Admin via edge function without waiting
    supabase.functions.invoke('send-email', {
      body: {
        type: 'admin_contact_message',
        to: 'contact@alanyaholidays.com',
        data: {
          name: sanitized.name,
          email: sanitized.email,
          subject: sanitized.subject,
          message: sanitized.message
        }
      }
    }).catch(err => console.error('Failed to send admin email:', err));

    return { success: true };
  }
}
