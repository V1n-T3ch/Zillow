import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiMail, FiLock, FiAlertCircle, FiArrowLeft, FiLoader } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, googleSignIn } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || '/';

    async function handleEmailLogin(e) {
        e.preventDefault();

        try {
            setError('');
            setLoading(true);
            await login(email, password);
            navigate(from, { replace: true });
        } catch (error) {
            let errorMessage = "Failed to sign in";

            if (error.code === 'auth/invalid-credential') {
                errorMessage = "Invalid email or password";
            } else if (error.code === 'auth/user-disabled') {
                errorMessage = "This account has been disabled";
            } else if (error.code === 'auth/user-not-found') {
                errorMessage = "No account found with this email";
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = "Invalid email address format";
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }

    async function handleGoogleLogin() {
        try {
            setError('');
            setLoading(true);
            await googleSignIn();
            navigate(from, { replace: true });
        } catch (error) {
            setError("Failed to sign in with Google");
            console.error(error);
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
                            to="/"
                            className="inline-flex items-center text-gray-600 hover:text-emerald-600 mb-6"
                        >
                            <FiArrowLeft className="mr-2" /> Back to home
                        </Link>

                        <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">Welcome back</h1>
                        <p className="text-gray-600 mb-6">Sign in to access your account</p>

                        {error && (
                            <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-6 flex items-start">
                                <FiAlertCircle className="mr-2 mt-0.5 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleEmailLogin} className="space-y-5">
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

                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                        Password
                                    </label>
                                    <Link to="/forgot-password" className="text-sm text-emerald-600 hover:text-emerald-700">
                                        Forgot password?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FiLock className="text-gray-400" />
                                    </div>
                                    <input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors flex items-center justify-center"
                            >
                                {loading ? (
                                    <><FiLoader className="animate-spin mr-2" /> Signing in...</>
                                ) : (
                                    'Sign In'
                                )}
                            </button>
                        </form>

                        <div className="relative flex items-center justify-center my-6">
                            <div className="border-t border-gray-200 absolute w-full"></div>
                            <div className="bg-white px-4 relative z-10 text-sm text-gray-500">or continue with</div>
                        </div>

                        <button
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className="w-full py-3 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors flex items-center justify-center"
                        >
                            <FcGoogle size={20} className="mr-2" /> Sign in with Google
                        </button>

                        <p className="text-center mt-8 text-gray-600">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-emerald-600 hover:text-emerald-700 font-medium">
                                Create account
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;