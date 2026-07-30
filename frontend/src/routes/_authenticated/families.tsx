import { createFileRoute } from "@tanstack/react-router";
import { EmptyState } from "@/components/brand/states";
import { PageHeader } from "@/components/layout/page-header";

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
  return (
    <>
      <PageHeader title="Family" arabic="الأُسْرَة" subtitle="Walk together" />
      <EmptyState
        title="Family circles are coming"
        message="Creating, inviting and managing members arrives in the final stage of the build."
      />
    </>
  );
}
