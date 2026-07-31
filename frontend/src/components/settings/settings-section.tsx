import { useEffect, useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MapPin, Calculator, Sun, Moon, Loader2, Search, X } from "lucide-react";
import { getProfile, updateProfile } from "@/lib/api/endpoints";
import { CALCULATION_METHODS, type CalculationMethod, type AsrMethod } from "@/lib/api/types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export function SettingsSection() {
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [location, setLocation] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [calculationMethod, setCalculationMethod] = useState<CalculationMethod | "">("");
  const [asrMethod, setAsrMethod] = useState<AsrMethod | "">("");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setLocation(profile.timezone || "");
      setCalculationMethod(profile.prayer_calculation_method || "");
      setAsrMethod(profile.asr_method || "");
      
      // Load theme from localStorage
      const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
      if (savedTheme) {
        setTheme(savedTheme);
        document.documentElement.classList.toggle("dark", savedTheme === "dark");
      }
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<typeof profile>) => updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated.",
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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateMutation.mutateAsync({
        timezone: location,
        prayer_calculation_method: calculationMethod || undefined,
        asr_method: asrMethod || undefined,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const debounce = (fn: Function, delay: number) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
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
    if (data && Array.isArray(data)) {
      setSuggestions(data);
    } else {
      setSuggestions([]);
      setLocationError("No results found for this city");
    }
  } catch (error) {
    setSuggestions([]);
    setLocationError("Failed to search location");
  } finally {
    setIsLocationLoading(false);
  }
};

const handleSearchLocation = debounce(searchLocation, 300);

const handleThemeToggle = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
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
      {/* Location Settings */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Location</h3>
        </div>
        <div className="space-y-3">
          <div>
            <Label htmlFor="location">City / Timezone</Label>
            <div className="relative">
              <Input
                id="location"
                placeholder="Search city..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleSearchLocation(e.target.value);
                }}
                className="mt-1.5 w-full"
              />
              {isLocationLoading && (
                <Loader2 className="absolute right-2 top-[50%] -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
              {locationError && (
                <p className="mt-1 text-sm text-destructive">{locationError}</p>
              )}
              {suggestions.length > 0 && !isLocationLoading && (
                <div className="absolute left-0 right-0 mt-1 z-10 max-h-60 overflow-y-auto border border-border rounded bg-card shadow-lg">
                  <ul className="divide-y divide-border">
                    {suggestions.map((suggestion, index) => (
                      <li
                        key={index}
                        onClick={() => {
                          setLocation(suggestion.display_name);
                          setSearchQuery(suggestion.display_name);
                          setSuggestions([]);
                          // Update hidden coordinates
                          setLatitude(parseFloat(suggestion.lat));
                          setLongitude(parseFloat(suggestion.lon));
                        }}
                        className="px-3 py-2 cursor-hover hover:bg-accent/50"
                      >
                        <div className="font-medium">{suggestion.display_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {suggestion.lat}, {suggestion.lon}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Prayer Calculation Settings */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Prayer Times</h3>
        </div>
        <div className="space-y-3">
          <div>
            <Label htmlFor="calculation-method">Calculation Method</Label>
            <Select value={calculationMethod} onValueChange={(v) => setCalculationMethod(v as CalculationMethod)}>
              <SelectTrigger id="calculation-method" className="mt-1.5">
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                {CALCULATION_METHODS.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="asr-method">Asr Method</Label>
            <Select value={asrMethod} onValueChange={(v) => setAsrMethod(v as AsrMethod)}>
              <SelectTrigger id="asr-method" className="mt-1.5">
                <SelectValue placeholder="Select Asr method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STANDARD">Standard (Shafi'i, Maliki, Hanbali)</SelectItem>
                <SelectItem value="HANAFI">Hanafi</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Theme Settings */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          {theme === "light" ? <Sun className="h-5 w-5 text-primary" /> : <Moon className="h-5 w-5 text-primary" />}
          <h3 className="font-semibold">Appearance</h3>
        </div>
        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleThemeToggle}
          >
            {theme === "light" ? (
              <>
                <Moon className="mr-2 h-4 w-4" />
                Switch to Dark Mode
              </>
            ) : (
              <>
                <Sun className="mr-2 h-4 w-4" />
                Switch to Light Mode
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full"
      >
        {isSaving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Save Settings"
        )}
      </Button>
    </div>
  );
}
