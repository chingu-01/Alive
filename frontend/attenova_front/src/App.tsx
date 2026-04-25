/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import LandingView from "./views/LandingView";
import DashboardView from "./views/DashboardView";
import SessionSetupView from "./views/SessionSetupView";
import FocusSessionView from "./views/FocusSessionView";
import ReportView from "./views/ReportView";
import HistoryView from "./views/HistoryView";
import ReportsView from "./views/ReportsView";
import SettingsView from "./views/SettingsView";
import ExtensionView from "./views/ExtensionView";

function AppContent() {
  const { user, loading, logout } = useAuth();
  const [view, setView] = useState(user ? "dashboard" : "landing");
  const [sessionParams, setSessionParams] = useState<{ duration: number; quote: string; allowedSites: string[] } | null>(null);
  const [lastSession, setLastSession] = useState<any>(null);

  // Guard: if user logs out, redirect to landing
  React.useEffect(() => {
    console.log("App redirect effect:", { user: user?.email, loading, currentView: view });
    if (!loading && !user) {
      setView("landing");
    } else if (!loading && user && view === "landing") {
      console.log("Redirecting to dashboard");
      setView("dashboard");
    }
  }, [user, loading, view]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10 opacity-50" />
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin relative z-10" />
      </div>
    );
  }

  const navigateTo = (newView: string) => {
    if (view === "session") {
      alert("A study session is in progress. Please complete or end the session before navigating.");
      return;
    }
    setView(newView);
  };

  const startSetup = () => {
    if (user) {
      setView("setup");
    } else {
      setView("landing");
    }
  };

  const handleStartSession = (duration: number, quote: string, allowedSites: string[]) => {
    setSessionParams({ duration, quote, allowedSites });
    setView("session");
  };

  const handleEndSession = (sessionData: any) => {
    setLastSession(sessionData);
    setView("report");
  };

  const handleSelectHistorySession = (session: any) => {
    setLastSession(session);
    setView("report");
  };

  return (
    <Layout onNavigate={navigateTo} currentView={view}>
      <div className="relative z-10">
        {!user || view === "landing" ? (
          <LandingView onStart={startSetup} />
        ) : (
          <>
            {view === "dashboard" && <DashboardView onStart={startSetup} onSelectSession={handleSelectHistorySession} onNavigate={navigateTo} />}
            {view === "setup" && <SessionSetupView onStart={handleStartSession} />}
            {view === "history" && <HistoryView onSelectSession={handleSelectHistorySession} onStart={startSetup} />}
            {view === "reports" && <ReportsView />}
            {view === "settings" && <SettingsView />}
            {view === "session" && sessionParams && (
              <FocusSessionView 
                durationMinutes={sessionParams.duration} 
                quote={sessionParams.quote} 
                allowedSites={sessionParams.allowedSites}
                onEnd={handleEndSession}
              />
            )}
            {view === "report" && lastSession && (
              <ReportView 
                session={lastSession} 
                onDone={() => setView("dashboard")} 
              />
            )}
          </>
        )}
      </div>
    </Layout>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
