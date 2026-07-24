import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, User as UserIcon, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { AuthLayout } from "../auth/AuthLayout";
import { Button } from "../../components/ui/Button";
import { Input, Field } from "../../components/ui/Input";
import { Logo } from "../../components/ui/Logo";
import { useAuth } from "../../context/AuthContext";
import { slugifySubdomain } from "../../lib/subdomain";
import { useSubdomainAvailability } from "../../hooks/useSubdomainAvailability";
import { SubdomainField } from "../auth/RegisterPage";
import { LogoUpload } from "../../components/ui/LogoUpload";
import { uid } from "../../lib/utils";

const schema = z.object({
  centerName: z.string().min(2, "Give your center a name."),
  ownerName: z.string().min(2, "Enter your display name."),
});
type FormValues = z.infer<typeof schema>;

// ---------------------------------------------------------------------------
// Shown to first-time Google / Phone sign-in users who don't have a center yet
// ---------------------------------------------------------------------------
export function SetupCenterPage() {
  const { fbUser, setupCenter, logout } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      centerName: "",
      // Pre-fill name from Google display name if available
      ownerName: fbUser?.displayName ?? "",
    },
  });

  const watchedCenterName = watch("centerName");
  const [subdomain, setSubdomain] = React.useState("");
  const [subdomainEdited, setSubdomainEdited] = React.useState(false);
  const { available, checking, suggestions } = useSubdomainAvailability(subdomain);
  const [description, setDescription] = React.useState("");
  const [logoUrl, setLogoUrl] = React.useState("");
  const tempCenterId = React.useRef(uid("tmp"));

  React.useEffect(() => {
    if (!subdomainEdited) {
      setSubdomain(slugifySubdomain(watchedCenterName));
    }
  }, [watchedCenterName, subdomainEdited]);

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    if (available === false) {
      setServerError("That subdomain is already taken. Please choose another.");
      return;
    }
    try {
      await setupCenter(values.centerName, values.ownerName, subdomain || undefined, description || undefined, logoUrl || undefined);
      // Step 3: Let the owner customize their login page before entering the workspace.
      navigate("/onboarding/customize");
    } catch (err: any) {
      setServerError(err?.message ?? "Could not create workspace. Please try again.");
    }
  };

  return (
    <AuthLayout>
      {/* Centered logo + step indicator */}
      <div className="mb-6 flex items-center gap-3">
        <Logo size={28} showText={false} />
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-6 rounded-full bg-brand-500" />
          <span className="h-1.5 w-6 rounded-full bg-brand-500" />
          <span className="h-1.5 w-6 rounded-full bg-brand-500/30" />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <h2 className="text-2xl font-bold tracking-tight text-white">
          One last step 🎉
        </h2>
        <p className="mt-1 text-sm text-white/45">
          You're signed in as{" "}
          <span className="text-white/70">
            {fbUser?.email ?? fbUser?.phoneNumber ?? "you"}
          </span>
          . Now set up your learning center workspace.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-4">
          <Field label="Learning center name" error={errors.centerName?.message}>
            <Input
              icon={<Building2 className="h-4 w-4" />}
              placeholder="Ilmoz Academy"
              autoFocus
              autoComplete="organization"
              {...register("centerName")}
            />
          </Field>

          <SubdomainField
            value={subdomain}
            available={available}
            checking={checking}
            suggestions={suggestions}
            onChange={val => { setSubdomain(val); setSubdomainEdited(true); }}
          />

          {/* ── Description ── */}
          <Field label="Center description" hint="Shown on your login page">
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-3.5 text-white/40">
                <FileText className="h-4 w-4" />
              </span>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="A brief description of your center…"
                rows={2}
                maxLength={200}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-brand-400/60 focus:bg-white/[0.06] resize-none"
              />
            </div>
          </Field>

          {/* ── Logo ── */}
          <LogoUpload
            centerId={tempCenterId.current}
            value={logoUrl}
            onChange={setLogoUrl}
          />

          <Field
            label="Your display name"
            error={errors.ownerName?.message ?? serverError ?? undefined}
          >
            <Input
              icon={<UserIcon className="h-4 w-4" />}
              placeholder="Aziz Karimov"
              autoComplete="name"
              {...register("ownerName")}
            />
          </Field>

          <Button type="submit" loading={isSubmitting} className="w-full mt-2" size="lg">
            Launch my workspace
          </Button>
        </form>

        <button
          onClick={() => logout().then(() => navigate("/login"))}
          className="mt-5 w-full text-center text-sm text-white/35 hover:text-white/60 transition"
        >
          Use a different account
        </button>
      </motion.div>
    </AuthLayout>
  );
}
