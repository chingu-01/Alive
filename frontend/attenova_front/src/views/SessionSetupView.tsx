import React, { useState } from "react";
import { motion } from "motion/react";
import { Clock, Quote, Sparkles, Plus, X, Globe } from "lucide-react";

export default function SessionSetupView({ onStart }: { onStart: (duration: number, quote: string, allowedSites: string[]) => void }) {
  const [duration, setDuration] = useState(25);
  const [quote, setQuote] = useState("");

  const durations = [5, 15, 25, 45, 60, 90, 120];

  return (
    <div className="max-w-2xl mx-auto space-y-12 py-12">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-black">Ready to <span className="text-primary">Focus?</span></h2>
        <p className="text-foreground/60">Set your goals and let's get to work.</p>
      </div>

      <div className="glass rounded-[40px] p-8 md:p-12 space-y-10">
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-primary">
            <Clock size={20} />
            <span className="micro-label">Session Duration (minutes)</span>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {durations.map(d => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={`py-3 rounded-2xl font-bold transition-all ${duration === d ? 'bg-primary text-black scale-105 shadow-lg shadow-primary/20' : 'glass hover:border-primary'}`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-2 text-primary">
            <Quote size={20} />
            <span className="micro-label">Your Focus Quote (Optional)</span>
          </div>
          <input
            type="text"
            placeholder="What drives you today? (Leave blank to skip)"
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
            className="w-full bg-foreground/5 border border-foreground/10 focus:border-primary/50 rounded-2xl px-6 py-4 outline-none transition-all placeholder:text-foreground/20 italic font-medium"
          />
        </div>

        <button
          onClick={() => onStart(duration, quote || "Stay focused on your goals.", [])}
          className="w-full bg-primary text-white py-5 rounded-2xl text-xl font-black hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-xl shadow-primary/20"
        >
          <Sparkles size={24} />
          Launch Session
        </button>
      </div>
    </div>
  );
}
