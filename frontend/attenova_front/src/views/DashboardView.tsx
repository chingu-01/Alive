import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { History, TrendingUp, Zap, Calendar, ArrowRight, BarChart3, Target, Shield } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { db } from "../lib/firebase";
import { collection, query, where, onSnapshot, orderBy, limit } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { formatDuration } from "../lib/utils";

export default function DashboardView({ onStart, onSelectSession, onNavigate }: { onStart: () => void, onSelectSession: (s: any) => void, onNavigate: (v: string) => void }) {
  const { user, profile } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const qSessions = query(
      collection(db, "sessions"),
      where("userId", "==", user.uid),
      orderBy("startTime", "desc")
    );
    
    const unsubscribe = onSnapshot(qSessions, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSessions(data);
      
      // Calculate weekly data
      const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const currentWeekData = daysOfWeek.map(day => ({ name: day, focus: 0 }));
      
      const startOfWeek = new Date();
      startOfWeek.setHours(0,0,0,0);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

      snapshot.docs.forEach(doc => {
        const s = doc.data();
        if (s.startTime) {
           const date = new Date(s.startTime.toDate());
           if (date >= startOfWeek) {
             const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
             const dayData = currentWeekData.find(d => d.name === dayName);
             const duration = Number(s.actualDuration) || 0;
             if (dayData) dayData.focus += (duration / 60);
           }
        }
      });
      setWeeklyData(currentWeekData);
      setLoading(false);
    }, (error) => {
      console.error("Dashboard listener error:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const now = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const last7DaysSessions = sessions.filter(s => {
    if (!s.startTime) return false;
    const sessionDate = s.startTime.toDate();
    return sessionDate >= sevenDaysAgo;
  });

  const totalSessionsInWeek = last7DaysSessions.length;

  // Efficiency: Average of (actual / planned) across the week's sessions
  // Mathematically correct weekly average
  const totalEfficiency = last7DaysSessions.reduce((acc, s) => {
    const planned = Number(s.plannedDuration) || 0;
    if (planned <= 0) return acc;
    const actual = Number(s.actualDuration) || 0;
    const sessionEfficiency = actual / planned;
    return acc + (isNaN(sessionEfficiency) ? 0 : sessionEfficiency);
  }, 0);
  const efficiency = totalSessionsInWeek > 0 
    ? Math.min(100, Math.round((totalEfficiency / totalSessionsInWeek) * 100)) 
    : 0;

  // Avg Focus Depth: Average focus score across all sessions in the last 7 days
  const totalFocusScore = last7DaysSessions.reduce((acc, s) => acc + (Number(s.averageScore) || 0), 0);
  const avgFocusDepth = totalSessionsInWeek > 0 
    ? Math.round(totalFocusScore / totalSessionsInWeek) 
    : 0;

  return (
    <div className="space-y-12 py-8 pb-24">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
         <div className="space-y-1">
            <h2 className="text-4xl font-bold tracking-tight">
              Focus <span className="text-primary italic">Dashboard</span>
            </h2>
            <p className="text-foreground/50 font-medium font-sm">Welcome back, {user?.displayName?.split(' ')[0]}. Here is your cognitive performance overview.</p>
         </div>
         <button 
           onClick={onStart}
           className="bg-primary text-white px-8 py-3.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
         >
           <Zap size={18} />
           Start Session
         </button>
      </header>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Efficiency", value: `${efficiency || 0}`, unit: "%", icon: <TrendingUp size={22} />, color: "text-primary", bg: "bg-primary/5" },
          { label: "Avg Focus Depth", value: `${avgFocusDepth || 0}`, unit: "%", icon: <Target size={22} />, color: "text-purple-500", bg: "bg-purple-500/5" },
          { label: "Current Streak", value: `${profile?.currentStreak || 0}`, unit: "Days", icon: <Calendar size={22} />, color: "text-emerald-500", bg: "bg-emerald-500/5" }
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass p-8 space-y-6 relative overflow-hidden group border-none bg-foreground/[0.02]"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center border border-current/10`}>
                {stat.icon}
              </div>
              <p className="micro-label">{stat.label}</p>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold tracking-tight tabular-nums">{stat.value}</h3>
              {stat.unit && <span className="text-xs font-bold opacity-40 uppercase">{stat.unit}</span>}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-8">
        {/* Weekly Graph Summary */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="text-primary" />
              <h3 className="text-2xl font-black uppercase tracking-tight">Weekly <span className="text-primary">Consistency</span></h3>
            </div>
            <button 
              onClick={() => onNavigate('reports')}
              className="text-xs font-bold text-primary hover:underline"
            >
              Full Report
            </button>
          </div>
          <div className="glass p-6 rounded-[40px] h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={weeklyData}>
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'currentColor', opacity: 0.3, fontSize: 10 }} />
                 <Tooltip 
                   cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                   contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '12px', fontSize: '12px' }}
                 />
                 <Bar dataKey="focus" radius={[8, 8, 8, 8]}>
                   {weeklyData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={index === new Date().getDay() ? '#F97316' : '#222'} />
                   ))}
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
          </div>
        </div>
        
        {/* Recent History (Shifted) */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <History className="text-primary" />
            <h3 className="text-2xl font-black uppercase tracking-tight">Recent Sessions</h3>
          </div>
          <div className="space-y-4">
            {loading ? (
              [1, 2, 3].map(i => <div key={i} className="h-24 bg-foreground/5 rounded-3xl animate-pulse" />)
            ) : sessions.length > 0 ? (
              sessions.map((s, i) => (
                <motion.div 
                  key={s.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="glass p-6 rounded-3xl flex items-center justify-between group hover:bg-primary/5 transition-all cursor-pointer"
                  onClick={() => onSelectSession(s)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${(Number(s.averageScore) || 0) >= 80 ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                      {Math.round(Number(s.averageScore) || 0)}
                    </div>
                    <div>
                      <h4 className="font-bold">Focus Session</h4>
                      <p className="text-xs text-foreground/40 font-medium">
                        {new Date(s.startTime?.toDate()).toLocaleDateString()} • {formatDuration(Number(s.actualDuration) || 0)}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="text-foreground/20 group-hover:text-primary group-hover:translate-x-1 transition-all" size={20} />
                </motion.div>
              ))
            ) : (
              <div className="glass p-12 rounded-3xl text-center text-foreground/40 font-medium">
                No sessions yet. Start your first focus journey today!
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
