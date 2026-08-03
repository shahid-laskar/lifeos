import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/page-header";
import { LoadingBlock } from "@/components/brand/pattern";
import { ErrorState } from "@/components/brand/states";
import { listLearningPaths, getLearningEnrollments, enrollInPath } from "@/lib/api/endpoints";

export const Route = createFileRoute("/_authenticated/learning")({
  component: LearningPage,
});

function LearningPage() {
  const queryClient = useQueryClient();

  const pathsQuery = useQuery({
    queryKey: ["learning-paths"],
    queryFn: listLearningPaths,
  });

  const enrollmentsQuery = useQuery({
    queryKey: ["learning-enrollments"],
    queryFn: getLearningEnrollments,
  });

  const enrollMutation = useMutation({
    mutationFn: enrollInPath,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["learning-enrollments"] });
    },
  });

  const enrollmentsMap = new Map(
    enrollmentsQuery.data?.map((e) => [e.path_id, e]) ?? []
  );

  return (
    <>
      <PageHeader
        title="Learning"
        subtitle="Structured Islamic knowledge paths"
      />

      <div className="flex flex-col gap-4 mt-6">
        {pathsQuery.isPending || enrollmentsQuery.isPending ? (
          <LoadingBlock label="Loading paths" />
        ) : pathsQuery.isError ? (
          <ErrorState
            title="Could not load paths"
            message="Check your connection and try again."
            onRetry={() => pathsQuery.refetch()}
          />
        ) : pathsQuery.data?.length === 0 ? (
          <div className="empty flex flex-col items-center text-center">
             <div className="glyph mb-4 flex h-[38px] w-[38px] items-center justify-center rounded-[12px] bg-[var(--primary-soft)] text-[var(--primary)]">
               📚
             </div>
             <p className="text-[13px] text-[var(--mute)]">No learning paths available yet.</p>
          </div>
        ) : (
          pathsQuery.data?.map((path) => {
            const enrollment = enrollmentsMap.get(path.id);
            const isEnrolled = !!enrollment;
            const progress = enrollment?.progress ?? 0;

            return (
              <div key={path.id} className="card flex flex-col gap-4">
                <div>
                  <h3 className="text-[16px] font-semibold text-[var(--ink)]">
                    {path.title}
                  </h3>
                  <p className="mt-1 text-[13px] text-[var(--mute)] leading-relaxed">
                    {path.description}
                  </p>
                </div>
                
                {isEnrolled ? (
                  <div className="flex flex-col gap-2 mt-2">
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-[var(--primary)] font-medium">In Progress</span>
                      <span className="text-[var(--mute)]">{Math.round(progress * 100)}%</span>
                    </div>
                    <div className="bar relative h-[7px] w-full overflow-hidden rounded-[9px] bg-[var(--line)]">
                      <div
                        className="absolute inset-y-0 left-0 bg-[var(--primary)] transition-all duration-500"
                        style={{ width: `${progress * 100}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 flex">
                    <button
                      type="button"
                      onClick={() => enrollMutation.mutate(path.id)}
                      disabled={enrollMutation.isPending}
                      className="btn"
                    >
                      Enroll
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
