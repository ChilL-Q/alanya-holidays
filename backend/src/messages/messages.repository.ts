import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class MessagesRepository {
  constructor(private readonly supabaseService: SupabaseService) {}

  get client() {
    return this.supabaseService.getClient();
  }

  async insertMessage(messageData: any) {
    const { error } = await this.client.from('messages').insert([messageData]);
    if (error) throw new Error(error.message);
  }

  invokeEmailFunction(payload: any) {
    this.client.functions
      .invoke('send-email', { body: payload })
      .catch((err) => console.error('Failed to send email:', err));
  }
}
