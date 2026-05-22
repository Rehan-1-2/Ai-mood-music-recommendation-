import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, updateProfile } from 'firebase/auth';
import Footer from './Footer';
import { UserProfile } from '../types';
import { auth, googleProvider } from '../src/lib/firebase';

interface LandingPageProps {
  isDark: boolean;
  toggleTheme: () => void;
}

const FeatureCard: React.FC<{ icon: string; title: string; children: React.ReactNode, index: number }> = ({ icon, title, children, index }) => {
  return (
    <div 
      className="bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-8 rounded-2xl shadow-xl backdrop-blur-md h-full hover:bg-white/80 dark:hover:bg-white/10 hover:border-indigo-200 dark:hover:border-white/20 transition-all duration-300 group hover:-translate-y-2 hover:shadow-2xl"
      style={{ animation: `fadeInUp 0.6s ease-out ${index * 0.15}s forwards`, opacity: 0 }}
    >
      <div className="mb-6 flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-fuchsia-500/10 dark:from-white/10 dark:to-white/0 border border-indigo-100 dark:border-white/10 text-indigo-500 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300 shadow-inner group-hover:shadow-[0_0_15px_rgba(99,102,241,0.3)]">
        <i className={`fa-solid ${icon} text-2xl group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors`}></i>
      </div>
      <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-3 tracking-tight">{title}</h3>
      <p className="text-slate-600 dark:text-slate-300/80 leading-relaxed font-light">{children}</p>
    </div>
  );
}

