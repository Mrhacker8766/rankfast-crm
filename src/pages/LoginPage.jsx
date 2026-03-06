import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogIn, TrendingUp, AlertCircle } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showAnimation, setShowAnimation] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Please enter both email and password.');
            return;
        }

        setIsLoading(true);

        try {
            const success = await login(email, password);
            if (success) {
                setShowAnimation(true);
                setTimeout(() => {
                    navigate('/');
                }, 1800);
            } else {
                setError('Invalid email or password.');
                setIsLoading(false);
            }
        } catch (err) {
            setError('Login failed. Please try again.');
            setIsLoading(false);
        }
    };

    // Full screen animation takeover
    if (showAnimation) {
        return (
            <div className="fixed inset-0 z-[100] bg-blue-600 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-800 opacity-90 mix-blend-multiply"></div>
                <div className="relative z-10 flex flex-col items-center animate-in fade-in zoom-in duration-500 ease-out">
                    <div className="w-24 h-24 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20 mb-8 shadow-2xl shadow-blue-900/50">
                        <TrendingUp className="w-12 h-12 text-white animate-pulse" />
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight drop-shadow-lg mb-4">
                        Rankfast
                    </h1>
                    <p className="text-blue-200 font-medium text-lg tracking-widest uppercase animate-pulse">Initializing Workspace...</p>
                </div>

                {/* Decorative background elements */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-75"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
            <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                        <TrendingUp className="w-8 h-8 text-white" />
                    </div>
                </div>
                <h2 className="mt-2 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
                    Welcome to Rankfast
                </h2>
                <p className="mt-2 text-center text-sm text-slate-600 font-medium">
                    Sign in to your sales workspace
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
                <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-100">
                    <form className="space-y-6" onSubmit={handleSubmit} autoComplete="off">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                <p className="font-medium">{error}</p>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5" htmlFor="email">
                                Email address
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="appearance-none block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-shadow font-medium"
                                autoComplete="off"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5" htmlFor="password">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="appearance-none block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-shadow font-medium"
                                autoComplete="new-password"
                            />
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-70"
                            >
                                {isLoading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Connecting...
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <LogIn className="w-5 h-5" />
                                        Sign In
                                    </div>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Background elements */}
            <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-50"></div>
            <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-[500px] h-[500px] bg-indigo-50 rounded-full blur-3xl opacity-50"></div>
        </div>
    );
}
