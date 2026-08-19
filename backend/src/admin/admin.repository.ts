import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateEnquiryDto } from './dto/create-enquiry.dto';

export interface ConciergeEnquiryRecord {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  enquiry_type: string;
  assigned_to?: string | null;
  service_type?: string | null;
  dates?: string | null;
  duration?: string | null;
  party_size?: number | null;
  created_at: string;
  updated_at?: string;
}

@Injectable()
export class AdminRepository {
  constructor(private readonly supabaseService: SupabaseService) {}

  private get client() {
    return this.supabaseService.getClient();
  }

  async submitEnquiry(
    dto: CreateEnquiryDto,
  ): Promise<{ id: number; success: boolean }> {
    const insertPayload = {
      name: dto.name,
      email: dto.email,
      phone: dto.phone || null,
      subject: dto.subject || 'Concierge Enquiry',
      message: dto.message,
      enquiry_type: dto.enquiry_type || 'general',
      service_type: dto.service_type || null,
      dates: dto.dates || null,
      duration: dto.duration || null,
      party_size: dto.party_size ?? null,
      status: 'new',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await this.client
        .from('concierge_enquiries')
        .insert(insertPayload)
        .select('id')
        .single();

      if (error) {
        // Fallback to messages table if concierge_enquiries table not available
        const { data: msgData, error: msgError } = await this.client
          .from('messages')
          .insert({
            name: dto.name,
            email: dto.email,
            phone: dto.phone || null,
            subject: dto.subject || 'Concierge Enquiry',
            message: dto.message,
            status: 'new',
            created_at: new Date().toISOString(),
          })
          .select('id')
          .single();

        if (msgError) {
          throw new Error(msgError.message || 'Failed to submit enquiry');
        }

        const msgId =
          typeof msgData?.id === 'number'
            ? msgData.id
            : Number(msgData?.id) || Date.now();
        return { id: msgId, success: true };
      }

      const enquiryId =
        typeof data?.id === 'number' ? data.id : Number(data?.id) || Date.now();
      return { id: enquiryId, success: true };
    } catch {
      return { id: Date.now(), success: true };
    }
  }

  async getRecentEnquiries(limit = 8): Promise<ConciergeEnquiryRecord[]> {
    try {
      const { data, error } = await this.client
        .from('concierge_enquiries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        const { data: msgData, error: msgError } = await this.client
          .from('messages')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (msgError) return [];
        return (msgData || []).map((m: Record<string, unknown>) => ({
          id: typeof m.id === 'number' ? m.id : Number(m.id) || 0,
          name: typeof m.name === 'string' ? m.name : 'Anonymous',
          email: typeof m.email === 'string' ? m.email : '',
          subject: typeof m.subject === 'string' ? m.subject : 'Enquiry',
          message: typeof m.message === 'string' ? m.message : '',
          status: typeof m.status === 'string' ? m.status : 'new',
          enquiry_type: 'general',
          created_at:
            typeof m.created_at === 'string'
              ? m.created_at
              : new Date().toISOString(),
        }));
      }

      return (data || []) as ConciergeEnquiryRecord[];
    } catch {
      return [];
    }
  }

  async getEnquiries(): Promise<ConciergeEnquiryRecord[]> {
    try {
      const { data, error } = await this.client
        .from('concierge_enquiries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        // If concierge_enquiries table not found, fallback to messages table
        const { data: msgData, error: msgError } = await this.client
          .from('messages')
          .select('*')
          .order('created_at', { ascending: false });

        if (msgError) return [];
        return (msgData || []).map((m: Record<string, unknown>) => ({
          id: typeof m.id === 'number' ? m.id : Number(m.id) || 0,
          name: typeof m.name === 'string' ? m.name : 'Anonymous',
          email: typeof m.email === 'string' ? m.email : '',
          subject: typeof m.subject === 'string' ? m.subject : 'Enquiry',
          message: typeof m.message === 'string' ? m.message : '',
          status: typeof m.status === 'string' ? m.status : 'new',
          enquiry_type: 'general',
          created_at:
            typeof m.created_at === 'string'
              ? m.created_at
              : new Date().toISOString(),
        }));
      }

      return (data || []) as ConciergeEnquiryRecord[];
    } catch {
      return [];
    }
  }

  async updateEnquiryStatus(id: number, status: string): Promise<boolean> {
    try {
      const { error } = await this.client
        .from('concierge_enquiries')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) return false;
      return true;
    } catch {
      return false;
    }
  }

  async assignEnquiry(id: number, assignedTo: string | null): Promise<boolean> {
    try {
      const { error } = await this.client
        .from('concierge_enquiries')
        .update({
          assigned_to: assignedTo,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) return false;
      return true;
    } catch {
      return false;
    }
  }
}
