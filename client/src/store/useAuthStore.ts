import { create } from 'zustand';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  onAuthStateChanged,
  sendPasswordResetEmail,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { User } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const STORAGE_KEY = 'moduleforge_user';

function persist(user: User | null) {
  if (user) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } catch {}
  } else {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }
}

function readPersisted(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function mapFirebaseUser(fbUser: FirebaseUser): User {
  return {
    id: fbUser.uid,
    email: fbUser.email ?? '',
    name: fbUser.displayName ?? fbUser.email?.split('@')[0] ?? 'User',
    avatarUrl: fbUser.photoURL ?? undefined,
  };
}

function formatFirebaseError(error: any): string {
  const code = error?.code;
  switch (code) {
    case 'auth/invalid-email':
      return 'Invalid email address format.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in popup was closed before finishing.';
    default:
      return error?.message || 'Authentication failed. Please try again.';
  }
}

// ---------------------------------------------------------------------------
// Store Interface
// ---------------------------------------------------------------------------
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isDevMode: boolean;

  checkAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const initialSavedUser = readPersisted();

export const useAuthStore = create<AuthState>((set) => ({
  user: initialSavedUser,
  isAuthenticated: Boolean(initialSavedUser),
  isLoading: false,
  error: null,
  isDevMode: false,

  // ── Restore session on page load / listen to auth state changes ──────────
  checkAuth: async () => {
    const saved = readPersisted();
    if (saved) {
      set({ user: saved, isAuthenticated: true, isLoading: false, error: null });
    }

    return new Promise<void>((resolve) => {
      let resolved = false;

      // 1.5s safety fallback so UI is never stuck on spinner
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          const current = readPersisted();
          set({
            user: current,
            isAuthenticated: Boolean(current),
            isLoading: false,
          });
          resolve();
        }
      }, 1500);

      try {
        const unsubscribe = onAuthStateChanged(
          auth,
          (fbUser) => {
            if (!resolved) {
              resolved = true;
              clearTimeout(timeout);
              if (fbUser) {
                const u = mapFirebaseUser(fbUser);
                persist(u);
                set({ user: u, isAuthenticated: true, isLoading: false });
              } else {
                persist(null);
                set({ user: null, isAuthenticated: false, isLoading: false });
              }
              unsubscribe();
              resolve();
            }
          },
          (_err) => {
            if (!resolved) {
              resolved = true;
              clearTimeout(timeout);
              const current = readPersisted();
              set({
                user: current,
                isAuthenticated: Boolean(current),
                isLoading: false,
              });
              unsubscribe();
              resolve();
            }
          }
        );
      } catch (err) {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          set({ isLoading: false });
          resolve();
        }
      }
    });
  },

  // ── Sign in with Email & Password ─────────────────────────────────────────
  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const u = mapFirebaseUser(cred.user);
      persist(u);
      set({ user: u, isAuthenticated: true, isLoading: false });
      return { success: true };
    } catch (err: any) {
      const msg = formatFirebaseError(err);
      set({ isLoading: false, error: msg });
      return { success: false, error: msg };
    }
  },

  // ── Sign in with Google Popup ────────────────────────────────────────────
  loginWithGoogle: async () => {
    set({ isLoading: true, error: null });
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const u = mapFirebaseUser(cred.user);
      persist(u);
      set({ user: u, isAuthenticated: true, isLoading: false });
      return { success: true };
    } catch (err: any) {
      const msg = formatFirebaseError(err);
      set({ isLoading: false, error: msg });
      return { success: false, error: msg };
    }
  },

  // ── Register with Email & Password ────────────────────────────────────────
  register: async (name: string, email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (name && cred.user) {
        await updateProfile(cred.user, { displayName: name });
      }
      const u: User = {
        id: cred.user.uid,
        email: cred.user.email ?? email,
        name: name || cred.user.displayName || email.split('@')[0],
      };
      persist(u);
      set({ user: u, isAuthenticated: true, isLoading: false });
      return { success: true };
    } catch (err: any) {
      const msg = formatFirebaseError(err);
      set({ isLoading: false, error: msg });
      return { success: false, error: msg };
    }
  },

  // ── Password Reset Email ──────────────────────────────────────────────────
  resetPassword: async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (err: any) {
      const msg = formatFirebaseError(err);
      return { success: false, error: msg };
    }
  },

  // ── Sign out ─────────────────────────────────────────────────────────────
  logout: async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      persist(null);
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
