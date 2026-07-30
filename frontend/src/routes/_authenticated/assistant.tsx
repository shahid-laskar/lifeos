import { createFileRoute } from "@tanstack/react-router";
import { EmptyState } from "@/components/brand/states";
import { PageHeader } from "@/components/layout/page-header";

export const Route = createFileRoute("/_authenticated/assistant")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Assistant — Muslim Life OS" },
      {
        name: "description",
        content: "Ask questions and reflect with a careful, safety-aware assistant.",
      },
      { property: "og:title", content: "Assistant — Muslim Life OS" },
      {
        property: "og:description",
        content: "Ask questions and reflect with a careful, safety-aware assistant.",
      },
    ],
  }),
  component: AssistantPage,
});

function AssistantPage() {
  return (
    <>
      <PageHeader title="Assistant" arabic="مُساعِد" subtitle="Ask, slowly" />
      <EmptyState
        title="A quiet place for questions"
        message="Conversations and memory arrive in the final stage of the build."
      />
    </>
  );
}
