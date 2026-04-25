import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Pause, Play, Square, AlertCircle, Keyboard, MousePointer, AppWindow, EyeOff, Zap, Quote, TrendingUp } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, YAxis, XAxis } from "recharts";
import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp, updateDoc, doc, getDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { formatDuration, getClassification } from "../lib/utils";

interface SessionProps {
  durationMinutes: number;
  quote: string;
  allowedSites: string[];
  onEnd: (sessionData: any) => void;
}

export default function FocusSessionView({ durationMinutes, quote, allowedSites, onEnd }: SessionProps) {
  const { user } = useAuth();
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);
  const [isActive, setIsActive] = useState(true);
  const [score, setScore] = useState(100);
  const [scoreHistory, setScoreHistory] = useState<any[]>([]);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [isIdle, setIsIdle] = useState(false);
  const [keyboardActivity, setKeyboardActivity] = useState(0);
  const [detectedTabs, setDetectedTabs] = useState<string[]>([]);
  const [showAlert, setShowAlert] = useState(false);
  const [idleTime, setIdleTime] = useState(0);
  
  const activityRef = useRef<number>(0);
  const lastActiveRef = useRef<number>(Date.now());
  const timerRef = useRef<any>(null);
  const sessionIdRef = useRef<string | null>(null);

  // Initialize session in Firestore
  useEffect(() => {
    const initSession = async () => {
      if (!user) return;
      const docRef = await addDoc(collection(db, "sessions"), {
        userId: user.uid,
        startTime: serverTimestamp(),
        plannedDuration: durationMinutes * 60,
        quote,
        averageScore: 100,
        productiveMinutes: 0,
        distractedMinutes: 0,
        idleMinutes: 0,
        tabSwitches: 0
      });
      sessionIdRef.current = docRef.id;
    };
    initSession();
  }, [user]);

  // Timer logic
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
        
        // Activity tracking
        const now = Date.now();
        const timeSinceActive = (now - lastActiveRef.current) / 1000;
        
        if (timeSinceActive > 60) { // 60 seconds of inactivity
          setIsIdle(true);
          setIdleTime(prev => prev + 1);
        } else {
          setIsIdle(false);
        }

        // Calculate score accurately (Event-driven & Idle-based)
        let penalty = 0;
        
        // Idle penalty (only if really idle)
        if (isIdle) {
          penalty += 0.8; // Slow decay when idle
          if (timeSinceActive > 120) penalty += 1.2; // Acceleration of decay after 2 mins idle
        }
        
        setScore(prev => {
          // No base decay. We only decay on idle or specific events (handled in listeners).
          // We recover slightly if active in focusing tab.
          const recovery = (!isIdle && activityRef.current > 0) ? 0.2 : 0;
          const newScore = Math.max(0, Math.min(100, prev - penalty + recovery));
          setScoreHistory(hist => [...hist.slice(-20), { time: Date.now(), score: newScore }]);
          return newScore;
        });

        // Reset short-term activity
        activityRef.current = 0;
        setKeyboardActivity(prev => Math.max(0, prev - 1));

      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isActive, timeLeft, isIdle]);

  // Activity Listeners & Extension Bridge
  useEffect(() => {
    const handleActivity = () => {
      lastActiveRef.current = Date.now();
      activityRef.current += 1;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      handleActivity();
      setKeyboardActivity(prev => prev + 10);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // We handle penalties via extension messages now for more accuracy
        // But we still track the switch
        setTimeout(() => {
          if (document.visibilityState === 'hidden') {
            setShowAlert(true);
            // Smaller immediate penalty if we don't have extension info yet
            setScore(prev => Math.max(0, prev - 5)); 
          }
        }, 3000); 
      } else {
        setShowAlert(false);
      }
    };

    // Extension Communication Bridge
    // The extension monitors other tabs and sends activity messages
    const handleExtensionMessage = (event: MessageEvent) => {
      if (event.data?.type === 'ATTENOVA_ACTIVITY') {
        const { activityType, value, context, domain } = event.data;
        
        // If activity happens in another tab (external context)
        // Check if the domain is in the allowed whitelist
        const isAllowed = domain && allowedSites.some(site => domain.toLowerCase().includes(site.toLowerCase()));

        if (context === 'external' && !isAllowed) {
          if (activityType === 'KEYSTROKE') {
            // Punish typing in other tabs if NOT allowed
            setScore(prev => Math.max(0, prev - (value || 8)));
          }
          if (activityType === 'TAB_SWITCH') {
             setScore(prev => Math.max(0, prev - 15));
             setTabSwitches(prev => prev + 1);
          }
        } else {
          // Internal activity or activity on allowed site helps keep score
          if (activityType === 'KEYSTROKE') setKeyboardActivity(prev => prev + (value || 5));
          lastActiveRef.current = Date.now();
        }
      }
      if (event.data?.type === 'ATTENOVA_TAB_INFO') {
        const { domain } = event.data;
        setDetectedTabs(prev => prev.includes(domain) ? prev : [...prev, domain]);
      }
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('message', handleExtensionMessage);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('message', handleExtensionMessage);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const endSession = async () => {
    if (!sessionIdRef.current || !user) {
      onEnd({ averageScore: score, actualDuration: 0, quote });
      return;
    }
    
    setIsActive(false);
    const duration = Math.max(1, durationMinutes * 60 - timeLeft);
    const avgScore = scoreHistory.length > 0 
      ? scoreHistory.reduce((acc, curr) => acc + curr.score, 0) / scoreHistory.length 
      : score;

    const data = {
      endTime: new Date(),
      actualDuration: duration,
      averageScore: avgScore,
      productiveMinutes: Math.floor(duration / 60 * (avgScore / 100)),
      distractedMinutes: Math.ceil(duration / 60 * ((100 - avgScore) / 100)),
      idleMinutes: Math.floor(idleTime / 60),
      tabSwitches,
      detectedTabs,
      classification: getClassification(avgScore)
    };

    try {
      // Use local Date for immediate UI feedback in current session before sync
      await updateDoc(doc(db, "sessions", sessionIdRef.current), {
        ...data,
        endTime: serverTimestamp() // Still use server spec for DB consistency
      });
      
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const profileData = userSnap.data();
        const lastDate = profileData.lastSessionDate;
        const today = new Date();
        const todayStr = today.toLocaleDateString('en-CA'); // YYYY-MM-DD
        
        let newStreak = profileData.currentStreak || 0;
        const lastDateStr = profileData.lastSessionDate;
        
        if (!lastDateStr) {
          // First session ever
          newStreak = 1;
        } else {
          const lastDate = new Date(lastDateStr);
          const diffTime = today.getTime() - lastDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

          if (lastDateStr === todayStr) {
            // Already counted today
          } else if (diffDays <= 1) {
            // Successive day
            newStreak += 1;
          } else {
            // Streak broken
            newStreak = 1;
          }
        }

        await updateDoc(userRef, {
          currentStreak: newStreak,
          lastSessionDate: todayStr,
          totalFocusMinutes: (profileData.totalFocusMinutes || 0) + Math.floor(duration / 60)
        });
      }

      onEnd({ ...data, id: sessionIdRef.current, quote });
    } catch (err) {
      console.error("Session termination error:", err);
      // Fallback: pass local data so the user sees the report even if individual profile update fails
      onEnd({ ...data, id: sessionIdRef.current, quote });
    }
  };

  const progress = (timeLeft / (durationMinutes * 60)) * 100;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Timer & Score Card */}
        <div className="lg:col-span-2 space-y-8">
          <div className="glass rounded-[40px] p-12 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="absolute top-6 left-8 micro-label">Attention Level</div>
            <div className="w-48 h-48 rounded-full accent-ring flex items-center justify-center relative">
              <div className="absolute inset-2 rounded-full border border-foreground/5 shadow-inner" />
              <span className="text-7xl font-black italic primary-text">{Math.round(score)}</span>
            </div>
            <div className="mt-6 flex items-center gap-1 text-emerald-400 font-bold text-sm tracking-tight">
               <TrendingUp size={16} />
               {score > 80 ? '+4% Stable' : score > 50 ? 'Gaining Flow' : 'Low Focus'}
            </div>
          </div>

          <div className="glass rounded-[40px] p-12 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="absolute top-6 right-8 micro-label">Session Timer</div>
            <h2 className="text-8xl md:text-9xl font-mono font-medium tracking-tighter tabular-nums">
              {formatDuration(timeLeft)}
            </h2>
            <div className="flex items-center justify-center gap-4 pt-8">
              <button 
                onClick={() => setIsActive(!isActive)}
                className="w-14 h-14 glass rounded-full flex items-center justify-center hover:bg-foreground/5 transition-all"
              >
                {isActive ? <Pause size={24} /> : <Play size={24} />}
              </button>
              <button 
                onClick={endSession}
                className="px-8 py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full font-bold uppercase text-xs tracking-widest hover:bg-red-500/20 transition-all"
              >
                End Session
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar: Graph & Quote */}
        <div className="space-y-6">
          <div className="glass p-8 flex flex-col gap-4">
            <h3 className="micro-label">Distraction Log</h3>
            <div className="space-y-3">
               <div className="flex items-center justify-between p-3 glass border-foreground/5 rounded-xl">
                  <div className="flex items-center gap-3">
                     <div className="w-2 h-2 rounded-full bg-primary" />
                     <span className="text-xs font-semibold">Switches: {tabSwitches}</span>
                  </div>
                  <span className="text-[10px] font-mono opacity-60">Live</span>
               </div>
               <div className={`flex items-center justify-between p-3 glass border-foreground/5 rounded-xl transition-opacity ${isIdle ? 'opacity-100' : 'opacity-40'}`}>
                  <div className="flex items-center gap-3">
                     <div className={`w-2 h-2 rounded-full ${isIdle ? 'bg-yellow-400 animate-pulse' : 'bg-foreground/20'}`} />
                     <span className="text-xs font-semibold">Idle Mode</span>
                  </div>
                  <span className="text-[10px] font-mono opacity-60">{formatDuration(idleTime)}</span>
               </div>
            </div>
          </div>

          <div className="glass p-8 flex-1 flex flex-col gap-6">
            <h3 className="micro-label">Focus Quote</h3>
            <div className="flex-1 flex flex-col justify-center">
               <blockquote className="text-xl italic text-foreground/80 leading-relaxed font-serif">
                 "{quote}"
               </blockquote>
               <cite className="mt-4 text-xs font-bold text-primary">— Your Motivation</cite>
            </div>
          </div>
          
          <AnimatePresence>
            {isIdle && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-yellow-500 text-black p-4 rounded-2xl flex items-center gap-3 animate-pulse"
              >
                <AlertCircle />
                <p className="font-bold">Distraction potential detected!</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Distraction Alert Modal */}
      <AnimatePresence>
        {showAlert && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowAlert(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-background border-2 border-primary rounded-[40px] p-12 max-w-lg w-full relative z-10 text-center space-y-8"
            >
              <div className="w-24 h-24 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={48} />
              </div>
              <div className="space-y-4">
                <h2 className="text-4xl font-black">GET BACK TO WORK!</h2>
                <p className="text-foreground/60 text-lg">You seem to be distracted. Remember why you started:</p>
                <p className="text-2xl font-bold italic text-primary">"{quote}"</p>
              </div>
              <button 
                onClick={() => setShowAlert(false)}
                className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-lg"
              >
                I'm Back
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
