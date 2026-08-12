import * as React from "react";
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
} from "firebase/auth";
import { doc, getDoc, updateDoc, setDoc, getDocs, query, collection, where, limit } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { Center, CenterNetwork, Role, User } from "../types";
import { firestoreRepository } from "../data/firestoreRepository";
import { extractSubdomain, isReservedSubdomain, ROOT_DOMAIN } from "../lib/subdomain";

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
function strip<T extends object>(obj: T): T {
  const next: any = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) next[k] = v;
  }
  return next;
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
  /** True when on a subdomain that does NOT exist in the database */
  subdomainNotFound: boolean;
  /** True when subdomain lookup has finished */
  subdomainChecked: boolean;
  /** The branch network this center belongs to (null if not in a network) */
  network: CenterNetwork | null;
  /** True if the current center is the headquarters of a network */
  isHeadquarters: boolean;

  signInWithGoogle: () => Promise<void>;
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
  const [network, setNetwork] = React.useState<CenterNetwork | null>(null);

  // Detect subdomain once on mount
  const activeSubdomain = React.useMemo(
    () => extractSubdomain(window.location.hostname),
    []
  );
  const [subdomainCenterId, setSubdomainCenterId] = React.useState<string | null>(null);
  const [subdomainChecked, setSubdomainChecked] = React.useState(false);

  const registering = React.useRef(false);

  // ── Resolve subdomain → centerId on mount ────────────────────────────────
  React.useEffect(() => {
    if (!activeSubdomain) {
      setSubdomainChecked(true);
      return;
    }
    setSubdomainChecked(false);
    firestoreRepository.getSubdomainCenterId(activeSubdomain)
      .then((id) => {
        setSubdomainCenterId(id);
        setSubdomainChecked(true);
      })
      .catch(() => {
        setSubdomainCenterId(null);
        setSubdomainChecked(true);
      });
  }, [activeSubdomain]);

  const subdomainNotFound = React.useMemo(() => {
    if (!activeSubdomain) return false;
    if (isReservedSubdomain(activeSubdomain)) return false;
    return subdomainChecked && subdomainCenterId === null;
  }, [activeSubdomain, subdomainChecked, subdomainCenterId]);

  // ── Load Firestore profile for a Firebase user ──────────────────────────
  const loadProfile = React.useCallback(
    async (fb: FirebaseUser, resolvedSubdomainCenterId?: string | null): Promise<boolean> => {
      let snap;
      let isLegacy = false;

      if (resolvedSubdomainCenterId) {
        // Try the new composite key centerId_userId
        snap = await getDoc(doc(db, "userProfiles", `${resolvedSubdomainCenterId}_${fb.uid}`));
        if (!snap.exists()) {
          // Fallback to legacy flat doc key
          snap = await getDoc(doc(db, "userProfiles", fb.uid));
          isLegacy = snap.exists();
        }
      } else {
        // Root domain:
        // 1. Try platform admin first (platform_{uid})
        snap = await getDoc(doc(db, "userProfiles", `platform_${fb.uid}`));
        if (!snap.exists()) {
          // 2. Try looking up center by ownerEmail if user has an email
          let ownerCenterId: string | null = null;
          if (fb.email) {
            const centersRef = collection(db, "centers");
            const q = query(centersRef, where("ownerEmail", "==", fb.email.toLowerCase()), limit(1));
            const querySnap = await getDocs(q);
            if (!querySnap.empty) {
              ownerCenterId = querySnap.docs[0].id;
            }
          }
          if (ownerCenterId) {
            snap = await getDoc(doc(db, "userProfiles", `${ownerCenterId}_${fb.uid}`));
          }
        }
        if (!snap || !snap.exists()) {
          // 3. Fallback to legacy key
          snap = await getDoc(doc(db, "userProfiles", fb.uid));
          isLegacy = snap.exists();
        }
      }

      // Dynamic owner mapping / recovery:
      // If we are on a subdomain but have no profile document yet, check if this user is the owner
      // of this center according to ownerEmail. If so, automatically create their owner profile document!
      if ((!snap || !snap.exists()) && resolvedSubdomainCenterId && fb.email) {
        const subCenter = await firestoreRepository.getCenter(resolvedSubdomainCenterId);
        if (subCenter && subCenter.ownerEmail && subCenter.ownerEmail.toLowerCase() === fb.email.toLowerCase()) {
          const avatarColor = pickColor(fb.uid);
          const newUser: User = {
            id: fb.uid,
            centerId: resolvedSubdomainCenterId,
            name: fb.displayName || fb.email.split("@")[0] || "Markaz egasi",
            email: fb.email.toLowerCase(),
            username: fb.email.split("@")[0].toLowerCase(),
            role: "owner" as Role,
            avatarColor,
            createdAt: new Date().toISOString(),
          };
          await setDoc(doc(db, "userProfiles", `${resolvedSubdomainCenterId}_${fb.uid}`), strip(newUser as any));
          snap = await getDoc(doc(db, "userProfiles", `${resolvedSubdomainCenterId}_${fb.uid}`));
        }
      }

      if (!snap || !snap.exists()) return false;

      const profile = { id: fb.uid, ...(snap.data() as Omit<User, "id">) };

      // Legacy migration: if the user loaded a legacy flat profile doc, and they are on the correct subdomain,
      // clone/migrate their profile doc to the new composite key format!
      if (isLegacy && resolvedSubdomainCenterId && profile.centerId === resolvedSubdomainCenterId) {
        await setDoc(doc(db, "userProfiles", `${resolvedSubdomainCenterId}_${fb.uid}`), snap.data());
      }

      const platformDummyCenter: Center = {
        id: "platform",
        name: "Ilmoz Platform",
        slug: "platform",
        currency: "USD",
        createdAt: new Date().toISOString(),
      };

      const userCenter = (await firestoreRepository.getCenter(profile.centerId)) || (
        (profile.isadm || profile.ismod || profile.centerId === "platform") ? platformDummyCenter : null
      );
      if (!userCenter) return false;

      // Set ownerEmail on the owner's center if not set yet
      if (profile.role === "owner" && fb.email && userCenter && !userCenter.ownerEmail) {
        firestoreRepository.updateCenter(userCenter.id, { ownerEmail: fb.email.toLowerCase() }).catch(() => {});
      }

      let activeCenter = userCenter;

      // 1. Root domain restriction: non-owners (and non-platform admins) cannot sign in on the main domain.
      // Automatically redirect them to their center's subdomain if configured, or block entry.
      if (!resolvedSubdomainCenterId && profile.role !== "owner" && !profile.isadm) {
        if (userCenter.subdomain) {
          throw new Error(`wrong-center:${userCenter.id}`);
        } else {
          throw new Error("only-owner-root");
        }
      }

      // 2. Enforce tenant isolation, but allow network owners/members to access branch subdomains of the same network
      if (resolvedSubdomainCenterId && profile.centerId !== resolvedSubdomainCenterId) {
        const subCenter = await firestoreRepository.getCenter(resolvedSubdomainCenterId);
        
        const isSameNetwork =
          subCenter &&
          userCenter.networkId &&
          subCenter.networkId === userCenter.networkId;

        if (!isSameNetwork) {
          throw new Error(`wrong-center:${profile.centerId}`);
        } else if (subCenter) {
          // If in the same network, set activeCenter to the branch subdomain center
          activeCenter = subCenter;
        }
      }

      setUser(profile);
      setCenter(activeCenter);
      setNeedsCenterSetup(false);

      // Load network if center belongs to one
      if (activeCenter.networkId) {
        firestoreRepository.getNetwork(activeCenter.networkId).then(setNetwork).catch(() => {});
      } else {
        setNetwork(null);
      }

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
        console.error("Auth listener error:", err);
        // User belongs to a different center — redirect them to their correct subdomain.
        if (typeof err?.message === "string" && err.message.startsWith("wrong-center:")) {
          const correctCenterId = err.message.split(":")[1];
          const correctCenter = await firestoreRepository.getCenter(correctCenterId);
          if (correctCenter?.subdomain) {
            // Hard-navigate: Firebase Auth is origin-scoped, so we just go to the right URL.
            window.location.href = `${window.location.protocol}//${correctCenter.subdomain}.${
              window.location.hostname.includes("localhost") ? "localhost" : ROOT_DOMAIN
            }${window.location.port ? `:${window.location.port}` : ""}/`;
            return;
          } else {
            // No subdomain configured — sign out cleanly and show the login page.
            await signOut(auth);
            setUser(null);
            setCenter(null);
            setFbUser(null);
          }
        } else if (err?.message === "only-owner-root") {
          await signOut(auth);
          setUser(null);
          setCenter(null);
          setFbUser(null);
          alert("Asosiy saytdan faqat markaz egalari kirishlari mumkin. O'quvchilar va o'qituvchilar o'z markazining subdomenidan kirishlari kerak.");
        } else {
          // General fallback: sign out on unexpected load errors to prevent stuck loading screen
          await signOut(auth);
          setUser(null);
          setCenter(null);
          setFbUser(null);
          setNeedsCenterSetup(false);
          setNeedsPhoneVerification(false);
          alert("Profilni yuklashda xatolik yuz berdi: " + (err?.message || err));
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
      const err: any = new Error("Неверный логин или пароль.");
      err.code = "auth/invalid-credential";
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
      const newCenter = await firestoreRepository.createCenter({
        name: centerName,
        subdomain,
        description,
        logoUrl,
        ownerEmail: email,
      });
      const avatarColor = pickColor(cred.user.uid);
      const newUser = await firestoreRepository.createUser({
        id: cred.user.uid,
        centerId: newCenter.id,
        name: ownerName,
        email: email,
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
    const newCenter = await firestoreRepository.createCenter({
      name: centerName,
      subdomain,
      description,
      logoUrl,
      ownerEmail: fbUser.email || undefined,
    });
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
    const docId = center ? `${center.id}_${fbUser.uid}` : fbUser.uid;
    const compositeDoc = doc(db, "userProfiles", docId);
    const legacyDoc = doc(db, "userProfiles", fbUser.uid);
    const compSnap = await getDoc(compositeDoc);
    if (compSnap.exists()) {
      await updateDoc(compositeDoc, { phoneVerified: true });
    } else {
      await updateDoc(legacyDoc, { phoneVerified: true });
    }
    setUser(prev => prev ? { ...prev, phoneVerified: true } : prev);
    setNeedsPhoneVerification(false);
  };

  const logout = async () => {
    if (user?.id) localStorage.removeItem(`ilmoz:copilot:history:${user.id}`);
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
    if (user?.id) localStorage.removeItem(`ilmoz:copilot:history:${user.id}`);
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
    subdomainNotFound,
    subdomainChecked,
    network,
    isHeadquarters: center?.isHeadquarters ?? false,
    signInWithGoogle,
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
