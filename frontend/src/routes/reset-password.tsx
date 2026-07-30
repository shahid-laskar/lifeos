import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell, FormNotice } from "@/components/auth/auth-shell";
import { StarSpinner } from "@/components/brand/pattern";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPassword } from "@/lib/api/endpoints";

type ResetSearch = { token?: string };

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): ResetSearch => ({
    token: typeof search.token === "string" ? search.token : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Set a new password — Muslim Life OS" },
      {
        name: "description",
        content: "Choose a new password for your Muslim Life OS account.",
      },
      { property: "og:title", content: "Set a new password — Muslim Life OS" },
      {
        property: "og:description",
        content: "Choose a new password for your Muslim Life OS account.",
      },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [token, setToken] = useState(search.token ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Please choose a password of at least 8 characters.");
      return;
    }
    setPending(true);
    try {
      await resetPassword({ token: token.trim(), new_password: password });
      setDone(true);
      setTimeout(() => navigate({ to: "/login", replace: true }), 1800);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "That reset link didn't work. You can request a new one.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthShell
      title="Set a new password"
      subtitle="Paste the token from your email, then choose a new password."
      footer={
        <>
          Need a new link?{" "}
          <Link
            to="/forgot-password"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Request one
          </Link>
        </>
      }
    >
      {done ? (
        <FormNotice>
          Your password has been updated. Taking you to sign in…
        </FormNotice>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="token">Reset token</Label>
            <Input
              id="token"
              required
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error ? <FormNotice>{error}</FormNotice> : null}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? <StarSpinner size={18} /> : "Update password"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
