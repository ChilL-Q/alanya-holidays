import { Injectable } from '@nestjs/common';
import { MessagesRepository } from './messages.repository';

const sanitizeString = (str: string) => {
  if (!str) return '';
  return str.replace(/<[^>]*>?/gm, '').trim();
};

@Injectable()
export class MessagesService {
  constructor(private readonly messagesRepository: MessagesRepository) {}

  async sendMessage(data: any) {
    const sanitized = {
      name: sanitizeString(data.name).slice(0, 200),
      email: sanitizeString(data.email).slice(0, 320),
      subject: data.subject ? sanitizeString(data.subject).slice(0, 500) : null,
      message: sanitizeString(data.message).slice(0, 10000),
    };

    await this.messagesRepository.insertMessage(sanitized);

    this.messagesRepository.invokeEmailFunction({
      type: 'admin_contact_message',
      to: 'contact@alanyaholidays.com',
      data: {
        name: sanitized.name,
        email: sanitized.email,
        subject: sanitized.subject,
        message: sanitized.message,
      },
    });

    return { success: true };
  }
}
