import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell, FormNotice } from "@/components/auth/auth-shell";
import { StarSpinner } from "@/components/brand/pattern";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset } from "@/lib/api/endpoints";

export const Route = createFileRoute("/forgot-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Reset your password — Muslim Life OS" },
      {
        name: "description",
        content: "Request a password reset link for your Muslim Life OS account.",
      },
      { property: "og:title", content: "Reset your password — Muslim Life OS" },
      {
        property: "og:description",
        content: "Request a password reset link for your Muslim Life OS account.",
      },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    try {
      await requestPasswordReset(email.trim());
    } catch {
      // Intentionally ignored: the response is always generic for privacy.
    } finally {
      setPending(false);
      setSent(true);
    }
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We'll send a reset link if this email is registered."
      footer={
        <>
          Have a reset token already?{" "}
          <Link
            to="/reset-password"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Set a new password
          </Link>
        </>
      }
    >
      {sent ? (
        <div className="space-y-4">
          <FormNotice>
            If an account exists for that email, a reset link is on its way. Please
            check your inbox.
          </FormNotice>
          <Button asChild variant="outline" className="w-full">
            <Link to="/login">Back to sign in</Link>
          </Button>
        </div>
      ) : (
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
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? <StarSpinner size={18} /> : "Send reset link"}
          </Button>
          <div className="text-center">
            <Link
              to="/login"
              className="text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              Back to sign in
            </Link>
          </div>
        </form>
      )}
    </AuthShell>
  );
}
