import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User, GoogleAuthProvider, signInWithRedirect, getRedirectResult, signOut } from "firebase/auth";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { UserProfile } from "../types";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;

    // First, check for redirect result
    getRedirectResult(auth)
      .then((result) => {
        console.log("Redirect result processed");
      })
      .catch((error) => {
        console.error("Redirect result error:", error);
      });

    const unsubscribeAuth = onAuthStateChanged(auth, async (authenticatedUser) => {
      console.log("Auth state changed:", authenticatedUser?.email);
      setUser(authenticatedUser);
      
      if (authenticatedUser) {
        // Set loading to false immediately when user is authenticated
        setLoading(false);
        
        // Set up profile listener
        unsubscribeProfile = onSnapshot(
          doc(db, "users", authenticatedUser.uid),
          async (docSnap) => {
            if (docSnap.exists()) {
              console.log("Profile exists");
              setProfile(docSnap.data() as UserProfile);
            } else {
              // Initialize profile if it doesn't exist
              console.log("Creating new profile");
              const newProfile: UserProfile = {
                uid: authenticatedUser.uid,
                email: authenticatedUser.email || "",
                displayName: authenticatedUser.displayName || "",
                photoURL: authenticatedUser.photoURL || "",
                currentStreak: 0,
                totalFocusMinutes: 0,
                createdAt: serverTimestamp(),
              };
              await setDoc(doc(db, "users", authenticatedUser.uid), newProfile);
              setProfile(newProfile);
            }
          },
          (error) => {
            console.error("Profile listener error:", error);
          }
        );
      } else {
        console.log("User logged out");
        setProfile(null);
        if (unsubscribeProfile) unsubscribeProfile();
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithRedirect(auth, provider);
    } catch (error: any) {
      console.error("Login Error:", error);
      alert("Sign-in failed. Please try again. Error: " + error.message);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
