import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GeometricPattern, StarSpinner } from "@/components/brand/pattern";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getOnboardingStatus, updateProfile } from "@/lib/api/endpoints";
import {
  CALCULATION_METHODS,
  ONBOARDING_GOALS,
  type AsrMethod,
  type CalculationMethod,
  type OnboardingGoal,
} from "@/lib/api/types";
import { useIsAuthenticated } from "@/lib/auth";
import { browserTimezone } from "@/lib/prayer";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Set up your practice — Muslim Life OS" },
      {
        name: "description",
        content:
          "Set your location, prayer calculation method and goals so your times are accurate.",
      },
      { property: "og:title", content: "Set up your practice — Muslim Life OS" },
      {
        property: "og:description",
        content:
          "Set your location, prayer calculation method and goals so your times are accurate.",
      },
    ],
  }),
  component: OnboardingPage,
});

function OnboardingPage() {
  const navigate = useNavigate();
  const isAuthenticated = useIsAuthenticated();
  const [step, setStep] = useState(0);
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [locating, setLocating] = useState(false);
  const [method, setMethod] = useState<CalculationMethod>("MWL");
  const [asr, setAsr] = useState<AsrMethod>("STANDARD");
  const [goals, setGoals] = useState<OnboardingGoal[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) navigate({ to: "/login", replace: true });
  }, [isAuthenticated, navigate]);

  const status = useQuery({
    queryKey: ["onboarding-status"],
    queryFn: getOnboardingStatus,
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (status.data?.first_meaningful_outcome_available) {
      navigate({ to: "/home", replace: true });
    }
  }, [status.data, navigate]);

  const save = useMutation({
    mutationFn: () =>
      updateProfile({
        latitude: Number(lat),
        longitude: Number(lng),
        timezone: browserTimezone(),
        prayer_calculation_method: method,
        asr_method: asr,
        goals,
      }),
    onSuccess: () => navigate({ to: "/home", replace: true }),
    onError: (err: unknown) =>
      setError(
        err instanceof Error
          ? err.message
          : "We couldn't save that just now. Please try again.",
      ),
  });

  function detectLocation() {
    setLocating(true);
    setError(null);
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocating(false);
      setError("Your browser can't share a location — enter it manually below.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude.toFixed(5));
        setLng(position.coords.longitude.toFixed(5));
        setLocating(false);
      },
      () => {
        setLocating(false);
        setError("We couldn't read your location — enter it manually below.");
      },
      { timeout: 10000 },
    );
  }

  const canContinue =
    step === 0 ? lat !== "" && lng !== "" : step === 1 ? true : goals.length > 0;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-10">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card p-7">
        <GeometricPattern className="text-primary" opacity={0.05} />
        <div className="relative">
          <div className="flex items-center justify-center gap-2">
            {[0, 1, 2].map((index) => (
              <span
                key={index}
                className={cn(
                  "h-1.5 w-10 rounded-full",
                  index <= step ? "bg-gold" : "bg-border",
                )}
              />
            ))}
          </div>

          {step === 0 ? (
            <div className="mt-7 space-y-4">
              <div>
                <h1 className="text-xl font-semibold">Where are you praying from?</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your location stays with your account and is used only to calculate
                  prayer times.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={detectLocation}
                disabled={locating}
              >
                {locating ? <StarSpinner size={18} /> : "Use my current location"}
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="lat">Latitude</Label>
                  <Input
                    id="lat"
                    inputMode="decimal"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lng">Longitude</Label>
                  <Input
                    id="lng"
                    inputMode="decimal"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                  />
                </div>
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="mt-7 space-y-4">
              <div>
                <h1 className="text-xl font-semibold">How should we calculate?</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Follow whichever convention your local community uses.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="method">Calculation method</Label>
                <Select
                  value={method}
                  onValueChange={(value) => setMethod(value as CalculationMethod)}
                >
                  <SelectTrigger id="method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CALCULATION_METHODS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="asr">Asr method</Label>
                <Select
                  value={asr}
                  onValueChange={(value) => setAsr(value as AsrMethod)}
                >
                  <SelectTrigger id="asr">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STANDARD">Standard</SelectItem>
                    <SelectItem value="HANAFI">Hanafi</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Standard places Asr when an object's shadow equals its own length;
                  Hanafi waits until the shadow is twice that length, so Asr comes
                  later in the afternoon.
                </p>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="mt-7 space-y-4">
              <div>
                <h1 className="text-xl font-semibold">What matters to you now?</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Choose as many as you like. You can change these any time.
                </p>
              </div>
              <ul className="space-y-2">
                {ONBOARDING_GOALS.map((goal) => {
                  const selected = goals.includes(goal.value);
                  return (
                    <li key={goal.value}>
                      <button
                        type="button"
                        onClick={() =>
                          setGoals((prev) =>
                            prev.includes(goal.value)
                              ? prev.filter((item) => item !== goal.value)
                              : [...prev, goal.value],
                          )
                        }
                        className={cn(
                          "w-full rounded-xl border px-4 py-3 text-start transition-colors",
                          selected
                            ? "border-primary bg-primary/8"
                            : "border-border bg-background hover:bg-accent/40",
                        )}
                      >
                        <span className="block text-sm font-medium text-foreground">
                          {goal.label}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {goal.note}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}

          {error ? (
            <p className="mt-4 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
              {error}
            </p>
          ) : null}

          <div className="mt-7 flex gap-3">
            {step > 0 ? (
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setStep((s) => s - 1)}
              >
                Back
              </Button>
            ) : null}
            <Button
              type="button"
              className="flex-1"
              disabled={!canContinue || save.isPending}
              onClick={() => (step < 2 ? setStep((s) => s + 1) : save.mutate())}
            >
              {save.isPending ? (
                <StarSpinner size={18} />
              ) : step < 2 ? (
                "Continue"
              ) : (
                "Finish setup"
              )}
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
