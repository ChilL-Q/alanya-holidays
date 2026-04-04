
import axios from 'axios';

const YESIM_API_URL = 'https://partners-api.yesim.biz';
const getApiToken = () => import.meta.env.VITE_YESIM_API_TOKEN;
const getHeaders = () => {
    const token = getApiToken();
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
};

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
        const token = getApiToken();
        if (!token) {
            console.warn('Yesim API Token is missing, using demo data');
            return [
                // Real data from proposal with ~40-50% margin
                { id: 'turkey_3gb', name: 'Turkey Essential', days: '7', price: '3.50', data: '3', countries_included: 'Turkey', countryIso2: 'TR', operators: 'Turkcell', image: 'https://cdn.yesim.app/flags/ver/1/tr.svg', plan_type: 'country' },
                { id: 'turkey_5gb', name: 'Turkey Standard', days: '15', price: '5.50', data: '5', countries_included: 'Turkey', countryIso2: 'TR', operators: 'Turkcell', image: 'https://cdn.yesim.app/flags/ver/1/tr.svg', plan_type: 'country' },
                { id: 'turkey_10gb', name: 'Turkey Advanced', days: '30', price: '9.00', data: '10', countries_included: 'Turkey', countryIso2: 'TR', operators: 'Turkcell', image: 'https://cdn.yesim.app/flags/ver/1/tr.svg', plan_type: 'country' },
                { id: 'turkey_20gb', name: 'Turkey Max', days: '30', price: '16.00', data: '20', countries_included: 'Turkey', countryIso2: 'TR', operators: 'Turkcell', image: 'https://cdn.yesim.app/flags/ver/1/tr.svg', plan_type: 'country' },
                { id: 'turkey_unlimited', name: 'Turkey Unlimited', days: '15', price: '29.00', data: 'Unlimited', countries_included: 'Turkey', countryIso2: 'TR', operators: 'Turkcell', image: 'https://cdn.yesim.app/flags/ver/1/tr.svg', plan_type: 'country' },
                { id: 'global_pass', name: 'Global Pass', days: '30', price: '35.00', data: '5', countries_included: 'Global (120+)', countryIso2: 'GL', operators: 'Multiple', image: 'https://cdn.yesim.app/flags/ver/1/gl.svg', plan_type: 'global' }
            ] as any[];
        }

        try {
            const response = await axios.get(`${YESIM_API_URL}/plans`, {
                headers: getHeaders()
            });
            return response.data;
        } catch (error) {
            console.error('Failed to fetch Yesim plans:', error);
            throw error;
        }
    },

    async createOrder(planId: string): Promise<YesimOrder> {
        const token = getApiToken();
        if (!token) {
            console.warn('Using demo order creation');
            await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate delay
            return {
                id: 'demo-sim-123',
                iccid: '899000000000000000',
                qrcode: 'LPA:1$smdp.io$DEMO-ACTIVATION-CODE',
                ios_tap_link: 'https://esimsetup.apple.com/esim_qrcode_provisioning?carddata=LPA:1$smdp.io$DEMO-ACTIVATION-CODE'
            };
        }

        try {
            // 1. Create a new eSIM (or assign to user if we had user flow, but for guest checkout we create new)
            // Using /new_esim to get a fresh ICCID
            const simResponse = await axios.get(`${YESIM_API_URL}/new_esim`, {
                headers: getHeaders()
            });
            
            if (simResponse.data.status === 'error') {
                 throw new Error(simResponse.data.message || 'Failed to create eSIM');
            }

            const { iccid, id: simId } = simResponse.data;

            // 2. Activate the plan on this eSIM
            // Transaction ID is random for now
            const paymentId = `ORD-${Date.now()}`;
            
            const activationResponse = await axios.post(`${YESIM_API_URL}/add_plan_iccid`, null, {
                headers: getHeaders(),
                params: {
                    iccid: iccid,
                    plan_id: planId,
                    payment_id: paymentId
                }
            });

             if (activationResponse.data.status !== 'success') {
                 throw new Error(activationResponse.data.description || 'Failed to activate plan');
            }

            // 3. Get eSIM details to return QR code
            const detailsResponse = await axios.get(`${YESIM_API_URL}/sim_info`, {
                headers: getHeaders(),
                params: {
                    iccid: iccid
                }
            });

            return {
                id: simId,
                iccid: iccid,
                qrcode: detailsResponse.data.qrcode,
                ios_tap_link: detailsResponse.data.ios_tap_link
            };

        } catch (error) {
            console.error('Yesim Order Failed:', error);
            throw error;
        }
    }
};
