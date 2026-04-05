import { supabase } from '../supabase';

export interface YesimPlan {
    id: string;
    name: string;
    days: string;
    price: string;
    data: string; // in GB
    countries_included: string;
    countryIso2: string;
    operators: string;
    image: string;
    plan_type: string;
}

export interface YesimOrder {
    id: string;
    iccid: string;
    qrcode: string;
    ios_tap_link?: string;
    smdp_address?: string; // Derived from QR
    activation_code?: string; // Derived from QR
}

export const yesimService = {
    async getPlans(): Promise<YesimPlan[]> {
        const { data, error } = await supabase.functions.invoke('yesim-proxy', {
            body: { action: 'getPlans' },
        });

        if (error) {
            console.error('Failed to fetch Yesim plans:', error);
            throw new Error(error.message || 'Failed to fetch Yesim plans');
        }

        if (data.error) {
            console.error('Yesim proxy error:', data.error);
            throw new Error(data.error);
        }

        return data.data as YesimPlan[];
    },

    async createOrder(planId: string): Promise<YesimOrder> {
        const { data, error } = await supabase.functions.invoke('yesim-proxy', {
            body: { action: 'createOrder', planId },
        });

        if (error) {
            console.error('Yesim Order Failed:', error);
            throw new Error(error.message || 'Order creation failed');
        }

        if (data.error) {
            console.error('Yesim order error:', data.error);
            throw new Error(data.error);
        }

        return data.data as YesimOrder;
    }
};
