import React from "react";
import { motion } from "motion/react";
import { Zap, Target, BarChart, Shield, BarChart3, TrendingUp, Cpu, Users, BookOpen, Layers, Laptop, LogOut, Clock, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function LandingView({ onStart }: { onStart: () => void }) {
  const { login, logout, user } = useAuth();

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative min-h-[90vh] flex flex-col items-center gap-24 pb-48">
      <div className="text-center space-y-8 max-w-4xl pt-32 px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] micro-label font-bold">
            <Zap size={12} className="fill-current" />
            Deep Focus Ecosystem
          </div>
          
          <h1 className="text-6xl md:text-8xl font-bold tracking-tight leading-tight">
            Master your <br />
            <span className="text-primary italic">Study Habits.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-foreground/50 max-w-2xl mx-auto leading-relaxed font-medium">
            Attenova helps you stay focused by blocking distractions and tracking 
            your progress while you study.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 justify-center pt-8"
        >
          {!user ? (
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={login}
                className="bg-primary text-white px-10 py-5 rounded-2xl text-xl font-bold hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-primary/30 flex items-center justify-center gap-4 border-2 border-primary/20 group"
              >
                Get Started
                <ArrowRight size={24} />
              </button>
              <p className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-30 italic">Secure Google Sign In</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6">
              <button
                onClick={onStart}
                className="bg-primary text-white px-10 py-4 rounded-xl text-lg font-bold hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3"
              >
                Go to Dashboard
                <TrendingUp size={20} />
              </button>
            </div>
          )}
        </motion.div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-7xl px-6">
        {[
          { icon: <Clock size={24} className="text-primary" />, title: "Smart Timer", desc: "Choose your study duration and start your session instantly." },
          { icon: <Target size={24} className="text-accent" />, title: "Goal Setting", desc: "Set clear objectives for every study session to stay on track." },
          { icon: <TrendingUp size={24} className="text-primary" />, title: "Session History", desc: "Keep track of every session and see your improvement over time." },
          { icon: <BarChart size={24} className="text-accent" />, title: "Advanced Reports", desc: "Detailed weekly and session reports with focus depth metrics." }
        ].map((feature, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="p-8 space-y-4"
          >
            <div className="w-10 h-10 rounded-xl bg-foreground/[0.03] flex items-center justify-center">
              {feature.icon}
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-lg">{feature.title}</h3>
              <p className="text-sm text-foreground/50 leading-relaxed">{feature.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* How It Works Section */}
      <section id="how-it-works" className="w-full max-w-7xl px-6 mt-32 space-y-20 scroll-mt-24">
        <div className="text-center space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">How it <span className="text-primary">Works</span></h2>
          <p className="text-foreground/50 max-w-2xl mx-auto font-medium">Follow these three simple steps to start mastering your attention.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="p-10 relative overflow-hidden group bg-foreground/[0.02] rounded-3xl">
            <div className="relative z-10 space-y-6">
              <div className="text-3xl font-black text-primary/20">01</div>
              <div className="space-y-3">
                <h3 className="text-2xl font-bold italic">Sign Up</h3>
                <p className="text-foreground/50 leading-relaxed text-sm font-medium">
                  Log in with your Google account. It's fast, secure, and keeps all your data synced across devices.
                </p>
              </div>
            </div>
          </div>

          <div className="p-10 relative overflow-hidden group bg-foreground/[0.02] rounded-3xl">
            <div className="relative z-10 space-y-6">
              <div className="text-3xl font-black text-accent/20">02</div>
              <div className="space-y-3">
                <h3 className="text-2xl font-bold italic">Start Session</h3>
                <p className="text-foreground/50 leading-relaxed text-sm font-medium">
                  Pick a duration (5m to 2h), set your goal, and let Attenova's Safe Mode protect your deep focus.
                </p>
              </div>
            </div>
          </div>

          <div className="p-10 relative overflow-hidden group bg-foreground/[0.02] rounded-3xl">
            <div className="relative z-10 space-y-6">
              <div className="text-3xl font-black text-primary/20">03</div>
              <div className="space-y-3">
                <h3 className="text-2xl font-bold italic">See Progress</h3>
                <p className="text-foreground/50 leading-relaxed text-sm font-medium">
                  Review your performance with detailed analytics, focus scores, and history to optimize your study habits.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-center pt-12">
          {!user && (
            <button
              onClick={login}
              className="bg-primary text-white px-12 py-5 rounded-2xl text-xl font-bold hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-primary/30"
            >
              Get Started Now
            </button>
          )}
        </div>
      </section>

      {/* Integration Workflow */}
      <section className="w-full max-w-7xl px-6 mt-48 space-y-20">
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] micro-label font-bold">
            Operational Protocol
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">How Attenova <span className="text-primary italic">Helps You</span></h2>
          <p className="text-foreground/50 max-w-2xl mx-auto font-medium">A simple way to stay focused while you study or work.</p>
        </div>

        <div className="flex flex-col md:flex-row items-start justify-center gap-12 relative">
          {/* Connecting line for desktop */}
          <div className="hidden md:block absolute top-[60px] left-[20%] right-[20%] h-0.5 bg-foreground/[0.05] z-0" />
          
          {[
            { 
              step: "01", 
              title: "Set a Goal", 
              desc: "Start your session by picking a duration and writing down what you want to achieve.",
              icon: <Target size={32} />
            },
            { 
              step: "02", 
              title: "Track Your Focus", 
              desc: "See how well you are concentrating with real-time updates and helpful scores.",
              icon: <Zap size={32} />
            },
            { 
              step: "03", 
              title: "Simple Progress", 
              desc: "Check your history to see how your study habits improve over time.",
              icon: <BarChart3 size={32} />
            }
          ].map((item, idx) => (
            <div key={idx} className="flex-1 space-y-6 relative z-10 group">
              <div className="w-16 h-16 rounded-2xl bg-background border-2 border-foreground/5 flex items-center justify-center text-primary group-hover:border-primary transition-colors duration-500">
                {item.icon}
                <div className="absolute -top-4 -right-4 w-8 h-8 bg-primary text-white rounded-lg flex items-center justify-center text-[10px] font-black italic shadow-lg">
                  {item.step}
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-bold">{item.title}</h3>
                <p className="text-sm text-foreground/50 leading-relaxed font-medium">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* About Section */}
      <section className="w-full max-w-7xl px-6 mt-48 space-y-20">
        <div className="max-w-3xl mx-auto text-center space-y-12">
          <div className="space-y-6">
            <div className="space-y-4 inline-flex flex-col items-center">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight">About <span className="text-primary italic">Attenova</span></h2>
              <div className="w-20 h-1.5 bg-primary rounded-full" />
            </div>
            
            <div className="space-y-6 text-lg md:text-xl font-medium leading-relaxed">
              <p className="text-foreground">
                Attenova was built with one goal: to help you take control of your attention in a world full of distractions.
              </p>
              <p className="text-foreground/50">
                We make it easy for you to build better study habits by tracking your focus and giving you clear, helpful insights into your progress every day.
              </p>
            </div>

            <div className="flex justify-center gap-12 pt-4">
              <div className="space-y-1">
                <p className="text-2xl md:text-3xl font-bold text-primary tracking-tight">Private & Secure</p>
                <p className="micro-label font-bold text-[10px]">Your Data Stays Yours</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl md:text-3xl font-bold text-accent tracking-tight">Stay in Flow</p>
                <p className="micro-label font-bold text-[10px]">Work Without Distractions</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Collaborative Research Section */}
      <section className="w-full mt-32 py-24 border-t border-foreground/5 relative">
         <div className="max-w-4xl mx-auto space-y-16 relative z-10 px-6">
            <div className="text-center space-y-4">
               <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Collaborative <span className="text-primary italic">Research</span></h2>
               <p className="text-foreground/50 text-lg font-medium">Engineered for academic concentration and cognitive performance.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
               <motion.div 
                 whileHover={{ y: -5 }}
                 className="flex-1 p-10 space-y-8 group transition-all"
               >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-sm">
                       <BarChart3 size={24} />
                    </div>
                    <h3 className="text-xl font-bold italic">Academic Institution</h3>
                  </div>
                  <div className="space-y-4">
                     <p className="text-2xl font-bold leading-tight text-foreground transition-colors">Vidyavardhaka College of Engineering</p>
                     <p className="text-sm font-medium leading-relaxed opacity-50">
                        An Autonomous Institute under VTU, Belagavi. Recognized for innovation in engineering education.
                     </p>
                     <div className="flex gap-4 pt-2">
                        <span className="px-3 py-1 bg-foreground/5 rounded-full text-[9px] font-bold uppercase tracking-wider opacity-60">VTU Affiliated</span>
                        <span className="px-3 py-1 bg-foreground/5 rounded-full text-[9px] font-bold uppercase tracking-wider opacity-60">Autonomous</span>
                     </div>
                  </div>
               </motion.div>

               <motion.div 
                 whileHover={{ y: -5 }}
                 className="flex-1 p-10 space-y-8 group transition-all"
               >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center text-accent shadow-sm">
                       <Shield size={24} />
                    </div>
                    <h3 className="text-xl font-bold italic">Strategic Support</h3>
                  </div>
                  <div className="space-y-8">
                     <div className="space-y-2">
                        <p className="micro-label opacity-40">Support Email</p>
                        <a href="mailto:attenova.support@gmail.com" className="text-xl font-bold hover:text-primary transition-colors block">attenova.support<span className="text-primary">@gmail.com</span></a>
                     </div>
                     <div className="space-y-2">
                        <p className="micro-label opacity-40">Student Helpline</p>
                        <p className="text-xl font-bold font-mono tracking-tighter text-accent">+91 81057 13157</p>
                     </div>
                  </div>
               </motion.div>
            </div>
         </div>
      </section>
    </div>
  );
}
