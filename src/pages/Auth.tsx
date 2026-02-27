import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { User, Mail, Lock, UserPlus, LogIn, ChevronRight, Globe } from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export const Auth: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    // Handle Google Callback
    React.useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");

        if (code) {
            handleGoogleCallback(code);
        }
    }, []);

    const handleGoogleCallback = async (code: string) => {
        setLoading(true);
        try {
            const response = await fetch(`${BACKEND_URL}/auth/google/callback`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ code }),
            });

            if (response.ok) {
                const data = await response.json();
                // Handle cases where token might be a raw string or inside an object
                const token = typeof data === "string" ? data : (data.access_token || data.token);

                if (token) {
                    localStorage.setItem("access_token", token);
                    localStorage.setItem("token_type", "bearer");
                    navigate("/home");
                } else {
                    setError("Could not retrieve access token.");
                }
            } else {
                setError("Google authentication failed. Please try again.");
            }
        } catch (err) {
            setError("Network error during Google login.");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${BACKEND_URL}/auth/google/login`, {
                method: "POST",
            });

            if (response.ok) {
                const data = await response.json();
                console.log("DEBUG: Google Login Response:", data);
                // Handle both cases: plain string or { "url": "..." } object
                const redirectUrl = typeof data === "string" ? data : (data.url || data.authorization_url);

                if (redirectUrl) {
                    window.location.href = redirectUrl;
                } else {
                    setError("Invalid response from Google Login service.");
                }
            } else {
                setError("Could not initialize Google Login.");
            }
        } catch (err) {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const [formData, setFormData] = useState({
        username: "",
        email: "",
        first_name: "",
        last_name: "",
        password: "",
        role: "user",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (isLogin) {
            try {
                const formDataUrlEncoded = new URLSearchParams();
                formDataUrlEncoded.append("username", formData.username);
                formDataUrlEncoded.append("password", formData.password);
                formDataUrlEncoded.append("grant_type", "password");

                const response = await fetch(`${BACKEND_URL}/auth/token`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body: formDataUrlEncoded,
                });

                if (response.ok) {
                    const data = await response.json();
                    localStorage.setItem("access_token", data.access_token);
                    localStorage.setItem("token_type", data.token_type);
                    navigate("/home");
                } else {
                    const errData = await response.json();
                    setError(errData.detail || "Authentication failed. Please check your credentials.");
                }
            } catch (err) {
                setError("Network error. Could not connect to authentication server.");
            } finally {
                setLoading(false);
            }
        } else {
            try {
                const response = await fetch(`${BACKEND_URL}/auth/`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(formData),
                });

                if (response.ok) {
                    setError("Signup successful! Please login.");
                    setIsLogin(true);
                } else {
                    const errData = await response.json();
                    setError(errData.detail?.[0]?.msg || "Signup failed. Account may already exist.");
                }
            } catch (err) {
                setError("Network error. Please try again later.");
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden font-sans">
            {/* Background Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/5 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-white/5 rounded-full blur-[120px]" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: [0.19, 1, 0.22, 1] }}
                className="w-full max-w-[480px] z-10"
            >
                <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-10 md:p-14 shadow-2xl">
                    <div className="flex flex-col items-center mb-12">
                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6 border border-white/5">
                            <Globe className="text-white w-8 h-8 font-thin" />
                        </div>
                        <h2 className="text-white text-3xl font-thin tracking-[0.2em] uppercase mb-2">
                            Arthik <span className="opacity-40 italic">Global</span>
                        </h2>
                        <p className="text-white/30 text-xs tracking-[0.4em] uppercase">
                            {isLogin ? "Authenticate System" : "Create Neural Link"}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <AnimatePresence mode="wait">
                            {!isLogin && (
                                <motion.div
                                    key="signup-fields"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-6 overflow-hidden"
                                >
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="relative group">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 w-4 h-4 group-focus-within:text-white transition-colors" />
                                            <input
                                                type="text"
                                                name="first_name"
                                                placeholder="First Name"
                                                required
                                                onChange={handleChange}
                                                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-all font-light"
                                            />
                                        </div>
                                        <div className="relative group">
                                            <input
                                                type="text"
                                                name="last_name"
                                                placeholder="Last Name"
                                                required
                                                onChange={handleChange}
                                                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-6 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-all font-light"
                                            />
                                        </div>
                                    </div>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 w-4 h-4 group-focus-within:text-white transition-colors" />
                                        <input
                                            type="email"
                                            name="email"
                                            placeholder="Email Address"
                                            required
                                            onChange={handleChange}
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-all font-light"
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="relative group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 w-4 h-4 group-focus-within:text-white transition-colors" />
                            <input
                                type="text"
                                name="username"
                                placeholder="Username"
                                required
                                onChange={handleChange}
                                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-all font-light"
                            />
                        </div>

                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 w-4 h-4 group-focus-within:text-white transition-colors" />
                            <input
                                type="password"
                                name="password"
                                placeholder="Password"
                                required
                                onChange={handleChange}
                                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-all font-light"
                            />
                        </div>

                        {error && (
                            <p className="text-white/60 text-[10px] tracking-widest uppercase text-center bg-white/5 py-3 rounded-xl border border-white/10 animate-pulse">
                                {error}
                            </p>
                        )}

                        <button
                            disabled={loading}
                            className="w-full group relative bg-white text-black rounded-2xl py-5 text-xs font-bold uppercase tracking-[0.4em] overflow-hidden transition-all hover:tracking-[0.6em] disabled:opacity-50"
                        >
                            <div className="relative z-10 flex items-center justify-center gap-2">
                                {loading ? "Processing..." : isLogin ? "Proceed" : "Create Account"}
                                {!loading && <ChevronRight className="w-4 h-4" />}
                            </div>
                            <div className="absolute inset-0 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                        </button>

                        <div className="relative flex items-center gap-4 py-2">
                            <div className="h-[1px] flex-1 bg-white/10" />
                            <span className="text-[10px] text-white/20 tracking-widest uppercase">Or</span>
                            <div className="h-[1px] flex-1 bg-white/10" />
                        </div>

                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className="w-full group relative bg-white/[0.03] border border-white/10 text-white rounded-2xl py-4 text-xs font-bold uppercase tracking-[0.3em] overflow-hidden transition-all hover:bg-white/[0.08] hover:tracking-[0.4em] disabled:opacity-50"
                        >
                            <div className="relative z-10 flex items-center justify-center gap-3">
                                <svg className="w-4 h-4" viewBox="0 0 24 24">
                                    <path
                                        fill="currentColor"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    />
                                </svg>
                                {loading ? "Connecting..." : "Continue with Google"}
                            </div>
                        </button>
                    </form>

                    <div className="mt-12 text-center">
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-white/30 text-[10px] tracking-[0.3em] uppercase hover:text-white transition-colors flex items-center gap-2 mx-auto group"
                        >
                            {isLogin ? (
                                <>
                                    <UserPlus className="w-3 h-3 group-hover:scale-110 transition-transform" />
                                    Request Access
                                </>
                            ) : (
                                <>
                                    <LogIn className="w-3 h-3 group-hover:scale-110 transition-transform" />
                                    Existing Account
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
