import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { listMyFamilies, getProfile } from "@/lib/api/endpoints";
import { PageHeader } from "@/components/layout/page-header";
import { CreateFamilyPrompt } from "@/components/family/create-family-prompt";
import { FamilyDashboard } from "@/components/family/family-dashboard";

export const Route = createFileRoute("/_authenticated/families")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Family — Muslim Life OS" },
      {
        name: "description",
        content: "Share the journey with your household through family circles.",
      },
      { property: "og:title", content: "Family — Muslim Life OS" },
      {
        property: "og:description",
        content: "Share the journey with your household through family circles.",
      },
    ],
  }),
  component: FamiliesPage,
});

function FamiliesPage() {
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
  });

  const { data: families = [], isLoading } = useQuery({
    queryKey: ["families"],
    queryFn: listMyFamilies,
  });

  return (
    <>
      <PageHeader title="Family" arabic="الأُسْرَة" subtitle="Walk together" />
      <div className="px-5 pb-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : families.length === 0 ? (
          <CreateFamilyPrompt />
        ) : (
          <FamilyDashboard family={families[0]} currentUserId={profile?.id || ""} />
        )}
      </div>
    </>
  );
}

