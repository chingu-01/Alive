import React from "react";
import { LogOut, Settings as SettingsIcon } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function SettingsView() {
  const { logout } = useAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-12 py-8 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center text-primary">
          <SettingsIcon size={32} />
        </div>
        <div className="text-center">
          <h2 className="text-3xl font-black uppercase tracking-tight">Account <span className="text-primary">Settings</span></h2>
          <p className="text-foreground/50 text-sm">Manage your account and session.</p>
        </div>
      </div>

      <div className="w-full max-w-sm glass p-8 space-y-6 flex flex-col items-center">
        <p className="text-center text-foreground/60">
          Ready to wrap up? Signed in as more than one account? You can sign out here.
        </p>
        <button 
          onClick={logout}
          className="w-full flex items-center justify-center gap-3 bg-red-500 text-white py-5 rounded-2xl text-xl font-black hover:bg-red-600 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-red-500/20"
        >
          <LogOut size={24} />
          Sign Out
        </button>
      </div>
    </div>
  );
}
