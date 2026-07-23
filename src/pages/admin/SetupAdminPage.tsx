import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { motion } from "framer-motion";
import { Mail, Lock, User as UserIcon, ShieldCheck, CheckCircle2 } from "lucide-react";
import { auth } from "../../lib/firebase";
import { firestoreRepository } from "../../data/firestoreRepository";
import { Button } from "../../components/ui/Button";
import { Input, Field } from "../../components/ui/Input";
import { Logo } from "../../components/ui/Logo";

const AVATAR_COLORS = ["#3b6bff", "#7c3aed", "#059669", "#d97706"];
function pickColor(uid: string) {
  const sum = uid.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

const schema = z.object({
  name: z.string().min(2, "Enter your full name."),
  email: z.string().email("Enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  confirm: z.string(),
}).refine(d => d.password === d.confirm, {
  message: "Passwords don't match.",
  path: ["confirm"],
});
type FormValues = z.infer<typeof schema>;

type Status = "checking" | "available" | "taken" | "done";

async function createAdminProfile(uid: string, name: string, email: string) {
  await firestoreRepository.createUser({
    id: uid,
    centerId: "platform",
    name,
    email: email.toLowerCase(),
    username: email.split("@")[0].toLowerCase(),
    role: "owner",
    avatarColor: pickColor(uid),
    isadm: true,
  });
  // Write public flag so hasAnyAdmin() works without auth next time
  await firestoreRepository.markPlatformInitialized();
}

export function SetupAdminPage() {
  const navigate = useNavigate();
  const [status, setStatus] = React.useState<Status>("checking");
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = React.useState(false);

  React.useEffect(() => {
    firestoreRepository.hasAnyAdmin().then(exists => {
      setStatus(exists ? "taken" : "available");
    });
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, values.email, values.password);
      await updateProfile(cred.user, { displayName: values.name });
      await createAdminProfile(cred.user.uid, values.name, values.email);
      setStatus("done");
      setTimeout(() => navigate("/"), 2000);
    } catch (err: any) {
      setServerError(err?.message ?? "Something went wrong.");
    }
  };

  const handleGoogle = async () => {
    setServerError(null);
    setGoogleLoading(true);
    try {
      const cred = await signInWithPopup(auth, new GoogleAuthProvider());
      const { uid, displayName, email } = cred.user;
      await createAdminProfile(uid, displayName ?? "Admin", email ?? "");
      setStatus("done");
      setTimeout(() => navigate("/"), 2000);
    } catch (err: any) {
      setServerError(err?.message ?? "Google sign-in failed.");
    } finally {
      setGoogleLoading(false);
    }
  };

  if (status === "checking") {
    return (
      <div className="grid min-h-screen place-items-center bg-[#05060a]">
        <div className="h-1 w-40 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-1/2 animate-shimmer rounded-full brand-gradient" />
        </div>
      </div>
    );
  }

  if (status === "taken") {
    return (
      <div className="grid min-h-screen place-items-center bg-[#05060a] p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex max-w-sm flex-col items-center gap-5 text-center"
        >
          <ShieldCheck className="h-14 w-14 text-brand-400" />
          <h1 className="text-2xl font-bold text-white">Admin already exists</h1>
          <p className="text-sm text-white/45">
            The platform admin account has already been created. This setup page is no longer accessible.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="text-sm text-brand-400 underline-offset-2 hover:underline"
          >
            Go to login →
          </button>
        </motion.div>
      </div>
    );
  }

  if (status === "done") {
    return (
      <div className="grid min-h-screen place-items-center bg-[#05060a] p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex max-w-sm flex-col items-center gap-5 text-center"
        >
          <CheckCircle2 className="h-14 w-14 text-emerald-400" />
          <h1 className="text-2xl font-bold text-white">Admin account created!</h1>
          <p className="text-sm text-white/45">Redirecting you to the platform…</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen place-items-center bg-[#05060a] p-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 flex flex-col items-center gap-3">
          <Logo size={36} showText={false} />
          <div className="flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1">
            <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-xs font-semibold text-amber-400">One-time setup</span>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white">Create platform admin</h1>
        <p className="mt-1.5 text-sm text-white/45">
          This account will have full access to the Ilmoz admin console.
        </p>

        {/* Google button */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={googleLoading}
          className="mt-7 flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] py-3 text-sm font-medium text-white transition hover:bg-white/[0.08] disabled:opacity-50"
        >
          {googleLoading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          )}
          Continue with Google
        </button>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/[0.07]" />
          <span className="text-xs text-white/25">or</span>
          <div className="h-px flex-1 bg-white/[0.07]" />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label="Full name" error={errors.name?.message}>
            <Input
              icon={<UserIcon className="h-4 w-4" />}
              placeholder="Your name"
              autoComplete="name"
              {...register("name")}
            />
          </Field>

          <Field label="Email" error={errors.email?.message}>
            <Input
              icon={<Mail className="h-4 w-4" />}
              type="email"
              placeholder="admin@ilmoz.uz"
              autoComplete="email"
              {...register("email")}
            />
          </Field>

          <Field label="Password" error={errors.password?.message}>
            <Input
              icon={<Lock className="h-4 w-4" />}
              type="password"
              placeholder="Min. 8 characters"
              autoComplete="new-password"
              {...register("password")}
            />
          </Field>

          <Field label="Confirm password" error={errors.confirm?.message ?? serverError ?? undefined}>
            <Input
              icon={<Lock className="h-4 w-4" />}
              type="password"
              placeholder="Repeat password"
              autoComplete="new-password"
              {...register("confirm")}
            />
          </Field>

          <Button type="submit" loading={isSubmitting} className="w-full mt-2" size="lg">
            Create admin account
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
