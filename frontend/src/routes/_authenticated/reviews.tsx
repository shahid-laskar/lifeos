import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { CheckCircle2, ChevronRight, ChevronLeft } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { LoadingBlock } from "@/components/brand/pattern";
import { ErrorState } from "@/components/brand/states";
import { getCurrentWeeklyReview, saveWeeklyReview } from "@/lib/api/endpoints";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/reviews")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Weekly Review — Muslim Life OS" }],
  }),
  component: ReviewsPage,
});

const WIZARD_STEPS = [
  { id: "worship", title: "Worship Quality", question: "How would you rate the quality of your worship and prayers this week?" },
  { id: "tasks", title: "Task Completion", question: "Did you accomplish what you set out to do?" },
  { id: "habits", title: "Habit Consistency", question: "How consistent were you with your personal habits?" },
  { id: "intentions", title: "Intentions", question: "What are your primary intentions for the coming week?" },
];

function ReviewsPage() {
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({
    worship_quality: "",
    task_completion: "",
    habit_consistency: "",
    intentions: "",
  });
  
  const [isCompleted, setIsCompleted] = useState(false);

  const reviewQuery = useQuery({
    queryKey: ["weekly_review_current"],
    queryFn: getCurrentWeeklyReview,
  });

  useEffect(() => {
    if (reviewQuery.data && 'id' in reviewQuery.data) {
      const data = reviewQuery.data as any;
      setAnswers({
        worship_quality: data.worship_quality || "",
        task_completion: data.task_completion || "",
        habit_consistency: data.habit_consistency || "",
        intentions: data.intentions || "",
      });
      setIsCompleted(true);
    }
  }, [reviewQuery.data]);

  const saveMutation = useMutation({
    mutationFn: (data: typeof answers) => saveWeeklyReview(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weekly_review_current"] });
      setIsCompleted(true);
    },
  });

  const handleNext = () => {
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(curr => curr + 1);
    } else {
      saveMutation.mutate(answers);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(curr => curr - 1);
    }
  };

  return (
    <>
      <PageHeader title="Weekly Review" subtitle="Reflect on your past week to improve the next" arabic="مُرَاجَعَة" />

      <div className="flex flex-col gap-6 mt-6">
        {reviewQuery.isPending ? (
          <LoadingBlock label="Loading your review..." />
        ) : reviewQuery.isError ? (
          <ErrorState 
            title="Couldn't load review" 
            message="Please try again." 
            onRetry={() => reviewQuery.refetch()} 
          />
        ) : isCompleted && !saveMutation.isPending ? (
          <div className="card p-8 flex flex-col items-center justify-center text-center">
            <CheckCircle2 className="h-12 w-12 text-[var(--primary)] mb-4" />
            <h2 className="text-[20px] font-bold text-[var(--ink)]">Review Completed</h2>
            <p className="text-[14px] text-[var(--mute)] mt-2 max-w-md">
              Alhamdulillah, you've reflected on your week. May Allah accept your efforts and grant you success in the coming week.
            </p>
            
            <button 
              onClick={() => {
                setIsCompleted(false);
                setCurrentStep(0);
              }}
              className="btn mt-6"
            >
              Edit Review
            </button>
          </div>
        ) : (
          <div className="card p-6 border-[var(--primary)] border">
            {/* Wizard Header / Progress */}
            <div className="flex items-center gap-2 mb-6">
              {WIZARD_STEPS.map((step, idx) => (
                <div key={step.id} className="flex-1 flex flex-col gap-1">
                  <div className={cn(
                    "h-1.5 w-full rounded-full transition-colors",
                    idx <= currentStep ? "bg-[var(--primary)]" : "bg-[var(--line)]"
                  )} />
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-wider hidden sm:block",
                    idx === currentStep ? "text-[var(--primary)]" : "text-[var(--mute)]"
                  )}>
                    {step.title}
                  </span>
                </div>
              ))}
            </div>

            <div className="py-4">
              <h3 className="text-[18px] font-semibold text-[var(--ink)] mb-1">
                {WIZARD_STEPS[currentStep].title}
              </h3>
              <p className="text-[14px] text-[var(--mute)] mb-4">
                {WIZARD_STEPS[currentStep].question}
              </p>
              
              <textarea 
                autoFocus
                className="w-full min-h-[120px] bg-[var(--surface)] border border-[var(--line)] rounded-xl p-4 text-[14px] outline-none focus:border-[var(--primary)] resize-none"
                placeholder="Write your reflections here..."
                value={
                  currentStep === 0 ? answers.worship_quality :
                  currentStep === 1 ? answers.task_completion :
                  currentStep === 2 ? answers.habit_consistency :
                  answers.intentions
                }
                onChange={e => {
                  const val = e.target.value;
                  setAnswers(prev => {
                    const key = currentStep === 0 ? 'worship_quality' :
                                currentStep === 1 ? 'task_completion' :
                                currentStep === 2 ? 'habit_consistency' :
                                'intentions';
                    return { ...prev, [key]: val };
                  });
                }}
              />
            </div>
            
            <div className="flex justify-between mt-4">
              <button 
                onClick={handlePrev}
                disabled={currentStep === 0}
                className={cn(
                  "flex items-center gap-1 text-[13px] font-medium px-4 py-2 rounded-lg transition-colors",
                  currentStep === 0 ? "text-[var(--mute)] opacity-50 cursor-not-allowed" : "text-[var(--ink)] bg-[var(--surface)] hover:bg-[var(--line)]"
                )}
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </button>
              
              <button 
                onClick={handleNext}
                disabled={saveMutation.isPending}
                className="btn flex items-center gap-1"
              >
                {currentStep === WIZARD_STEPS.length - 1 ? "Complete Review" : "Next"} 
                {currentStep !== WIZARD_STEPS.length - 1 && <ChevronRight className="h-4 w-4" />}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
