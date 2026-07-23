import * as React from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { generateAlternatives } from "../lib/subdomain";

interface SubdomainAvailability {
  available: boolean | null; // null = not checked yet
  checking: boolean;
  suggestions: string[];     // alternatives when taken
}

/**
 * Debounced Firestore availability check for a subdomain.
 * Queries the top-level `subdomains/{subdomain}` collection.
 */
export function useSubdomainAvailability(subdomain: string): SubdomainAvailability {
  const [available, setAvailable] = React.useState<boolean | null>(null);
  const [checking, setChecking] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (!subdomain || subdomain.length < 2) {
      setAvailable(null);
      setChecking(false);
      setSuggestions([]);
      return;
    }

    setChecking(true);
    setAvailable(null);

    const timer = setTimeout(async () => {
      try {
        const snap = await getDoc(doc(db, "subdomains", subdomain));
        const isFree = !snap.exists();
        setAvailable(isFree);

        if (!isFree) {
          // Check each alternative for availability
          const alts = generateAlternatives(subdomain);
          const checks = await Promise.all(
            alts.map(a => getDoc(doc(db, "subdomains", a)).then(s => ({ alt: a, free: !s.exists() })))
          );
          setSuggestions(checks.filter(c => c.free).map(c => c.alt).slice(0, 3));
        } else {
          setSuggestions([]);
        }
      } catch {
        setAvailable(null);
      } finally {
        setChecking(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [subdomain]);

  return { available, checking, suggestions };
}
