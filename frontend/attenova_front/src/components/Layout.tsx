import React, { useState } from "react";
import { Sun, Moon, LogOut, LayoutDashboard, History, BarChart3, Settings, Zap, BookOpen, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

export default function Layout({ children, onNavigate, currentView }: { 
  children: React.ReactNode; 
  onNavigate: (view: string) => void;
  currentView: string;
}) {
  const { theme, toggleTheme } = useTheme();
  const { user, profile, login, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'setup', label: 'New Session', icon: <Zap size={20} /> },
    { id: 'history', label: 'History', icon: <History size={20} /> },
    { id: 'reports', label: 'Reports', icon: <BarChart3 size={20} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

  const handleLogout = () => {
    if (currentView === 'session') {
      alert("A study session is in progress. Please complete or end the session before signing out.");
      return;
    }
    logout();
  };

  const handleNavigate = (id: string) => {
    if (currentView === 'session' && id !== 'session') {
      alert("A study session is in progress. Please complete or end the session before navigating.");
      return;
    }
    onNavigate(id);
    setIsMobileMenuOpen(false);
  };

  if (!user || currentView === 'landing') {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="fixed top-0 left-0 right-0 z-[60] px-6 py-4 flex items-center justify-between glass border-x-0 border-t-0 rounded-none bg-background/80">
           <div 
             className="flex items-center gap-3 cursor-pointer group"
             onClick={() => handleNavigate('landing')}
           >
             <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-black group-hover:scale-110 transition-transform">
               <BookOpen size={20} strokeWidth={3} />
             </div>
             <h1 className="text-xl font-bold tracking-tight">Attenova</h1>
           </div>
           <div className="flex items-center gap-3">
             <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-foreground/5 mr-2 transition-colors">
               {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
             </button>
             {!user ? (
               <button 
                onClick={() => login()}
                className="bg-primary text-white px-5 py-2 rounded-xl font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
               >
                 <div className="bg-white p-1 rounded-lg">
                   <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" className="w-4 h-4 object-contain" alt="Google" />
                 </div>
                 Sign In
               </button>
             ) : (
               <div className="flex items-center gap-3">
                 <button 
                  onClick={() => onNavigate('dashboard')}
                  className="hidden sm:flex bg-foreground/5 hover:bg-foreground/10 px-4 py-2 rounded-xl font-bold text-xs transition-all border border-foreground/10"
                 >
                   Open Dashboard
                 </button>
                 <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-4 py-2 rounded-xl font-bold text-xs transition-all border border-red-500/20"
                 >
                   <LogOut size={14} />
                   <span className="hidden sm:inline">Sign Out</span>
                 </button>
               </div>
             )}
           </div>
        </header>
        <main className="flex-1 w-full pt-16">{children}</main>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col md:flex-row overflow-hidden bg-background text-foreground">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 glass rounded-none border-x-0 border-t-0 z-50">
        <div 
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => handleNavigate('landing')}
        >
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-black">
            <BookOpen size={18} strokeWidth={2.5} />
          </div>
          <h1 className="text-lg font-bold tracking-tight">Attenova</h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleTheme}
            className="p-2 text-foreground/60"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-foreground/60"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex w-72 glass rounded-none border-y-0 border-l-0 flex flex-col p-8 gap-12 z-40 bg-background/40">
        <div 
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => handleNavigate('landing')}
        >
          <div className="w-9 h-9 bg-primary shadow-lg shadow-primary/20 rounded-xl flex items-center justify-center text-white transition-transform">
            <BookOpen size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Attenova</h1>
            <p className="micro-label opacity-40 leading-none mt-0.5">Focus Analytics</p>
          </div>
        </div>

        <nav className="flex flex-col gap-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                currentView === item.id 
                ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                : 'text-foreground/50 hover:bg-foreground/5 hover:text-foreground'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto space-y-4">
          <div className="p-5 glass rounded-2xl bg-foreground/[0.02] border-primary/5">
            <div className="space-y-2">
              <p className="micro-label">Current Streak</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-primary leading-none">{profile?.currentStreak || 0}</span>
                <span className="text-[10px] font-bold opacity-40 uppercase">Days</span>
              </div>
              <div className="h-1 w-full bg-foreground/5 rounded-full overflow-hidden">
                 <motion.div 
                   className="h-full bg-primary" 
                   initial={{ width: 0 }}
                   animate={{ width: `${Math.min(((profile?.currentStreak || 0) % 7) / 7 * 100, 100)}%` }}
                 />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-2 glass rounded-2xl bg-background/50 border-foreground/5">
            <div className="flex items-center gap-3 pr-2">
              <img 
                src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
                alt="User" 
                className="w-8 h-8 rounded-full border border-primary/20"
              />
              <div className="flex flex-col overflow-hidden">
                 <span className="text-xs font-bold truncate">{user.displayName?.split(' ')[0]}</span>
                 <button onClick={handleLogout} className="text-[9px] font-bold text-red-500/60 hover:text-red-500 transition-colors text-left">Sign Out</button>
              </div>
            </div>
            <button 
              onClick={toggleTheme} 
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-foreground/5 transition-colors text-foreground/40"
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="md:hidden fixed inset-0 top-[65px] bg-background z-[60] p-6 flex flex-col gap-8"
          >
            <nav className="flex flex-col gap-4">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className={`flex items-center gap-4 p-4 rounded-xl font-bold tracking-tight uppercase italic text-sm transition-colors ${
                    currentView === item.id 
                    ? 'bg-primary text-black' 
                    : 'bg-foreground/5 text-foreground/60'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="mt-auto space-y-6">
              <div className="flex items-center justify-between p-4 glass rounded-xl">
                <div className="flex items-center gap-3">
                  <img 
                    src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
                    alt="User" 
                    className="w-10 h-10 rounded-full border border-primary/20"
                  />
                  <div className="flex flex-col">
                    <span className="font-bold">{user.displayName}</span>
                    <button onClick={handleLogout} className="text-xs text-red-500 text-left font-bold uppercase tracking-tight">Sign Out</button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 md:p-12 relative">
        <div className="max-w-6xl mx-auto h-full">
           {children}
        </div>
      </main>
    </div>
  );
}
