import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { History as HistoryIcon, ArrowRight, Calendar, Zap, Clock } from "lucide-react";
import { db } from "../lib/firebase";
import { collection, query, where, onSnapshot, orderBy, doc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { formatDuration } from "../lib/utils";

export default function HistoryView({ onSelectSession, onStart }: { onSelectSession: (session: any) => void, onStart: () => void }) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "sessions"),
      where("userId", "==", user.uid),
      orderBy("startTime", "desc")
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setSessions(data.filter((s: any) => s.endTime)); // Only show completed
      setLoading(false);
    }, (error) => {
      console.error("History listener error:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);


  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-24 bg-foreground/5 rounded-3xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8 py-4">
      <div className="flex items-center gap-3">
        <HistoryIcon className="text-primary" size={32} />
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tight">Focus <span className="text-primary">History</span></h2>
          <p className="text-foreground/50 text-sm">Review your past performance and growth.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {sessions.length > 0 ? (
          sessions.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onSelectSession(s)}
              className="glass p-6 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 group hover:border-primary transition-all cursor-pointer relative overflow-hidden"
            >
                <div className="flex flex-col items-center justify-center border-r border-foreground/10 pr-6 mr-6">
                  <span className="text-[10px] font-bold uppercase opacity-40">Date</span>
                  <div className="text-sm font-black italic text-primary">
                    {new Date(s.startTime?.toDate()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
                
                <div className="flex items-center gap-6 flex-1">
                  <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black ${
                    (Number(s.averageScore) || 0) >= 80 ? 'bg-green-500/10 text-green-500' : (Number(s.averageScore) || 0) >= 50 ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'
                  }`}>
                    <span className="text-xl">{Math.round(Number(s.averageScore) || 0)}</span>
                    <span className="text-[8px] uppercase opacity-60">F.Q.</span>
                  </div>
                  
                  <div>
                    <h4 className="font-bold text-lg mb-1">
                      {s.goal || "Deep Work Session"}
                    </h4>
                    <div className="flex items-center gap-4 text-xs font-medium text-foreground/40 italic">
                    <span className="flex items-center gap-1"><Clock size={12} /> {formatDuration(Number(s.actualDuration) || 0)} focus</span>
                    <span className="flex items-center gap-1"><Zap size={12} /> {Number(s.tabSwitches) || 0} switches</span>
                  </div>
                </div>
              </div>

              <div className="hidden md:block opacity-0 group-hover:opacity-100 transition-opacity">
                <blockquote className="text-xs italic text-foreground/30 max-w-[200px] truncate">
                  "{s.quote}"
                </blockquote>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-0 border-foreground/5">
                <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-foreground/5 hover:bg-primary hover:text-black px-6 py-3 rounded-2xl font-bold text-sm transition-all">
                  Details <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="glass p-20 rounded-[40px] text-center space-y-4">
            <div className="w-20 h-20 bg-foreground/5 rounded-full flex items-center justify-center mx-auto opacity-20">
              <HistoryIcon size={40} />
            </div>
            <p className="text-foreground/40 font-bold text-xl">No sessions recorded yet.</p>
            <button 
              onClick={onStart}
              className="text-primary font-bold hover:underline"
            >
              Start your first session
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
