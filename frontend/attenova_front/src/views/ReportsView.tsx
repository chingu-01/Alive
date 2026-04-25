import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BarChart3, TrendingUp, Target, Shield, Clock, Calendar, Download, FileText, Image as ImageIcon, ChevronDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { db } from "../lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";

export default function ReportsView() {
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const getWeekRange = () => {
    const today = new Date();
    const first = today.getDate() - today.getDay();
    const last = first + 6;
    const start = new Date(today.setDate(first)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const end = new Date(today.setDate(last)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${start} — ${end}`;
  };

  const [avgFocusScore, setAvgFocusScore] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      const q = query(
        collection(db, "sessions"),
        where("userId", "==", user.uid),
        orderBy("startTime", "asc")
      );
      const snapshot = await getDocs(q);
      
      const now = new Date();
      const startOfWeek = new Date();
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0,0,0,0);

      const sessions = snapshot.docs.map(doc => doc.data()).filter(s => s.endTime);
      
      const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const currentWeekData = daysOfWeek.map(day => ({ name: day, focus: 0, count: 0 }));

      let totalScoreForWeek = 0;
      let sessionsInWeekCount = 0;

      sessions.forEach((s: any) => {
        const date = new Date(s.startTime?.toDate());
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const dayData = currentWeekData.find(d => d.name === dayName);

        if (date >= startOfWeek) {
          totalScoreForWeek += (Number(s.averageScore) || 0);
          sessionsInWeekCount += 1;
        }

        if (dayData) {
          const duration = Number(s.actualDuration) || 0;
          dayData.focus += (duration / 60);
          dayData.count += 1;
        }
      });

      setAvgFocusScore(sessionsInWeekCount > 0 ? Math.round(totalScoreForWeek / sessionsInWeekCount) : 0);
      setData(currentWeekData);
      setLoading(false);
    };
    fetchStats();
  }, [user]);

  const handleDownload = async (type: 'pdf' | 'image') => {
    if (!reportRef.current) return;
    setShowDownloadMenu(false);
    
    try {
      const dataUrl = await toPng(reportRef.current, {
        cacheBust: true,
        backgroundColor: '#09090b',
        width: 1200,
        height: reportRef.current.offsetHeight,
        style: {
          borderRadius: '0px',
          width: '1200px',
        }
      });

      if (type === 'pdf') {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const img = new Image();
        img.src = dataUrl;
        
        await new Promise((resolve) => (img.onload = resolve));
        
        const pdfHeight = (img.height * pdfWidth) / img.width;
        pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`attenova-report-${Date.now()}.pdf`);
      } else {
        const link = document.createElement('a');
        link.download = `attenova-report-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error(`${type.toUpperCase()} Export error:`, err);
      alert("Failed to export report. This might be due to your browser's security settings or complex CSS colors. Try using a standard browser without strict security extensions.");
    }
  };

  const downloadAsPDF = () => handleDownload('pdf');
  const downloadAsImage = () => handleDownload('image');

  const stats = [
    { label: "Completion Rate", value: "94%", icon: <Target className="text-primary" /> },
    { label: "Peak Performance", value: "9:00 AM", icon: <TrendingUp className="text-green-500" /> },
    { label: "Avg Focus Depth", value: `${avgFocusScore}%`, icon: <Clock className="text-accent" /> },
    { label: "Goal Success", value: "85%", icon: <Shield className="text-blue-500" /> }
  ];

  if (loading) return <div className="h-96 glass animate-pulse rounded-[40px]" />;

  return (
    <div className="space-y-12 py-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tight">Performance <span className="text-primary">Analytics</span></h2>
          <p className="text-foreground/50 text-sm">Deep dive into your behavioral study patterns.</p>
        </div>
        <div className="relative">
          <button 
            onClick={() => setShowDownloadMenu(!showDownloadMenu)}
            className="bg-primary text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20"
          >
            <Download size={20} />
            Download Report
            <ChevronDown size={16} className={`transition-transform ${showDownloadMenu ? 'rotate-180' : ''}`} />
          </button>
          
          <AnimatePresence>
            {showDownloadMenu && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 mt-2 w-48 glass rounded-2xl overflow-hidden z-50 border border-white/10"
              >
                <button 
                  onClick={downloadAsPDF}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-primary/10 transition-colors text-left"
                >
                  <FileText size={18} className="text-primary" />
                  <span className="font-bold text-sm">Download PDF</span>
                </button>
                <button 
                  onClick={downloadAsImage}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-primary/10 transition-colors text-left"
                >
                  <ImageIcon size={18} className="text-accent" />
                  <span className="font-bold text-sm">Download Image</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div ref={reportRef} className="space-y-12 p-12 rounded-[40px] bg-[#09090b] text-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-foreground/10 pb-8 gap-4">
           <div className="space-y-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-black">
                  <BarChart3 size={18} strokeWidth={3} />
                </div>
                <h1 className="text-xl font-bold tracking-tight">Attenova <span className="text-primary font-black">REPORT</span></h1>
              </div>
              <p className="micro-label opacity-40">Weekly Performance Analytics</p>
              <h3 className="text-2xl font-black">{getWeekRange()}</h3>
           </div>
           <div className="text-right space-y-1">
              <p className="text-sm font-bold text-primary">{user?.displayName || 'Attenova User'}</p>
              <p className="text-xs opacity-40 font-mono italic">{user?.email}</p>
              <p className="text-[10px] opacity-20 mt-2">Generated on {new Date().toLocaleDateString()}</p>
           </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <div key={i} className="bg-white/[0.03] border border-white/5 p-6 rounded-3xl space-y-4">
              <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">{s.icon}</div>
              <div>
                <p className="micro-label opacity-40 text-[10px]">{s.label}</p>
                <p className="text-2xl font-black">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white/[0.03] border border-white/5 rounded-[40px] p-8 min-h-[400px]">
          <h3 className="text-xl font-bold mb-8">Weekly Activity Breakdown</h3>
          <div className="w-full h-[300px] min-h-[300px]">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#ffffff80', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#ffffff80', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#111111', border: '1px solid #333333', borderRadius: '16px', color: '#ffffff' }}
                />
                <Bar dataKey="focus" radius={[8, 8, 8, 8]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#F97316' : '#FB923C'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
