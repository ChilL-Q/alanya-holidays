import { supabase } from '../supabase';

/**
 * Creates an audit log entry in the database for tracking critical events.
 * 
 * @param eventType - The type of event being logged
 * @param details - Additional structured details about the event
 * @param userId - Optional ID of the user who triggered the event
 * @returns A promise that resolves when the log entry has been attempted
 */
export async function createAuditLog(
    eventType: 
        | 'BOOKING_CREATED'
        | 'BOOKING_CONFIRMED'
        | 'BOOKING_REJECTED'
        | 'BOOKING_CANCELLED'
        | 'CANCELLATION'
        | 'REFUND'
        | 'PROPERTY_APPROVED'
        | 'PROPERTY_REJECTED'
        | 'PROPERTY_DELETED'
        | 'SERVICE_APPROVED'
        | 'SERVICE_REJECTED'
        | 'EMAIL_DELIVERY_FAILED',
    details: object,
    userId?: string
): Promise<void> {
    try {
        const { error } = await supabase
            .from('audit_logs')
            .insert([
                {
                    event_type: eventType,
                    details: details,
                    user_id: userId || null,
                    created_at: new Date().toISOString()
                }
            ]);

        if (error) {
            console.error(`[AuditLog] Failed to log ${eventType}:`, error);
        }
    } catch (err) {
        console.error(`[AuditLog] Unexpected error logging ${eventType}:`, err);
    }
}
