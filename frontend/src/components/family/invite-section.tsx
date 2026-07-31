import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Mail, Send, Copy, Check, Trash2, Loader2, AlertCircle } from "lucide-react";
import { inviteMember, revokeInvitation } from "@/lib/api/endpoints";
import { type FamilyInvitation } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

interface InviteSectionProps {
  familyId: string;
  invitations: FamilyInvitation[];
  isOwner: boolean;
}

export function InviteSection({ familyId, invitations, isOwner }: InviteSectionProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("adult");
  const [createdInvitation, setCreatedInvitation] = useState<FamilyInvitation | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const inviteMutation = useMutation({
    mutationFn: () => inviteMember(familyId, email.trim(), role),
    onSuccess: (data) => {
      setCreatedInvitation(data);
      setEmail("");
      queryClient.invalidateQueries({ queryKey: ["family-invitations", familyId] });
      toast({
        title: "Invitation created",
        description: `Invite token generated for ${data.invited_email}.`,
      });
    },
    onError: () => {
      toast({
        title: "Failed to create invite",
        description: "Please check the email and try again.",
        variant: "destructive",
      });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (invId: string) => revokeInvitation(familyId, invId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["family-invitations", familyId] });
      toast({
        title: "Invitation revoked",
        description: "The invitation has been cancelled.",
      });
    },
  });

  if (!isOwner) return null;

  const pendingInvitations = invitations.filter((i) => i.status === "pending");

  const copyInviteLink = (token: string) => {
    const link = `${window.location.origin}/invite?id=${token}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Link copied",
      description: "Invitation link copied to clipboard.",
    });
  };

  return (
    <div className="space-y-6 rounded-xl border border-border bg-card p-5">
      <div>
        <h3 className="font-semibold text-base flex items-center gap-2">
          <Mail className="h-4 w-4 text-primary" /> Invite Family Member
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Invited members can join using their registered email.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (email.trim()) inviteMutation.mutate();
        }}
        className="space-y-3"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <Label htmlFor="invite-email">Email Address</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="family.member@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="invite-role">Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger id="invite-role" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="adult">Adult</SelectItem>
                <SelectItem value="dependent">Dependent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button
          type="submit"
          disabled={!email.trim() || inviteMutation.isPending}
          className="w-full sm:w-auto min-h-[44px]"
        >
          {inviteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Send Invitation
        </Button>
      </form>

      {createdInvitation && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs space-y-2">
          <div className="flex items-center justify-between font-medium text-foreground">
            <span>Invite Token / Link</span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={() => copyInviteLink(createdInvitation.id)}
            >
              {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied" : "Copy Link"}
            </Button>
          </div>
          <p className="font-mono text-[11px] break-all bg-background p-2 rounded border border-border">
            {window.location.origin}/invite?id={createdInvitation.id}
          </p>
        </div>
      )}

      {pendingInvitations.length > 0 && (
        <div className="border-t border-border pt-4 space-y-3">
          <h4 className="font-medium text-xs text-muted-foreground uppercase tracking-wider">
            Pending Invitations ({pendingInvitations.length})
          </h4>
          <div className="divide-y divide-border">
            {pendingInvitations.map((inv) => (
              <div key={inv.id} className="py-2 flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-foreground">{inv.invited_email}</p>
                  <p className="text-xs text-muted-foreground">
                    Role: {inv.role} • Expires: {new Date(inv.expires_at).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => revokeMutation.mutate(inv.id)}
                  disabled={revokeMutation.isPending}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}