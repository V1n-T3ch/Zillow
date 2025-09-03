import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiAlertCircle, FiArrowLeft, FiLoader, FiCheckCircle } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const { resetPassword } = useAuth();

    async function handleSubmit(e) {
        e.preventDefault();

        try {
            setError('');
            setMessage('');
            setLoading(true);
            await resetPassword(email);
            setMessage("Password reset email sent! Check your inbox");
        } catch (error) {
            let errorMessage = "Failed to reset password";

            if (error.code === 'auth/user-not-found') {
                errorMessage = "No account found with this email";
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = "Invalid email address format";
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="pt-24 pb-16">
                <div className="w-full max-w-md mx-auto px-4">
                    <div className="bg-white shadow-subtle rounded-2xl p-8">
                        <Link
                            to="/login"
                            className="inline-flex items-center text-gray-600 hover:text-emerald-600 mb-6"
                        >
                            <FiArrowLeft className="mr-2" /> Back to login
                        </Link>

                        <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">Reset your password</h1>
                        <p className="text-gray-600 mb-6">Enter your email address and we'll send you a link to reset your password</p>

                        {error && (
                            <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-6 flex items-start">
                                <FiAlertCircle className="mr-2 mt-0.5 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {message && (
                            <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-6 flex items-start">
                                <FiCheckCircle className="mr-2 mt-0.5 flex-shrink-0" />
                                <span>{message}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FiMail className="text-gray-400" />
                                    </div>
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        placeholder="you@example.com"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors flex items-center justify-center"
                            >
                                {loading ? (
                                    <><FiLoader className="animate-spin mr-2" /> Sending...</>
                                ) : (
                                    'Send Reset Link'
                                )}
                            </button>
                        </form>

                        <p className="text-center mt-8 text-gray-600">
                            Remember your password?{' '}
                            <Link to="/login" className="text-emerald-600 hover:text-emerald-700 font-medium">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;