const LandingPage: React.FC<LandingPageProps> = ({ isDark, toggleTheme }) => {
  const [showLogin, setShowLogin] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartClick = () => {
    setShowLogin(true);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      if (isLoginMode) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (userCredential.user && username) {
          await updateProfile(userCredential.user, { displayName: username });
        }
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      setError(err.message || "An error occurred during authentication.");
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error("Google login error:", err);
      setError(err.message || "Google Sign-In failed.");
      setIsLoading(false);
    }
  };

  return (
    <>
    <div className="flex-grow flex flex-col items-center justify-center text-center p-4 relative z-10 w-full" style={{ animation: `fadeIn 1s ease-out forwards`}}>
      
      <div className="absolute top-6 right-6">
        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm hover:scale-110 transition-all duration-300 text-slate-600 dark:text-slate-300"
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          <i className={`fa-solid ${isDark ? 'fa-sun' : 'fa-moon'}`}></i>
        </button>
      </div>

      {!showLogin ? (
        <>
            <header className="py-20 md:py-28">
                <div className="inline-flex items-center justify-center p-1 mb-8 rounded-full border border-indigo-500/20 dark:border-indigo-400/30 bg-indigo-500/10 backdrop-blur-md shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                <span className="px-5 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-200 uppercase tracking-widest">AI Powered Recommendations</span>
                </div>
                <div className="flex flex-col items-center justify-center mb-8">
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 dark:text-white mb-6 drop-shadow-2xl">
                    Feel the <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 dark:from-indigo-300 dark:via-purple-300 dark:to-fuchsia-300 animate-pulse-slow">Music</span>
                </h1>
                </div>
                <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-600 dark:text-slate-300/90 leading-relaxed font-light">
                Tired of endlessly scrolling? Describe your mood, and let our AI curate a playlist that truly understands you.
                </p>
            </header>

            <section className="w-full max-w-6xl mx-auto mb-32 px-4">
                <div className="grid md:grid-cols-3 gap-8">
                <FeatureCard icon="fa-feather" title="Speak Your Mind" index={0}>
                    Don't hold back. Whether you're feeling the quiet melancholy of a rainy afternoon or the electric thrill of a new achievement, share it.
                </FeatureCard>
                <FeatureCard icon="fa-brain" title="Intelligent Analysis" index={1}>
                    Our AI, powered by Google's Gemini, acts as your personal music empath. It delves into the context of your story to grasp the precise feeling.
                </FeatureCard>
                <FeatureCard icon="fa-record-vinyl" title="Instant Soundtrack" index={2}>
                    In moments, a bespoke playlist materializes. Each song is a chapter in your current story, complete with album art and Spotify links.
                </FeatureCard>
                </div>
            </section>

            <div className="mb-24">
                <button
                    onClick={handleStartClick}
                    className="group relative inline-flex h-[64px] items-center justify-center overflow-hidden rounded-full bg-slate-900 dark:bg-white/10 border border-transparent dark:border-white/20 px-12 font-bold text-white transition-all duration-300 hover:bg-slate-800 dark:hover:bg-white/20 hover:scale-105 shadow-[0_0_30px_rgba(99,102,241,0.3)] focus:outline-none backdrop-blur-md"
                >
                    <span className="mr-3 text-lg tracking-wide">Find Your Vibe</span>
                    <i className="fa-solid fa-wand-magic-sparkles transition-transform group-hover:rotate-12 text-indigo-300 text-xl"></i>
                    <div className="absolute inset-0 -z-10 bg-gradient-to-r from-indigo-600/50 to-fuchsia-600/50 opacity-0 transition-opacity duration-500 group-hover:opacity-100 blur-xl"></div>
                </button>
            </div>
        </>
      ) : (
        <div className="w-full min-h-[60vh] flex flex-col items-center justify-center animate-fadeInUp">
            <div className="w-full max-w-md bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl p-8 relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-fuchsia-500/20 rounded-full blur-3xl"></div>

                <div className="relative z-10">
                    <button 
                        onClick={() => setShowLogin(false)}
                        className="absolute top-0 left-0 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                    >
                        <i className="fa-solid fa-arrow-left text-lg"></i>
                    </button>

                    <div className="text-center mb-8 mt-4">
                        <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-fuchsia-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                             <i className="fa-solid fa-music text-3xl text-white"></i>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{isLoginMode ? 'Welcome Back' : 'Create Account'}</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                            {isLoginMode ? 'Enter your details to sign in.' : 'Join us to discover your vibe.'}
                        </p>
                    </div>

                    <form onSubmit={handleLoginSubmit} className="space-y-4">
                        
                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-medium animate-fadeIn">
                                <i className="fa-solid fa-circle-exclamation mr-2"></i>
                                {error}
                            </div>
                        )}

                        {!isLoginMode && (
                            <div className="animate-fadeIn">
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 ml-1">Username</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <i className="fa-regular fa-user text-slate-400 group-focus-within:text-indigo-500 transition-colors"></i>
                                    </div>
                                    <input 
                                        type="text" 
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-800 dark:text-white placeholder-slate-400 transition-all"
                                        placeholder="johndoe"
                                        required={!isLoginMode}
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 ml-1">Email Address</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <i className="fa-regular fa-envelope text-slate-400 group-focus-within:text-indigo-500 transition-colors"></i>
                                </div>
                                <input 
                                    type="email" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-800 dark:text-white placeholder-slate-400 transition-all"
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 ml-1">Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <i className="fa-solid fa-lock text-slate-400 group-focus-within:text-indigo-500 transition-colors"></i>
                                </div>
                                <input 
                                    type="password" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-800 dark:text-white placeholder-slate-400 transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {isLoginMode && (
                            <div className="flex justify-end">
                                <button type="button" className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium">
                                    Forgot Password?
                                </button>
                            </div>
                        )}

                        <button 
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 mt-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <i className="fa-solid fa-spinner fa-spin"></i>
                            ) : (
                                <>
                                    <span>{isLoginMode ? 'Sign In' : 'Sign Up'}</span>
                                    <i className="fa-solid fa-arrow-right"></i>
                                </>
                            )}
                        </button>
                    </form>

                    <div className="flex items-center gap-4 my-6">
                        <div className="h-px flex-1 bg-slate-200 dark:bg-white/10"></div>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase">Or</span>
                        <div className="h-px flex-1 bg-slate-200 dark:bg-white/10"></div>
                    </div>

                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                        className="w-full py-3 px-4 bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 rounded-xl text-slate-700 dark:text-white font-medium shadow-sm hover:shadow-md hover:bg-slate-50 dark:hover:bg-white/20 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed group"
                    >
                        {isLoading ? (
                             <i className="fa-solid fa-spinner fa-spin text-slate-400"></i>
                        ) : (
                            <>
                                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                <span>Continue with Google</span>
                            </>
                        )}
                    </button>

                    <div className="mt-8 text-center">
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                            {isLoginMode ? "Don't have an account?" : "Already have an account?"}
                            <button 
                                onClick={() => {
                                    setIsLoginMode(!isLoginMode);
                                    setEmail('');
                                    setPassword('');
                                    setUsername('');
                                }}
                                className="ml-2 font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                            >
                                {isLoginMode ? 'Sign Up' : 'Log In'}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
      )}

    </div>
    <Footer />
    </>
  );
};

export default LandingPage;