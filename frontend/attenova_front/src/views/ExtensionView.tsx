import React from "react";
import { Download, Chrome, ShieldCheck, Zap, Layers, Cpu } from "lucide-react";
import { motion } from "motion/react";

export default function ExtensionView() {
  return (
    <div className="max-w-4xl mx-auto py-12 space-y-16">
      <div className="text-center space-y-4">
        <div className="inline-flex p-3 bg-primary/10 text-primary rounded-2xl mb-4">
          <Chrome size={32} />
        </div>
        <h1 className="text-5xl font-black italic tracking-tighter">Attenova <span className="text-primary">Guardian</span></h1>
        <p className="text-foreground/60 text-xl max-w-2xl mx-auto">
          The official browser extension that bridges your web activity directly to Attenova's focus engine.
        </p>
        <div className="pt-6">
          <button className="bg-primary text-black px-10 py-5 rounded-3xl text-xl font-black flex items-center justify-center gap-3 mx-auto hover:scale-105 transition-all shadow-xl shadow-primary/20">
            <Download size={24} />
            Download For Chrome
          </button>
          <p className="text-[10px] micro-label mt-4 opacity-40 italic">v1.0.4 • Manifest v3 Compatible</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass p-10 rounded-[40px] space-y-6 border-primary/20 bg-primary/5">
          <h3 className="text-2xl font-black flex items-center gap-3">
             <ShieldCheck className="text-primary" /> 
             Tab Lockdown
          </h3>
          <p className="text-foreground/70 leading-relaxed">
            Automatically restricts distracting sites during active sessions. 
            Block lists sync instantly between your web dashboard and the browser.
          </p>
          <div className="flex flex-wrap gap-2 pt-4">
            {['YouTube', 'ChatGPT', 'Reddit', 'Netflix'].map(s => (
              <span key={s} className="px-3 py-1 bg-foreground/5 rounded-full text-[10px] font-bold uppercase tracking-widest">{s}</span>
            ))}
            <span className="text-primary text-[10px] font-bold uppercase tracking-widest">+ Custom List</span>
          </div>
        </div>

        <div className="glass p-10 rounded-[40px] space-y-6">
          <h3 className="text-2xl font-black flex items-center gap-3">
             <Cpu className="text-accent" /> 
             Smart Analysis
          </h3>
          <p className="text-foreground/70 leading-relaxed">
            Advanced background polling for keyboard density and mouse precision. 
            Detects "Fake Productivity" and prompts for real engagement.
          </p>
          <div className="p-4 glass border-white/5 rounded-2xl flex items-center gap-4">
             <div className="w-10 h-10 primary-bg rounded-lg flex items-center justify-center font-bold text-black animate-pulse">
                <Zap size={20} />
             </div>
             <div>
                <p className="text-[10px] micro-label opacity-50">Sync Status</p>
                <p className="text-sm font-bold">Encrypted Bridge Active</p>
             </div>
          </div>
        </div>
      </div>

      <div className="glass rounded-[50px] p-12 relative overflow-hidden bg-foreground/[0.02]">
         <div className="relative z-10 space-y-8">
            <h2 className="text-3xl font-black">How to Install</h2>
            <div className="space-y-6">
               {[
                 { step: "01", text: "Download the Attenova-Guardian.zip file using the button above." },
                 { step: "02", text: "Open chrome://extensions in your browser and enable 'Developer Mode'." },
                 { step: "03", text: "Drag and drop the extracted folder into the extensions page." },
                 { step: "04", text: "Pin the extension and log in to sync your active session data." }
               ].map((item, i) => (
                 <div key={i} className="flex gap-6 items-start">
                    <span className="text-primary font-black text-xl italic">{item.step}</span>
                    <p className="text-foreground/80 font-medium">{item.text}</p>
                 </div>
               ))}
            </div>
         </div>
         <Layers className="absolute -right-12 -bottom-12 w-64 h-64 text-primary/5 -rotate-12" />
      </div>
    </div>
  );
}
