import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import ReactMarkdown from 'react-markdown'
import { motion, AnimatePresence } from "framer-motion"
import { Search, Home as HomeIcon, Settings, LogOut, MapPin, Brain, ArrowUp, ChevronLeft, ChevronRight } from "lucide-react"

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export function Home() {
    const [activeTab, setActiveTab] = useState("Home");
    const navigate = useNavigate();
    const [user, setUser] = useState<{
        username: string;
        email: string;
        first_name?: string;
        last_name?: string;
    } | null>(() => {
        const saved = localStorage.getItem("user");
        return saved ? JSON.parse(saved) : null;
    });

    useEffect(() => {
        const fetchUser = async () => {
            const token = localStorage.getItem("access_token");
            if (!token) return;

            try {
                const response = await fetch(`${BACKEND_URL}/user/`, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const userData = await response.json();

                    // The API returns the user object, update state and cache
                    const refinedData = typeof userData === 'string' ? { username: userData, email: "" } : userData;
                    setUser(refinedData);
                    localStorage.setItem("user", JSON.stringify(refinedData));
                } else if (response.status === 401) {
                    // Token expired or invalid
                    handleLogout();
                }
            } catch (err) {
                console.error("Failed to fetch user:", err);
            }
        };

        fetchUser();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("token_type");
        localStorage.removeItem("user");
        navigate("/login");
    };

    const [isProfilePopupOpen, setIsProfilePopupOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);

    // Manage preferences state for the interactive buttons
    const [prefs, setPrefs] = useState({
        location: "",
        budget_min: "",
        budget_max: "",
        rating_min: "",
        facilities: [] as string[],
        checkin: "",
        checkout: "",
        lang: "en"
    });

    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleChat = async () => {
        if (!inputValue.trim() || isStreaming) return;

        const userMsg = inputValue.trim();
        const newMessages = [...messages, { role: 'user' as const, content: userMsg }];
        setMessages(newMessages);
        setInputValue("");
        setIsStreaming(true);
        setIsRightSidebarOpen(true);
        setIsSidebarCollapsed(false);

        const token = localStorage.getItem("access_token");

        try {
            const response = await fetch(`${BACKEND_URL}/agent/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ message: userMsg })
            });

            if (!response.ok) throw new Error("Failed to connect to AI agent");

            const reader = response.body?.getReader();
            if (!reader) throw new Error("No response stream");

            // Add placeholder for assistant message
            setMessages(prev => [...prev, { role: 'assistant', content: "" }]);

            let assistantContent = "";
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split("\n");

                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (trimmedLine.startsWith("data: ")) {
                        const jsonStr = trimmedLine.replace("data: ", "").trim();
                        if (jsonStr === "[DONE]") continue;

                        try {
                            const data = JSON.parse(jsonStr);
                            if (data.type === "content") {
                                assistantContent += data.content;
                                setMessages(prev => {
                                    const latest = [...prev];
                                    const lastMsg = latest[latest.length - 1];
                                    if (lastMsg && lastMsg.role === "assistant") {
                                        lastMsg.content = assistantContent;
                                    }
                                    return latest;
                                });
                            } else if (data.type === "end") {
                                break;
                            }
                        } catch (e) {
                            // Incomplete JSON chunk
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Chat Error:", error);
            setMessages(prev => [...prev, { role: 'assistant', content: "I'm sorry, I encountered an issue. Let's try again." }]);
        } finally {
            setIsStreaming(false);
        }
    };

    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [passwordData, setPasswordData] = useState({
        password: "",
        new_password: ""
    });
    const [passwordError, setPasswordError] = useState("");
    const [passwordSuccess, setPasswordSuccess] = useState(false);
    const [isPasswordLoading, setIsPasswordLoading] = useState(false);

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError("");
        setPasswordSuccess(false);
        setIsPasswordLoading(true);

        const token = localStorage.getItem("access_token");

        try {
            const response = await fetch(`${BACKEND_URL}/user/password`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(passwordData)
            });

            if (response.status === 204) {
                setPasswordSuccess(true);
                setPasswordData({ password: "", new_password: "" });
                // Automatically close after success
                setTimeout(() => {
                    setIsPasswordModalOpen(false);
                    setPasswordSuccess(false);
                }, 2000);
            } else if (response.status === 422) {
                const data = await response.json();
                setPasswordError(data.detail?.[0]?.msg || "Invalid password data.");
            } else {
                setPasswordError("Failed to change password. Please check your current password.");
            }
        } catch (err) {
            setPasswordError("An error occurred. Please try again later.");
        } finally {
            setIsPasswordLoading(false);
        }
    };


    return (
        <div className="flex h-screen w-full bg-white text-[#202124] font-sans overflow-hidden">
            {/* Top header navigation */}
            <header className="absolute top-0 w-full h-16 flex items-center justify-between px-4 lg:px-6 pointer-events-none z-[40]">
                <div className="flex items-center gap-2 pointer-events-auto opacity-0 invisible">
                    {/* Spacer for toggle if needed */}
                </div>
                <div className="flex items-center gap-4 pointer-events-auto mt-2">
                    <div
                        onClick={() => setIsProfilePopupOpen(!isProfilePopupOpen)}
                        className="w-8 h-8 rounded-full bg-[#E37400] text-white flex items-center justify-center font-medium shadow-sm cursor-pointer uppercase shadow-orange-200 transition-transform active:scale-95"
                    >
                        {user?.first_name?.[0] || user?.username?.[0] || "U"}
                    </div>
                </div>
            </header>

            {/* Sidebar Left */}
            <aside className={`relative ${isSidebarCollapsed ? 'w-[72px]' : 'w-[280px]'} h-full flex-shrink-0 flex flex-col py-3 pt-6 z-30 bg-white border-r border-[#dadce0] transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]`}>
                <button
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    className="absolute -right-3 top-8 w-6 h-6 bg-white border border-[#dadce0] rounded-full flex items-center justify-center text-[#5f6368] hover:text-[#1a73e8] hover:border-[#1a73e8] shadow-sm transition-all z-40 pointer-events-auto group"
                >
                    {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>

                <div className={`px-6 mb-10 h-8 flex items-center gap-2 pointer-events-auto overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'opacity-0' : 'opacity-100'}`}>
                    <span className="text-[#202124] text-xl tracking-tight font-semibold whitespace-nowrap">Arthik Global</span>
                </div>

                <nav className="flex flex-col gap-1 px-3 overflow-hidden">
                    <button
                        onClick={() => setActiveTab("Home")}
                        className={`flex items-center gap-4 px-6 py-3 transition-all duration-200 group ${activeTab === "Home" ? "text-[#1a73e8]" : "text-[#5f6368] hover:text-[#202124]"}`}
                    >
                        <HomeIcon className={`w-5 h-5 flex-shrink-0 ${activeTab === "Home" ? "text-[#1a73e8]" : "group-hover:text-[#202124]"}`} />
                        {!isSidebarCollapsed && <span className={`text-[14px] font-medium whitespace-nowrap ${activeTab === "Home" ? "font-semibold" : ""}`}>Home</span>}
                    </button>
                    <button
                        onClick={() => setActiveTab("Preferences")}
                        className={`flex items-center gap-4 px-6 py-3 transition-all duration-200 group ${activeTab === "Preferences" ? "text-[#1a73e8]" : "text-[#5f6368] hover:text-[#202124]"}`}
                    >
                        <Settings className={`w-5 h-5 flex-shrink-0 ${activeTab === "Preferences" ? "text-[#1a73e8]" : "group-hover:text-[#202124]"}`} />
                        {!isSidebarCollapsed && <span className={`text-[14px] font-medium whitespace-nowrap ${activeTab === "Preferences" ? "font-semibold" : ""}`}>Preferences</span>}
                    </button>
                    <div className="my-4 mx-2 h-px bg-[#f1f3f4]" />
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-4 px-6 py-3 transition-all duration-200 text-[#5f6368] hover:text-rose-600 group"
                    >
                        <LogOut className="w-5 h-5 flex-shrink-0 group-hover:text-rose-600" />
                        {!isSidebarCollapsed && <span className="text-[14px] font-medium whitespace-nowrap">Logout</span>}
                    </button>
                </nav>
            </aside>

            {/* Main Wrapper */}
            <main className="flex-1 flex overflow-hidden mt-16 z-0 relative">
                {/* Center Column */}
                <div className="flex-1 flex flex-col relative transition-all duration-300">
                    <div className="flex-1 overflow-y-auto pb-32 pt-4 scrollbar-hide">
                        <div className="max-w-[720px] mx-auto px-6 w-full h-full">
                            {activeTab === "Home" ? (
                                <div className="w-full h-full flex flex-col items-center">
                                    <AnimatePresence mode="wait">
                                        {messages.length === 0 ? (
                                            <motion.div
                                                key="landing"
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -20, transition: { duration: 0.3 } }}
                                                className="w-full flex flex-col items-center mt-12"
                                            >
                                                <div className="relative group mb-3 shadow-lg rounded-full">
                                                    <div className="w-[104px] h-[104px] rounded-full bg-[#E37400] text-white flex items-center justify-center text-[44px] font-normal tracking-tight uppercase">
                                                        {user?.first_name?.[0] || user?.username?.[0] || "U"}
                                                    </div>
                                                </div>
                                                <h1 className="text-[32px] font-normal mb-1 tracking-tight text-[#202124]">
                                                    {user?.first_name ? `Hey, ${user.first_name}!` : "Welcome back"}
                                                </h1>
                                                <p className="text-[#5f6368] text-[16px] mb-12">How can I help you today?</p>
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="chat"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="w-full flex flex-col gap-8 py-4"
                                            >
                                                {messages.map((msg, idx) => (
                                                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} w-full`}>
                                                        <div className={`flex items-start gap-4 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                                            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-medium ${msg.role === 'user' ? 'bg-[#1a73e8] text-white shadow-md' : 'bg-slate-50 text-slate-600 border border-[#dadce0]'}`}>
                                                                {msg.role === 'user' ? (user?.first_name?.[0] || 'U') : <Brain className="w-4 h-4 text-[#1a73e8]" />}
                                                            </div>
                                                            <div className={`rounded-3xl px-5 py-3.5 text-[15px] leading-relaxed shadow-sm transition-all ${msg.role === 'user' ? 'bg-[#1a73e8] text-white rounded-tr-none' : 'bg-white text-[#202124] rounded-tl-none border border-[#dadce0]'}`}>
                                                                {msg.role === 'user' ? msg.content : (
                                                                    <ReactMarkdown
                                                                        components={{
                                                                            h3: ({ ...props }) => <h3 className="text-base font-bold text-[#1a73e8] mt-4 mb-2 first:mt-0" {...props} />,
                                                                            p: ({ ...props }) => <p className="mb-3 last:mb-0" {...props} />,
                                                                            strong: ({ ...props }) => <strong className="font-semibold text-black" {...props} />,
                                                                            ul: ({ ...props }) => <ul className="list-disc pl-5 mb-3 space-y-1.5" {...props} />,
                                                                            li: ({ ...props }) => <li className="pl-1" {...props} />
                                                                        }}
                                                                    >
                                                                        {msg.content || (isStreaming && idx === messages.length - 1 ? "Thinking..." : "")}
                                                                    </ReactMarkdown>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                <div ref={messagesEndRef} />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ) : (
                                <div className="w-full py-6">
                                    <h2 className="text-[28px] font-normal mb-8 text-[#202124]">Preferences</h2>
                                    <div className="bg-white border border-[#dadce0] rounded-2xl p-8 shadow-sm mb-12 space-y-8">
                                        <div className="flex flex-col border border-[#dadce0] rounded-xl p-5 hover:border-[#1a73e8] transition-colors">
                                            <h3 className="text-[14px] font-semibold text-[#202124] mb-3 flex items-center gap-2 uppercase tracking-wide">
                                                <MapPin className="w-4 h-4 text-[#1a73e8]" /> Location
                                            </h3>
                                            <input
                                                type="text"
                                                value={prefs.location}
                                                onChange={(e) => setPrefs({ ...prefs, location: e.target.value })}
                                                placeholder="Where are you traveling?"
                                                className="w-full bg-[#f8f9fa] border-none rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#1a73e8] outline-none"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="flex flex-col border border-[#dadce0] rounded-xl p-5">
                                                <h3 className="text-[13px] font-bold text-[#5f6368] mb-3 uppercase">Min Budget</h3>
                                                <select value={prefs.budget_min} onChange={(e) => setPrefs({ ...prefs, budget_min: e.target.value })} className="bg-[#f8f9fa] p-2.5 rounded-lg text-sm border-none outline-none">
                                                    <option value="0">0 ($)</option><option value="50">50 ($)</option><option value="100">100 ($)</option>
                                                </select>
                                            </div>
                                            <div className="flex flex-col border border-[#dadce0] rounded-xl p-5">
                                                <h3 className="text-[13px] font-bold text-[#5f6368] mb-3 uppercase">Max Budget</h3>
                                                <select value={prefs.budget_max} onChange={(e) => setPrefs({ ...prefs, budget_max: e.target.value })} className="bg-[#f8f9fa] p-2.5 rounded-lg text-sm border-none outline-none">
                                                    <option value="500">500 ($)</option><option value="1000">1,000 ($)</option><option value="1000000">No Limit</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="flex flex-col border border-[#dadce0] rounded-xl p-5">
                                            <h3 className="text-[13px] font-bold text-[#5f6368] mb-3 uppercase">Check-in Date</h3>
                                            <input type="date" value={prefs.checkin} onChange={(e) => setPrefs({ ...prefs, checkin: e.target.value })} className="bg-[#f8f9fa] p-2.5 rounded-lg text-sm border-none outline-none" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Floating Input Bar */}
                    <motion.div
                        initial={false}
                        animate={messages.length > 0 ? { bottom: 32, top: "auto", y: 0 } : { top: "45%", bottom: "auto", y: "-50%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 100 }}
                        className="absolute left-0 right-0 px-6 z-20"
                    >
                        <div className="max-w-[720px] w-full mx-auto">
                            <div className="relative group bg-[#f1f3f4] rounded-[24px] transition-all hover:bg-[#e8eaed] focus-within:bg-white focus-within:shadow-xl focus-within:border-[#dadce0] border border-transparent">
                                <div className="absolute inset-y-0 left-0 pl-[18px] flex items-center pointer-events-none">
                                    <Search className="w-[18px] h-[18px] text-[#5f6368]" />
                                </div>
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleChat(); }
                                    }}
                                    placeholder="Message AI Agent..."
                                    className="w-full bg-transparent text-[#202124] rounded-[24px] py-[15px] pl-12 pr-14 outline-none placeholder:text-[#5f6368] text-[16px]"
                                />
                                <button
                                    onClick={handleChat}
                                    disabled={!inputValue.trim() || isStreaming}
                                    className={`absolute right-2 top-1.5 bottom-1.5 w-[42px] bg-[#1a73e8] text-white rounded-full transition-all flex items-center justify-center disabled:opacity-0 ${inputValue.trim() ? 'opacity-100' : 'opacity-0'} hover:bg-[#1557b0]`}
                                >
                                    <ArrowUp className="w-5 h-5" />
                                </button>
                            </div>

                            <AnimatePresence>
                                {messages.length === 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="mt-6 flex flex-wrap items-center justify-center gap-3"
                                    >
                                        {["Search Hotels", "Match Preferences", "Vendor Sync"].map(pill => (
                                            <button key={pill} onClick={() => { setInputValue(pill); setTimeout(handleChat, 0); }} className="px-5 py-2.5 rounded-full border border-[#dadce0] text-[14px] font-medium text-[#3c4043] bg-white hover:bg-[#f8f9fa] shadow-sm transition-all">{pill}</button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </div>

                {/* Right Process Sidebar */}
                <aside className={`h-full bg-slate-50 border-l border-[#dadce0] transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden flex flex-col ${isRightSidebarOpen ? 'w-[320px] lg:w-[400px]' : 'w-0 border-none'}`}>
                    <div className="w-[320px] lg:w-[400px] flex flex-col h-full bg-[#fcfcfd]">
                        <div className="h-14 flex items-center justify-between px-6 border-b border-[#dadce0] bg-white">
                            <h2 className="text-sm font-bold text-[#1a73e8] uppercase tracking-widest">Process</h2>
                            <button onClick={() => setIsRightSidebarOpen(false)} className="p-1.5 rounded-full hover:bg-slate-100 text-[#5f6368]"><LogOut className="w-4 h-4 rotate-180" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            <div className="space-y-4">
                                <h3 className="text-[11px] font-bold text-[#5f6368] uppercase tracking-[0.1em]">Current Activity</h3>
                                <div className="space-y-4">
                                    {[
                                        { l: "Parsing requirements", s: "done" },
                                        { l: "Scoping vendors", s: "active" },
                                        { l: "Price negotiation", s: "wait" },
                                        { l: "Reviewing photos", s: "wait" }
                                    ].map((st, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${st.s === 'done' ? 'bg-[#1a73e8]' : st.s === 'active' ? 'bg-[#1a73e8] animate-ping' : 'bg-[#dadce0]'}`} />
                                            <span className={`text-[13px] ${st.s === 'wait' ? 'text-[#5f6368]' : 'text-[#202124] font-medium'}`}>{st.l}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="p-5 bg-[#1a73e8] rounded-2xl text-white shadow-lg shadow-blue-100">
                                <div className="flex items-center gap-2 mb-2 opacity-80"><Brain className="w-4 h-4" /><span className="text-[10px] font-bold uppercase">AI Insight</span></div>
                                <p className="text-[13px] leading-relaxed">Direct connection established with 3 local vendors. Fetching exclusive rates for your selected dates.</p>
                            </div>
                        </div>
                    </div>
                </aside>
            </main>

            {/* Popups */}
            {isProfilePopupOpen && (
                <div className="fixed inset-0 z-[100] flex items-start justify-end p-4 pt-16 pointer-events-auto" onClick={() => setIsProfilePopupOpen(false)}>
                    <div className="w-[360px] bg-white rounded-[28px] shadow-2xl border border-[#dadce0] p-6 mt-2 mr-2 pointer-events-auto overflow-hidden relative" onClick={e => e.stopPropagation()}>
                        <div className="flex flex-col items-center">
                            <div className="w-20 h-20 rounded-full bg-[#E37400] text-white flex items-center justify-center text-3xl mb-4 shadow-inner uppercase">{user?.first_name?.[0] || "U"}</div>
                            <h3 className="text-xl font-medium text-[#202124] mb-1">{user?.first_name} {user?.last_name}</h3>
                            <p className="text-[#5f6368] text-sm mb-6">{user?.email}</p>
                            <div className="w-full h-px bg-[#f1f3f4] mb-6" />
                            <div className="w-full space-y-3 mb-8">
                                <button onClick={() => { setActiveTab("Preferences"); setIsProfilePopupOpen(false); }} className="w-full py-2.5 rounded-full border border-[#dadce0] text-sm font-medium text-[#3c4043] hover:bg-slate-50 flex items-center justify-center gap-2"><Settings className="w-4 h-4" /> Preferences</button>
                                <button onClick={() => { setIsPasswordModalOpen(true); setIsProfilePopupOpen(false); }} className="w-full py-2.5 rounded-full bg-[#1a73e8] text-white text-sm font-medium hover:bg-[#1557b0] shadow-md">Change Password</button>
                            </div>
                            <button onClick={handleLogout} className="text-[#5f6368] text-xs hover:text-[#202124] hover:underline">Sign out</button>
                        </div>
                    </div>
                </div>
            )}

            {isPasswordModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm pointer-events-auto" onClick={() => setIsPasswordModalOpen(false)}>
                    <div className="w-full max-w-md bg-white rounded-[28px] shadow-2xl p-8 animate-in fade-in zoom-in duration-300 pointer-events-auto" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-medium text-[#202124] mb-6">Change Password</h2>
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <input type="password" required value={passwordData.password} onChange={e => setPasswordData({ ...passwordData, password: e.target.value })} className="w-full bg-[#f8f9fa] border border-[#dadce0] rounded-xl px-4 py-3 outline-none focus:border-[#1a73e8]" placeholder="Current Password" />
                            <input type="password" required minLength={6} value={passwordData.new_password} onChange={e => setPasswordData({ ...passwordData, new_password: e.target.value })} className="w-full bg-[#f8f9fa] border border-[#dadce0] rounded-xl px-4 py-3 outline-none focus:border-[#1a73e8]" placeholder="New Password" />
                            {passwordError && <div className="text-rose-600 text-xs">{passwordError}</div>}
                            {passwordSuccess && <div className="text-emerald-600 text-xs">Password updated!</div>}
                            <div className="pt-4 flex flex-col gap-2">
                                <button type="submit" disabled={isPasswordLoading} className="w-full bg-[#1a73e8] text-white py-3 rounded-full font-medium hover:bg-[#1557b0] transition-all disabled:opacity-50 shadow-md">{isPasswordLoading ? "Updating..." : "Update Password"}</button>
                                <button type="button" onClick={() => setIsPasswordModalOpen(false)} className="w-full py-3 text-[#5f6368] hover:bg-slate-50 transition-all">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
