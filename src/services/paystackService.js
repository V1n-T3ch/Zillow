const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
const PAYSTACK_PLAN_CODE = import.meta.env.VITE_PAYSTACK_PLAN_CODE || 'PLN_knou2hxlgq4dehy';
const PAYSTACK_CURRENCY = import.meta.env.VITE_PAYSTACK_CURRENCY || 'KES';
const PAYSTACK_AMOUNT_KES = Number(import.meta.env.VITE_PAYSTACK_AMOUNT_KES || 100);
const PAYSTACK_API_BASE_URL = import.meta.env.VITE_APP_B2_API_URL || 'http://localhost:5000';

let paystackScriptPromise = null;

export const loadPaystackScript = () => {
    if (window.PaystackPop) {
        return Promise.resolve();
    }

    if (!paystackScriptPromise) {
        paystackScriptPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://js.paystack.co/v1/inline.js';
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Paystack checkout script'));
            document.body.appendChild(script);
        });
    }

    return paystackScriptPromise;
};

export const getPaystackFunctionsBaseUrl = () => {
    return PAYSTACK_API_BASE_URL.replace(/\/$/, '');
};

export const startPaystackSubscription = async ({
    email,
    metadata = {},
    amountKobo = PAYSTACK_AMOUNT_KES * 100
}) => {
    if (!PAYSTACK_PUBLIC_KEY) {
        throw new Error('VITE_PAYSTACK_PUBLIC_KEY is not configured');
    }

    if (!email) {
        throw new Error('An email address is required to start Paystack checkout');
    }

    await loadPaystackScript();

    return new Promise((resolve, reject) => {
        const handler = window.PaystackPop.setup({
            key: PAYSTACK_PUBLIC_KEY,
            email,
            amount: amountKobo,
            currency: PAYSTACK_CURRENCY,
            plan: PAYSTACK_PLAN_CODE,
            metadata: {
                subscriptionType: 'property_viewing',
                planCode: PAYSTACK_PLAN_CODE,
                ...metadata
            },
            callback: (response) => resolve(response),
            onClose: () => reject(new Error('Paystack checkout was closed before payment completed'))
        });

        handler.openIframe();
    });
};

export const verifyPaystackSubscription = async (reference) => {
    if (!reference) {
        throw new Error('A Paystack reference is required for verification');
    }

    const response = await fetch(`${getPaystackFunctionsBaseUrl()}/api/paystack/verify-subscription`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reference })
    });

    const payload = await response.json();

    if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to verify Paystack subscription');
    }

    return payload;
};

export { PAYSTACK_AMOUNT_KES, PAYSTACK_PLAN_CODE };