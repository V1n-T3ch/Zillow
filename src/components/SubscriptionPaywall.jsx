import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiLock, FiCreditCard, FiMapPin, FiPhone, FiUser } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { startPaystackSubscription, verifyPaystackSubscription, PAYSTACK_AMOUNT_KES } from '../services/paystackService';

const SubscriptionPaywall = ({
    isAuthenticated,
    email,
    currentUserId,
    onSubscribed
}) => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const handleSubscribe = async () => {
        if (!isAuthenticated) {
            navigate('/login', {
                state: {
                    from: location
                }
            });
            return;
        }

        try {
            setLoading(true);

            const paymentResponse = await startPaystackSubscription({
                email,
                metadata: {
                    userId: currentUserId,
                    email,
                    returnPath: location.pathname
                }
            });

            const verification = await verifyPaystackSubscription(paymentResponse.reference);

            toast.success(verification.message || 'Subscription activated successfully');

            if (onSubscribed) {
                await onSubscribed(verification);
            }
        } catch (error) {
            console.error('Paystack subscription error:', error);
            toast.error(error.message || 'Unable to start subscription checkout');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-xl shadow-sm">
            <div className="flex items-start gap-4">
                <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 rounded-full bg-emerald-100 text-emerald-600">
                    <FiLock size={20} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-800">Unlock contact and location details</h3>
                    <p className="mt-1 text-sm text-gray-600">
                        Subscribe for Ksh. {PAYSTACK_AMOUNT_KES}/month to view the listing agent name, phone number, email address, and exact property location.
                    </p>
                </div>
            </div>

            <div className="grid gap-3 mt-5 text-sm text-gray-700">
                <div className="flex items-center gap-3">
                    <FiUser className="text-emerald-600" />
                    <span>Listing agent identity</span>
                </div>
                <div className="flex items-center gap-3">
                    <FiPhone className="text-emerald-600" />
                    <span>Direct phone and email</span>
                </div>
                <div className="flex items-center gap-3">
                    <FiMapPin className="text-emerald-600" />
                    <span>Exact map location and directions</span>
                </div>
            </div>

            <button
                type="button"
                onClick={handleSubscribe}
                disabled={loading}
                className="inline-flex items-center justify-center w-full px-4 py-3 mt-6 font-medium text-white transition-colors rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
                <FiCreditCard className="mr-2" />
                {loading ? 'Launching Paystack...' : 'Subscribe with Paystack'}
            </button>

            <p className="mt-3 text-xs text-gray-500 text-center">
                Secure monthly billing handled by Paystack.
            </p>
        </div>
    );
};

export default SubscriptionPaywall;