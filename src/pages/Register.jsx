import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiLock, FiAlertCircle, FiArrowLeft, FiLoader } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signup, googleSignIn } = useAuth();
    const navigate = useNavigate();

    async function handleEmailSignup(e) {
        e.preventDefault();

        // Validate passwords match
        if (password !== confirmPassword) {
            return setError("Passwords do not match");
        }

        // Validate password strength
        if (password.length < 6) {
            return setError("Password must be at least 6 characters");
        }

        try {
            setError('');
            setLoading(true);
            await signup(email, password, name);
            navigate('/');
        } catch (error) {
            let errorMessage = "Failed to create account";

            if (error.code === 'auth/email-already-in-use') {
                errorMessage = "Email already in use";
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = "Invalid email address format";
            } else if (error.code === 'auth/weak-password') {
                errorMessage = "Password is too weak";
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }

    async function handleGoogleSignup() {
        try {
            setError('');
            setLoading(true);
            await googleSignIn();
            navigate('/');
        } catch (error) {
            setError("Failed to sign up with Google");
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="pt-24 pb-16">
                <div className="w-full max-w-md px-4 mx-auto">
                    <div className="p-8 bg-white shadow-subtle rounded-2xl">
                        <Link
                            to="/"
                            className="inline-flex items-center mb-6 text-gray-600 hover:text-emerald-600"
                        >
                            <FiArrowLeft className="mr-2" /> Back to home
                        </Link>

                        <h1 className="mb-2 font-serif text-3xl font-bold text-gray-900">Create account</h1>
                        <p className="mb-6 text-gray-600">Join Dwella to find your dream property</p>

                        {error && (
                            <div className="flex items-start p-3 mb-6 text-red-700 rounded-lg bg-red-50">
                                <FiAlertCircle className="mr-2 mt-0.5 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleEmailSignup} className="space-y-5">
                            <div>
                                <label htmlFor="name" className="block mb-1 text-sm font-medium text-gray-700">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <FiUser className="text-gray-400" />
                                    </div>
                                    <input
                                        id="name"
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        className="block w-full py-3 pl-10 pr-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        placeholder="John Doe"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="email" className="block mb-1 text-sm font-medium text-gray-700">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <FiMail className="text-gray-400" />
                                    </div>
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="block w-full py-3 pl-10 pr-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        placeholder="you@example.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="password" className="block mb-1 text-sm font-medium text-gray-700">
                                    Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <FiLock className="text-gray-400" />
                                    </div>
                                    <input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="block w-full py-3 pl-10 pr-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="block mb-1 text-sm font-medium text-gray-700">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <FiLock className="text-gray-400" />
                                    </div>
                                    <input
                                        id="confirmPassword"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        className="block w-full py-3 pl-10 pr-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="flex items-center justify-center w-full py-3 text-white transition-colors rounded-lg bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                            >
                                {loading ? (
                                    <><FiLoader className="mr-2 animate-spin" /> Creating account...</>
                                ) : (
                                    'Create Account'
                                )}
                            </button>
                        </form>

                        <div className="relative flex items-center justify-center my-6">
                            <div className="absolute w-full border-t border-gray-200"></div>
                            <div className="relative z-10 px-4 text-sm text-gray-500 bg-white">or continue with</div>
                        </div>

                        <button
                            onClick={handleGoogleSignup}
                            disabled={loading}
                            className="flex items-center justify-center w-full py-3 text-gray-700 transition-colors bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                        >
                            <FcGoogle size={20} className="mr-2" /> Sign up with Google
                        </button>

                        <p className="mt-8 text-center text-gray-600">
                            Already have an account?{' '}
                            <Link to="/login" className="font-medium text-emerald-600 hover:text-emerald-700">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;