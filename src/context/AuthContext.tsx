import * as React from "react";
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
} from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { Center, Role, User } from "../types";
import { firestoreRepository } from "../data/firestoreRepository";
import { extractSubdomain, ROOT_DOMAIN } from "../lib/subdomain";

// ---------------------------------------------------------------------------
// Avatar color palette — deterministic pick from Firebase UID
// ---------------------------------------------------------------------------
const AVATAR_COLORS = [
  "#3b6bff", "#7c3aed", "#059669", "#d97706",
  "#dc2626", "#0891b2", "#be185d", "#65a30d",
];
function pickColor(uid: string): string {
  const sum = uid.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------
interface AuthContextValue {
  user: User | null;
  center: Center | null;
  fbUser: FirebaseUser | null;
  loading: boolean;
  needsCenterSetup: boolean;
  /** True when student logged in but hasn't verified phone yet */
  needsPhoneVerification: boolean;
  /** Subdomain detected from current hostname, e.g. "applikata" */
  activeSubdomain: string | null;
  /** centerId that owns the active subdomain; null on the root domain */
  subdomainCenterId: string | null;

  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  /** Login with email OR username OR phone + password */
  signInWithLogin: (login: string, password: string) => Promise<void>;
  registerWithEmail: (
    centerName: string,
    ownerName: string,
    email: string,
    password: string,
    subdomain?: string,
    description?: string,
    logoUrl?: string
  ) => Promise<void>;
  setupCenter: (centerName: string, ownerName: string, subdomain?: string, description?: string, logoUrl?: string) => Promise<void>;
  /** Call after successful phone OTP to mark student as verified */
  markPhoneVerified: () => Promise<void>;
  /** Replace the active center doc in context (e.g. after a settings save) */
  setCenter: React.Dispatch<React.SetStateAction<Center | null>>;
  logout: () => Promise<void>;
  /** Log out and redirect to root-domain /login (platform login, no center branding) */
  logoutToMain: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [fbUser, setFbUser] = React.useState<FirebaseUser | null>(null);
  const [user, setUser] = React.useState<User | null>(null);
  const [center, setCenter] = React.useState<Center | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [needsCenterSetup, setNeedsCenterSetup] = React.useState(false);
  const [needsPhoneVerification, setNeedsPhoneVerification] = React.useState(false);

  // Detect subdomain once on mount
  const activeSubdomain = React.useMemo(
    () => extractSubdomain(window.location.hostname),
    []
  );
  const [subdomainCenterId, setSubdomainCenterId] = React.useState<string | null>(null);

  const registering = React.useRef(false);

  // ── Resolve subdomain → centerId on mount ────────────────────────────────
  React.useEffect(() => {
    if (!activeSubdomain) return;
    firestoreRepository.getSubdomainCenterId(activeSubdomain).then(setSubdomainCenterId);
  }, [activeSubdomain]);

  // ── Load Firestore profile for a Firebase user ──────────────────────────
  const loadProfile = React.useCallback(
    async (fb: FirebaseUser, resolvedSubdomainCenterId?: string | null): Promise<boolean> => {
      const snap = await getDoc(doc(db, "userProfiles", fb.uid));
      if (!snap.exists()) return false;

      const profile = { id: fb.uid, ...(snap.data() as Omit<User, "id">) };

      // Enforce tenant isolation: if on a subdomain, user must belong to that center.
      // Encode the user's real centerId in the error so the catch block can redirect them.
      if (resolvedSubdomainCenterId && profile.centerId !== resolvedSubdomainCenterId) {
        throw new Error(`wrong-center:${profile.centerId}`);
      }

      const c = await firestoreRepository.getCenter(profile.centerId);
      setUser(profile);
      setCenter(c);
      setNeedsCenterSetup(false);

      // Students must verify phone on first login
      if (profile.role === "student" && profile.phoneVerified === false) {
        setNeedsPhoneVerification(true);
      } else {
        setNeedsPhoneVerification(false);
      }

      return true;
    },
    []
  );

  // ── Firebase Auth state listener ─────────────────────────────────────────
  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fb) => {
      setFbUser(fb);

      if (!fb) {
        setUser(null);
        setCenter(null);
        setNeedsCenterSetup(false);
        setNeedsPhoneVerification(false);
        setLoading(false);
        return;
      }

      if (registering.current) return;

      // Resolve subdomain centerId at auth time (may not be in state yet)
      let sdCenterId: string | null = null;
      const sub = extractSubdomain(window.location.hostname);
      if (sub) {
        sdCenterId = await firestoreRepository.getSubdomainCenterId(sub);
        setSubdomainCenterId(sdCenterId);
      }

      try {
        const found = await loadProfile(fb, sdCenterId);
        if (!found) {
          setUser(null);
          setCenter(null);
          setNeedsCenterSetup(true);
          setNeedsPhoneVerification(false);
        }
      } catch (err: any) {
        // User belongs to a different center — redirect them to their correct subdomain.
        if (typeof err?.message === "string" && err.message.startsWith("wrong-center:")) {
          const correctCenterId = err.message.split(":")[1];
          const correctCenter = await firestoreRepository.getCenter(correctCenterId);
          if (correctCenter?.subdomain) {
            // Hard-navigate: Firebase Auth is origin-scoped, so we just go to the right URL.
            window.location.href = `${window.location.protocol}//${correctCenter.subdomain}.${
              window.location.hostname.includes("localhost") ? "localhost" : ROOT_DOMAIN
            }${window.location.port ? `:${window.location.port}` : ""}/`;
          } else {
            // No subdomain configured — sign out cleanly and show the login page.
            await signOut(auth);
            setUser(null);
            setCenter(null);
            setFbUser(null);
          }
        }
      }
      setLoading(false);
    });
    return unsub;
  }, [loadProfile]);

  // ── Sign-in methods ───────────────────────────────────────────────────────
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signInWithApple = async () => {
    const provider = new OAuthProvider("apple.com");
    provider.addScope("email");
    provider.addScope("name");
    await signInWithPopup(auth, provider);
  };

  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signInWithLogin = async (login: string, password: string) => {
    const raw = login.trim();
    // If it looks like an email, use directly
    if (raw.includes("@")) {
      await signInWithEmailAndPassword(auth, raw, password);
      return;
    }
    // Otherwise look up profile by username or phone
    // getUserByLogin tries the public userLogins index first, then falls back
    // to querying userProfiles (requires permissive Firestore rules).
    const profile = await firestoreRepository.getUserByLogin(raw);
    if (!profile?.email) {
      const err: any = new Error("Пользователь не найден. Попробуйте войти через email.");
      err.code = "auth/user-not-found";
      throw err;
    }
    await signInWithEmailAndPassword(auth, profile.email, password);
  };

  const registerWithEmail = async (
    centerName: string,
    ownerName: string,
    email: string,
    password: string,
    subdomain?: string,
    description?: string,
    logoUrl?: string
  ) => {
    registering.current = true;
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: ownerName });

      // NOTE: a center owner is NOT a platform admin. The Ilmoz platform admin
      // (isadm) is created only through the dedicated /setupforadmin2011 flow.
      const newCenter = await firestoreRepository.createCenter({ name: centerName, subdomain, description, logoUrl });
      const avatarColor = pickColor(cred.user.uid);
      const newUser = await firestoreRepository.createUser({
        id: cred.user.uid,
        centerId: newCenter.id,
        name: ownerName,
        email: email.toLowerCase(),
        username: email.split("@")[0].toLowerCase(),
        role: "owner" as Role,
        avatarColor,
      });

      setFbUser(cred.user);
      setUser(newUser);
      setCenter(newCenter);
      setNeedsCenterSetup(false);
      setNeedsPhoneVerification(false);
    } finally {
      registering.current = false;
      setLoading(false);
    }
  };

  const setupCenter = async (centerName: string, ownerName: string, subdomain?: string, description?: string, logoUrl?: string) => {
    if (!fbUser) throw new Error("Not authenticated");

    // NOTE: a center owner is NOT a platform admin. The Ilmoz platform admin
    // (isadm) is created only through the dedicated /setupforadmin2011 flow.
    const newCenter = await firestoreRepository.createCenter({ name: centerName, subdomain, description, logoUrl });
    const avatarColor = pickColor(fbUser.uid);

    const newUser = await firestoreRepository.createUser({
      id: fbUser.uid,
      centerId: newCenter.id,
      name: ownerName,
      email: fbUser.email ?? undefined,
      phone: fbUser.phoneNumber ?? undefined,
      username: fbUser.email
        ? fbUser.email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20)
        : (fbUser.phoneNumber ?? fbUser.uid).replace(/[^a-z0-9]/gi, "").toLowerCase().slice(0, 20),
      role: "owner" as Role,
      avatarColor,
    });

    setUser(newUser);
    setCenter(newCenter);
    setNeedsCenterSetup(false);
    setNeedsPhoneVerification(false);
  };

  const markPhoneVerified = async () => {
    if (!fbUser) return;
    await updateDoc(doc(db, "userProfiles", fbUser.uid), { phoneVerified: true });
    setUser(prev => prev ? { ...prev, phoneVerified: true } : prev);
    setNeedsPhoneVerification(false);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setCenter(null);
    setFbUser(null);
    setNeedsCenterSetup(false);
    setNeedsPhoneVerification(false);
    // Stay on the same domain (subdomain or root) — just go to /login
    window.location.href = "/login";
  };

  const logoutToMain = async () => {
    await signOut(auth);
    setUser(null);
    setCenter(null);
    setFbUser(null);
    setNeedsCenterSetup(false);
    setNeedsPhoneVerification(false);
    // Redirect to root-domain /login (no center branding)
    const isLocalhost = window.location.hostname === "localhost" || window.location.hostname.endsWith(".localhost");
    const rootHost = isLocalhost ? "localhost" : ROOT_DOMAIN;
    const portSuffix = window.location.port ? `:${window.location.port}` : "";
    window.location.href = `${window.location.protocol}//${rootHost}${portSuffix}/login`;
  };

  const value: AuthContextValue = {
    user,
    center,
    fbUser,
    loading,
    needsCenterSetup,
    needsPhoneVerification,
    activeSubdomain,
    subdomainCenterId,
    signInWithGoogle,
    signInWithApple,
    signInWithEmail,
    signInWithLogin,
    registerWithEmail,
    setupCenter,
    markPhoneVerified,
    setCenter,
    logout,
    logoutToMain,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
