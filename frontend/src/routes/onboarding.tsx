import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, useTransition } from "react";
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
import {
  searchLocations,
  type LocationSuggestion,
} from "@/lib/location-search";
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
  const [locationLabel, setLocationLabel] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [timezone, setTimezone] = useState(browserTimezone());
  const [country, setCountry] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [method, setMethod] = useState<CalculationMethod>("MWL");
  const [asr, setAsr] = useState<AsrMethod>("STANDARD");
  const [goals, setGoals] = useState<OnboardingGoal[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const searchAbort = useRef<AbortController | null>(null);

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
        latitude: lat!,
        longitude: lng!,
        timezone,
        country,
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

  function applySuggestion(item: LocationSuggestion) {
    setLocationLabel(item.label);
    setLat(item.latitude);
    setLng(item.longitude);
    setTimezone(item.timezone || browserTimezone());
    setCountry(item.countryCode);
    setSuggestions([]);
    setError(null);
  }

  function detectLocation() {
    setLocating(true);
    setError(null);
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocating(false);
      setError("Your browser can't share a location — search for your city below.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        setLat(latitude);
        setLng(longitude);
        setTimezone(browserTimezone());
        setLocationLabel(
          `Current location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
        );
        setLocating(false);
      },
      () => {
        setLocating(false);
        setError("We couldn't read your location — search for your city below.");
      },
      { timeout: 10000 },
    );
  }

  function runCitySearch(query: string) {
    searchAbort.current?.abort();
    setLocationLabel(query);
    if (query.trim().length < 3) {
      setSuggestions([]);
      setSearching(false);
      return;
    }
    const controller = new AbortController();
    searchAbort.current = controller;
    setSearching(true);
    startTransition(() => {
      void (async () => {
        try {
          const results = await searchLocations(query, controller.signal);
          if (!controller.signal.aborted) setSuggestions(results);
        } catch {
          if (!controller.signal.aborted) setSuggestions([]);
        } finally {
          if (!controller.signal.aborted) setSearching(false);
        }
      })();
    });
  }

  const canContinue =
    step === 0
      ? lat !== null && lng !== null
      : step === 1
        ? true
        : goals.length > 0;

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
                  Search your city (free OpenStreetMap lookup — no API key), or use
                  your device location. Coordinates stay on your account only for
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

              <div className="relative space-y-2">
                <Label htmlFor="city">City search</Label>
                <Input
                  id="city"
                  placeholder="e.g. Thiruvananthapuram, Makkah, London"
                  value={locationLabel}
                  onChange={(e) => runCitySearch(e.target.value)}
                  autoComplete="off"
                />
                {searching ? (
                  <p className="text-xs text-muted-foreground">Searching…</p>
                ) : null}
                {suggestions.length > 0 ? (
                  <ul className="absolute left-0 right-0 z-20 max-h-56 overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
                    {suggestions.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          className="w-full px-3 py-2 text-left text-sm hover:bg-accent/50"
                          onClick={() => applySuggestion(item)}
                        >
                          <span className="block font-medium">{item.label}</span>
                          <span className="block text-xs text-muted-foreground">
                            {item.timezone}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>

              {lat !== null && lng !== null ? (
                <p className="text-xs text-muted-foreground">
                  Selected: {lat.toFixed(4)}°, {lng.toFixed(4)}° · {timezone}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No map API key needed. Pick a city from the suggestions list.
                </p>
              )}
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
