import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Mail, Plus, Loader2 } from "lucide-react";
import { createFamily } from "@/lib/api/endpoints";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

export function CreateFamilyPrompt() {
  const [name, setName] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (familyName: string) => createFamily(familyName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["families"] });
      toast({
        title: "Family created",
        description: "Your family circle is ready. You can now invite members.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to create family",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      createMutation.mutate(name.trim());
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 text-center shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <Users className="h-6 w-6 text-primary" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-foreground">Create a Family Circle</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
        Share household context cleanly and respectfully without tracking each other's private
        worship.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 max-w-sm mx-auto text-left">
        <div>
          <Label htmlFor="family-name">Family Name</Label>
          <Input
            id="family-name"
            placeholder="e.g. Al-Mansoor Household"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1.5"
            required
          />
        </div>
        <Button
          type="submit"
          disabled={!name.trim() || createMutation.isPending}
          className="w-full min-h-[48px]"
        >
          {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Start Family Circle
        </Button>
      </form>
    </div>
  );
}
