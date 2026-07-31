import { PropertyDB } from './property';
import { ServiceDB } from './service';
import { Product } from './product';

export interface Booking {
    id: string;
    booking_ref?: number;
    user_id: string;
    item_id: string;
    item_type: 'property' | 'service' | 'product';
    variant_id?: string;
    check_in?: string;
    check_out?: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    total_price: number;
    guests: number;
    message?: string;
    created_at?: string;
    
    // Virtual fields for joined data
    property?: Partial<PropertyDB>;
    service?: Partial<ServiceDB>;
    product?: Partial<Product>;
    
    payment_method?: 'card' | 'bank' | 'crypto' | 'cash' | 'swift';
    payment_status?: 'pending' | 'paid' | 'failed' | 'refunded';
    payment_intent_id?: string;
    
    // Payout fields (Manual Tracking)
    payout_status?: 'pending' | 'processing' | 'paid' | 'failed' | 'hold';
    commission_amount?: number;
    host_payout_amount?: number;
    payout_due_date?: string;
}
