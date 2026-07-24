import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, Sparkles, Lock, User } from 'lucide-react';

const Login = ({ onLogin }) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!username || !password) {
            setError("Please enter username and password");
            return;
        }

        setLoading(true);

        // Hardcoded credentials - No Firebase/MongoDB
        setTimeout(() => {
            if (username === "admin" && password === "admin") {
                localStorage.setItem("isAuthenticated", "true");
                localStorage.setItem("userName", "Admin User");
                localStorage.setItem("userRole", "Cost Controller");
                if (onLogin) onLogin();
                navigate("/dashboard");
            } else {
                setError("Invalid username or password. Use admin/admin");
                setLoading(false);
            }
        }, 800);
    };

    const fillDemo = () => {
        setUsername("admin");
        setPassword("admin");
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-200/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-200/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            {/* Main Container */}
            <div className="relative z-10 w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 items-center">
                {/* Left Side - Branding & Info */}
                <div className="text-center lg:text-left space-y-6">
                    {/* Logo */}
                    <div className="inline-flex items-center justify-center gap-3 bg-white/80 backdrop-blur-sm px-8 py-4 rounded-2xl shadow-lg">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-md">
                            <span className="text-white text-xl font-extrabold tracking-tight">CI</span>
                        </div>
                        <div className="flex flex-col leading-tight text-left">
                            <span className="text-lg font-extrabold text-slate-800 tracking-tight">Cost Insights</span>
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Dashboard</span>
                        </div>
                    </div>

                    {/* Headline */}
                    <div className="space-y-3">
                        <h2 className="text-4xl lg:text-5xl font-extrabold text-slate-800 leading-tight">
                            Smart Budget
                            <br />
                            <span className="bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-500 bg-clip-text text-transparent">
                                Intelligence
                            </span>
                        </h2>
                        <p className="text-lg text-slate-600 max-w-md">
                            AI-powered cost tracking with real-time analytics and intelligent insights for better decision making.
                        </p>
                    </div>

                    {/* Features */}
                    <div className="grid grid-cols-2 gap-4 max-w-md">
                        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/60 shadow-sm">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-2">
                                <Sparkles className="w-5 h-5 text-blue-600" />
                            </div>
                            <h3 className="font-semibold text-slate-800 text-sm">AI Analytics</h3>
                            <p className="text-xs text-slate-500 mt-1">Smart categorization</p>
                        </div>
                        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/60 shadow-sm">
                            <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center mb-2">
                                <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                            <h3 className="font-semibold text-slate-800 text-sm">Real-time</h3>
                            <p className="text-xs text-slate-500 mt-1">Live tracking</p>
                        </div>
                    </div>
                </div>

                {/* Right Side - Login Form */}
                <div className="w-full max-w-md mx-auto">
                    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 p-8">
                        {/* Form Header */}
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center mx-auto mb-4 shadow-lg overflow-hidden">
                                <span className="text-white text-2xl font-extrabold tracking-tight">CI</span>
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800">Welcome Back</h2>
                            <p className="text-slate-500 text-sm mt-1">Sign in to access your dashboard</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Username Field */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-sm font-semibold text-slate-700">
                                        Username
                                    </label>
                                    <button
                                        type="button"
                                        onClick={fillDemo}
                                        className="text-blue-600 text-xs font-semibold hover:text-blue-700 transition cursor-pointer"
                                    >
                                        Use demo
                                    </button>
                                </div>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="Enter your username"
                                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:bg-white focus:outline-none transition-all"
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                        <Lock className="w-5 h-5" />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter your password"
                                        className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:bg-white focus:outline-none transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="p-3 bg-red-50 border-2 border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
                                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                    {error}
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold text-sm hover:from-blue-700 hover:to-cyan-700 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer group"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Signing in...
                                    </>
                                ) : (
                                    <>
                                        Access Dashboard
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Demo Info */}
                        <div
                            onClick={fillDemo}
                            className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl cursor-pointer hover:border-blue-300 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
                                    <span className="text-xl">🔐</span>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-800">Demo Credentials</p>
                                    <p className="text-xs text-slate-600 mt-0.5">
                                        Username: <span className="font-mono font-semibold text-blue-600">admin</span> /
                                        Password: <span className="font-mono font-semibold text-blue-600">admin</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <p className="text-center text-sm text-slate-500 mt-6">
                        Powered by <span className="font-semibold text-blue-600">AI Analytics</span> • Secure & Fast
                    </p>
                </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500" />
        </div>
    );
};

export default Login;
