import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { auth, db } from "@/firebase";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  User as FirebaseUser
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setLoading(false);

      // Update streak when user logs in
      if (u) await updateStreak(u.uid);
    });
    return () => unsubscribe();
  }, []);

  const updateStreak = async (uid: string) => {
    try {
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);

      const today = new Date();
      const todayStr = today.toISOString().split("T")[0]; // YYYY-MM-DD

      if (!userSnap.exists()) {
        await setDoc(userRef, { streak: 1, lastLoginDate: todayStr });
        return;
      }

      const data = userSnap.data();
      const lastLogin = data.lastLoginDate;
      const streak = data.streak || 0;

      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      let newStreak = 1;
      if (lastLogin === yesterdayStr) newStreak = streak + 1;
      else if (lastLogin === todayStr) newStreak = streak;

      await setDoc(userRef, { streak: newStreak, lastLoginDate: todayStr }, { merge: true });
    } catch (err) {
      console.error("Failed to update streak:", err);
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (fullName) {
        try {
          await updateProfile(userCredential.user, { displayName: fullName });
        } catch (e) {
          // ignore profile update errors
        }
      }

      // Update streak after signup
      await updateStreak(userCredential.user.uid);

      return { error: null };
    } catch (e: any) {
      return { error: e };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // Update streak after sign in
      await updateStreak(userCredential.user.uid);

      return { error: null };
    } catch (e: any) {
      return { error: e };
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
