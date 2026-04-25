import React from "react";
import { motion } from "motion/react";
import { Download, Share2, ArrowRight, Zap, Target, Clock, AlertTriangle } from "lucide-react";
import { formatDuration } from "../lib/utils";

export default function ReportView({ session, onDone }: { session: any, onDone: () => void }) {
  const plannedDuration = Number(session.plannedDuration) || 60;
  const actualDuration = Number(session.actualDuration) || 0;
  const tabSwitches = isNaN(Number(session.tabSwitches)) || session.tabSwitches == null ? 0 : Number(session.tabSwitches);
  const efficiency = plannedDuration > 0 ? Math.round((actualDuration / plannedDuration) * 100) : 0;
  const averageScore = isNaN(Number(session.averageScore)) || session.averageScore == null ? 0 : Number(session.averageScore);

  const scoreColor = averageScore >= 90 ? 'text-green-500' : averageScore >= 70 ? 'text-primary' : 'text-yellow-500';

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black uppercase tracking-tight">Session <span className="text-primary">Summary</span></h2>
        <div className="flex gap-4">
        </div>
      </div>

      <div id="session-report" className="glass rounded-[40px] overflow-hidden p-8 md:p-16 space-y-12">
        <div className="flex flex-col md:flex-row justify-between gap-8 md:items-center">
            <div className="space-y-2">
               <p className="text-lg font-bold opacity-30 uppercase tracking-widest leading-none">Overall Score</p>
               <h3 className={`text-8xl md:text-9xl font-black ${scoreColor} leading-none tracking-tighter`}>
                 {Math.round(averageScore)}
               </h3>
               <span className="px-4 py-1 bg-primary/10 text-primary rounded-full font-bold text-sm">
                 {session.classification || 'Good'} Performance
               </span>
            </div>

            <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                <div>
                   <p className="text-xs font-bold opacity-40 uppercase tracking-widest mb-1">Time Studied</p>
                   <p className="text-2xl font-black tabular-nums">{formatDuration(actualDuration)}</p>
                </div>
                <div>
                   <p className="text-xs font-bold opacity-40 uppercase tracking-widest mb-1">Status</p>
                   <p className="text-2xl font-black">Completed</p>
                </div>
                <div>
                   <p className="text-xs font-bold opacity-40 uppercase tracking-widest mb-1">Productive</p>
                   <p className="text-2xl font-black text-green-500">{Number(session.productiveMinutes) || 0}m</p>
                </div>
                <div>
                   <p className="text-xs font-bold opacity-40 uppercase tracking-widest mb-1">Distracted</p>
                   <p className="text-2xl font-black text-red-500">{Number(session.distractedMinutes) || 0}m</p>
                </div>
            </div>
        </div>

        <div className="h-[2px] bg-foreground/5 w-full" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl border border-foreground/5 flex items-center gap-4">
             <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                <Target />
             </div>
             <div>
                <p className="text-xs font-bold opacity-50 uppercase">Planned</p>
                <p className="font-black text-lg">{Math.round(plannedDuration / 60)}m</p>
             </div>
          </div>
          <div className="p-6 rounded-3xl border border-foreground/5 flex items-center gap-4">
             <div className="w-12 h-12 bg-accent/10 text-accent rounded-2xl flex items-center justify-center">
                <Clock />
             </div>
             <div>
                <p className="text-xs font-bold opacity-50 uppercase">Efficiency</p>
                <p className="font-black text-lg">{isNaN(efficiency) ? 0 : efficiency}%</p>
             </div>
          </div>
          <div className="p-6 rounded-3xl border border-foreground/5 flex items-center gap-4">
             <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center">
                <AlertTriangle />
             </div>
             <div>
                <p className="text-xs font-bold opacity-50 uppercase">Tab Switches</p>
                <p className="font-black text-lg">{tabSwitches}</p>
             </div>
          </div>
        </div>

        <div className="bg-foreground/5 p-8 rounded-3xl space-y-4">
          <p className="text-xs font-bold opacity-40 uppercase tracking-widest">Focus Insight</p>
          <p className="text-xl leading-relaxed italic">
            "{session.quote}" — You stayed true to your goal, but watch out for those tab switches!
          </p>
        </div>

        {session.detectedTabs && session.detectedTabs.length > 0 && (
          <div className="space-y-4">
            <p className="text-xs font-bold opacity-40 uppercase tracking-widest">Active Domains Detected</p>
            <div className="flex flex-wrap gap-2">
              {session.detectedTabs.map((domain: string, i: number) => (
                <span key={i} className="px-3 py-1.5 glass bg-primary/5 border-primary/20 rounded-xl text-xs font-bold text-primary">
                  {domain}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <button
        onClick={onDone}
        className="w-full bg-foreground text-background py-5 rounded-2xl text-xl font-black hover:bg-foreground/90 transition-all flex items-center justify-center gap-3"
      >
        Return to Dashboard
        <ArrowRight />
      </button>
    </div>
  );
}
