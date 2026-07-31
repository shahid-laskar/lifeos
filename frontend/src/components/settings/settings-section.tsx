import { useEffect, useState, useTransition } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MapPin, Calculator, Sun, Moon, Monitor, Loader2, Check, User, Globe, ExternalLink } from "lucide-react";
import { getProfile, updateProfile } from "@/lib/api/endpoints";
import { CALCULATION_METHODS, type CalculationMethod, type AsrMethod } from "@/lib/api/types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { applyTheme, getStoredTheme, type Theme } from "@/lib/theme";
import { Link } from "@tanstack/react-router";

export function SettingsSection() {
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [preferredLanguage, setPreferredLanguage] = useState("en");
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [currentTheme, setCurrentTheme] = useState<Theme>("system");

  useEffect(() => {
    if (profile) {
      setPreferredLanguage(profile.preferred_language || "en");
      if (profile.timezone || profile.country) {
        setSearchQuery([profile.country, profile.timezone].filter(Boolean).join(" / "));
      }
    }
    setCurrentTheme(getStoredTheme());
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<typeof profile>) => updateProfile(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      const previous = profile;
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated.",
        action: previous ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              updateMutation.mutate(previous);
            }}
          >
            Undo
          </Button>
        ) : undefined,
      });
    },
    onError: () => {
      toast({
        title: "Failed to save",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleLanguageChange = (lang: string) => {
    setPreferredLanguage(lang);
    updateMutation.mutate({ preferred_language: lang });
  };

  const handleCalculationMethodChange = (method: CalculationMethod) => {
    updateMutation.mutate({ prayer_calculation_method: method });
  };

  const handleAsrMethodChange = (method: AsrMethod) => {
    updateMutation.mutate({ asr_method: method });
  };

  const searchLocation = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }
    setIsLocationLoading(true);
    setLocationError("");
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`
      );
      const data = await response.json();
      if (data && Array.isArray(data) && data.length > 0) {
        setSuggestions(data);
      } else {
        setSuggestions([]);
        setLocationError("No results found for this location.");
      }
    } catch {
      setSuggestions([]);
      setLocationError("Failed to search location.");
    } finally {
      setIsLocationLoading(false);
    }
  };

  const handleThemeChange = (newTheme: Theme) => {
    setCurrentTheme(newTheme);
    applyTheme(newTheme);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Section */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Profile</h3>
        </div>
        <div className="space-y-3">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={profile?.email || ""} disabled className="mt-1.5 bg-muted" />
          </div>
          <div>
            <Label htmlFor="language">Preferred Language</Label>
            <Select value={preferredLanguage} onValueChange={handleLanguageChange}>
              <SelectTrigger id="language" className="mt-1.5">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ar">العربية (Arabic)</SelectItem>
                <SelectItem value="ur">اردو (Urdu)</SelectItem>
                <SelectItem value="bn">বাংলা (Bengali)</SelectItem>
                <SelectItem value="id">Bahasa Indonesia</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Location Settings */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Location</h3>
        </div>
        <div className="space-y-3">
          <div>
            <Label htmlFor="location">City / Location Search</Label>
            <div className="relative">
              <Input
                id="location"
                placeholder="Type city name (e.g. London, Makkah, Karachi)..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  searchLocation(e.target.value);
                }}
                className="mt-1.5 w-full"
              />
              {isLocationLoading && (
                <Loader2 className="absolute right-3 top-[50%] -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
              {locationError && (
                <p className="mt-1 text-xs text-destructive">{locationError}</p>
              )}
              {suggestions.length > 0 && !isLocationLoading && (
                <div className="absolute left-0 right-0 mt-1 z-20 max-h-60 overflow-y-auto border border-border rounded-lg bg-card shadow-lg">
                  <ul className="divide-y divide-border">
                    {suggestions.map((item, index) => (
                      <li
                        key={index}
                        onClick={() => {
                          const lat = parseFloat(item.lat);
                          const lon = parseFloat(item.lon);
                          const country = item.address?.country_code?.toUpperCase() || null;
                          setSearchQuery(item.display_name);
                          setSuggestions([]);
                          updateMutation.mutate({
                            latitude: lat,
                            longitude: lon,
                            country: country,
                            timezone: item.display_name.split(",")[0],
                          });
                        }}
                        className="px-3 py-2 cursor-pointer hover:bg-accent/50 transition-colors"
                      >
                        <div className="font-medium text-sm text-foreground">{item.display_name}</div>
                        <div className="text-xs text-muted-foreground">
                          Lat: {item.lat}, Lon: {item.lon}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            {profile?.latitude && profile?.longitude && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                Current coordinates: {profile.latitude.toFixed(4)}°, {profile.longitude.toFixed(4)}°
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Prayer Calculation Settings */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Prayer Times Calculation</h3>
        </div>
        <div className="space-y-4">
          <div>
            <Label htmlFor="calculation-method">Calculation Method</Label>
            <Select
              value={profile?.prayer_calculation_method || ""}
              onValueChange={(v) => handleCalculationMethodChange(v as CalculationMethod)}
            >
              <SelectTrigger id="calculation-method" className="mt-1.5">
                <SelectValue placeholder="Select calculation method" />
              </SelectTrigger>
              <SelectContent>
                {CALCULATION_METHODS.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1 text-xs text-muted-foreground">
              Determines Fajr & Isha twilight angles based on your region's scholarly authority.
            </p>
          </div>
          <div>
            <Label htmlFor="asr-method">Asr Juristic Method</Label>
            <Select
              value={profile?.asr_method || "STANDARD"}
              onValueChange={(v) => handleAsrMethodChange(v as AsrMethod)}
            >
              <SelectTrigger id="asr-method" className="mt-1.5">
                <SelectValue placeholder="Select Asr method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STANDARD">Standard (Shafi'i, Maliki, Hanbali - shadow ratio 1:1)</SelectItem>
                <SelectItem value="HANAFI">Hanafi (shadow ratio 2:1)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Appearance Settings */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Sun className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Appearance</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => handleThemeChange("light")}
            className={`flex flex-col items-center justify-center gap-2 rounded-lg border p-3 text-xs font-medium transition-all ${
              currentTheme === "light"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border hover:bg-accent text-muted-foreground"
            }`}
          >
            <Sun className="h-5 w-5" />
            <span>Light</span>
          </button>
          <button
            type="button"
            onClick={() => handleThemeChange("dark")}
            className={`flex flex-col items-center justify-center gap-2 rounded-lg border p-3 text-xs font-medium transition-all ${
              currentTheme === "dark"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border hover:bg-accent text-muted-foreground"
            }`}
          >
            <Moon className="h-5 w-5" />
            <span>Dark</span>
          </button>
          <button
            type="button"
            onClick={() => handleThemeChange("system")}
            className={`flex flex-col items-center justify-center gap-2 rounded-lg border p-3 text-xs font-medium transition-all ${
              currentTheme === "system"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border hover:bg-accent text-muted-foreground"
            }`}
          >
            <Monitor className="h-5 w-5" />
            <span>System</span>
          </button>
        </div>
      </div>

      {/* Family & Account Section */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-sm">Family Circle</h4>
            <p className="text-xs text-muted-foreground">Manage household members and invitations</p>
          </div>
          <Link
            to="/families"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            Manage Family <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
        <div className="border-t border-border pt-4 flex items-center justify-between">
          <div>
            <h4 className="font-medium text-sm">Data & Privacy</h4>
            <p className="text-xs text-muted-foreground">Download your complete data export</p>
          </div>
          <a
            href="/api/v1/governance/my-data"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            Export Data <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}