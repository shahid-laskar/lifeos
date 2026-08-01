import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AuthShell, FormNotice, LANGUAGES } from "@/components/auth/auth-shell";
import { StarSpinner } from "@/components/brand/pattern";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { register } from "@/lib/api/endpoints";
import { signIn, useIsAuthenticated } from "@/lib/auth";

export const Route = createFileRoute("/register")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Create your account — Muslim Life OS" },
      {
        name: "description",
        content: "Start a calm, unhurried practice: prayer times, Qur'an, dhikr and reflection.",
      },
      { property: "og:title", content: "Create your account — Muslim Life OS" },
      {
        property: "og:description",
        content: "Start a calm, unhurried practice: prayer times, Qur'an, dhikr and reflection.",
      },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const isAuthenticated = useIsAuthenticated();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [language, setLanguage] = useState("en");
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate({ to: "/onboarding", replace: true });
  }, [isAuthenticated, navigate]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Please choose a password of at least 8 characters.");
      return;
    }
    if (!terms) {
      setError("Please accept the terms to continue.");
      return;
    }
    setPending(true);
    try {
      const tokens = await register({
        email: email.trim(),
        password,
        terms_accepted: true,
        preferred_language: language,
      });
      signIn(tokens);
      navigate({ to: "/onboarding", replace: true });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "We couldn't create your account. Please try again.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="No streaks. No badges. Just a quiet place to keep your practice."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">At least 8 characters.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="language">Preferred language</Label>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger id="language">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-3">
          <Checkbox
            id="terms"
            checked={terms}
            onCheckedChange={(value) => setTerms(value === true)}
            className="mt-0.5"
          />
          <Label htmlFor="terms" className="text-sm font-normal leading-relaxed">
            I accept the terms of use and the privacy policy.
          </Label>
        </div>
        {error ? <FormNotice>{error}</FormNotice> : null}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? <StarSpinner size={18} /> : "Create account"}
        </Button>
      </form>
    </AuthShell>
  );
}
