import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Users, UserMinus, ShieldAlert, LogOut, Trash2, Shield, HeartHandshake } from "lucide-react";
import { removeMember, deleteFamily, listInvitations } from "@/lib/api/endpoints";
import { type Family } from "@/lib/api/types";
import { InviteSection } from "./invite-section";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface FamilyDashboardProps {
  family: Family;
  currentUserId: string;
}

export function FamilyDashboard({ family, currentUserId }: FamilyDashboardProps) {
  const isOwner = family.owner_id === currentUserId;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: invitations = [] } = useQuery({
    queryKey: ["family-invitations", family.id],
    queryFn: () => listInvitations(family.id),
    enabled: isOwner,
  });

  const removeMemberMutation = useMutation({
    mutationFn: (targetUserId: string) => removeMember(family.id, targetUserId),
    onSuccess: (_, targetUserId) => {
      queryClient.invalidateQueries({ queryKey: ["families"] });
      const isSelf = targetUserId === currentUserId;
      toast({
        title: isSelf ? "Left family" : "Member removed",
        description: isSelf
          ? "You have left the family circle."
          : "The member was removed from the family.",
      });
    },
    onError: () => {
      toast({
        title: "Action failed",
        description: "Could not remove member.",
        variant: "destructive",
      });
    },
  });

  const deleteFamilyMutation = useMutation({
    mutationFn: () => deleteFamily(family.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["families"] });
      toast({
        title: "Family disbanded",
        description: "The family circle has been permanently removed.",
      });
    },
    onError: () => {
      toast({
        title: "Action failed",
        description: "Could not delete family.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              <Users className="h-3.5 w-3.5" /> Family Circle
            </span>
            <h2 className="mt-2 text-xl font-bold text-foreground">{family.name}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Created {new Date(family.created_at).toLocaleDateString()} • {family.members.length} member(s)
            </p>
          </div>
        </div>

        {/* Privacy Assurance Box */}
        <div className="mt-4 rounded-lg bg-accent/40 border border-border p-3 text-xs text-muted-foreground flex items-start gap-2">
          <HeartHandshake className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <span>
            Family privacy is enforced: member worship logs, Qur'an reading, and dhikr counts remain private to each individual (Article 6).
          </span>
        </div>
      </div>

      {/* Member List */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-semibold text-base mb-3">Household Members</h3>
        <div className="divide-y divide-border">
          {family.members.map((member) => {
            const isSelf = member.user_id === currentUserId;
            const isMemberOwner = member.user_id === family.owner_id;

            return (
              <div key={member.user_id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted font-medium text-sm text-foreground">
                    {member.user_id.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-foreground">
                        {isSelf ? "You" : `Member (${member.user_id.substring(0, 8)})`}
                      </span>
                      {isMemberOwner && (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                          <Shield className="h-3 w-3" /> Owner
                        </span>
                      )}
                      {!isMemberOwner && (
                        <span className="capitalize rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {member.role}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Removal / Leave Buttons */}
                {!isMemberOwner && (isOwner || isSelf) && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8"
                      >
                        {isSelf ? <LogOut className="h-4 w-4 mr-1" /> : <UserMinus className="h-4 w-4 mr-1" />}
                        {isSelf ? "Leave" : "Remove"}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {isSelf ? "Leave Family Circle?" : "Remove Member?"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {isSelf
                            ? "You will no longer be part of this family circle. You can rejoin only via a new invitation."
                            : "This member will be removed from the household circle."}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => removeMemberMutation.mutate(member.user_id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Confirm
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Invite Section */}
      <InviteSection familyId={family.id} invitations={invitations} isOwner={isOwner} />

      {/* Owner Danger Zone */}
      {isOwner && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
          <h3 className="font-semibold text-base text-destructive flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" /> Danger Zone
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Disband this family circle. All invitations will be revoked and members unlinked.
          </p>
          <div className="mt-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="min-h-[44px]">
                  <Trash2 className="h-4 w-4 mr-1.5" /> Disband Family Circle
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Disband Family Circle?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This is an irreversible structural change. All family members will lose access to this family group.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteFamilyMutation.mutate()}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Disband Family
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}
    </div>
  );
}