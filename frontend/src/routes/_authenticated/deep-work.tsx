import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { Play, Pause, Square, X } from "lucide-react";

import { logFocusSession } from "@/lib/api/endpoints";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/deep-work")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Deep Work — Muslim Life OS" }],
  }),
  component: DeepWorkPage,
});

function DeepWorkPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  const [isRunning, setIsRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60); // default 25 min
  const [sessionCompleted, setSessionCompleted] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const initialDurationRef = useRef(25 * 60);

  const logSessionMutation = useMutation({
    mutationFn: (durationMins: number) => logFocusSession({ duration_minutes: durationMins, focus_quality: 'good' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["focus_sessions"] });
    },
  });

  useEffect(() => {
    if (isRunning && secondsLeft > 0) {
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0 && isRunning) {
      setIsRunning(false);
      setSessionCompleted(true);
      logSessionMutation.mutate(Math.round(initialDurationRef.current / 60));
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, secondsLeft]);

  const toggleTimer = () => {
    if (!isRunning && secondsLeft === 0) return;
    setIsRunning(!isRunning);
  };

  const endSessionEarly = () => {
    setIsRunning(false);
    const durationPlayed = initialDurationRef.current - secondsLeft;
    if (durationPlayed > 60) { // Log if played for > 1 min
      logSessionMutation.mutate(Math.round(durationPlayed / 60));
    }
    navigate({ to: "/tasks" });
  };

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (sessionCompleted) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center text-center">
        <div className="breath mb-8 flex h-[120px] w-[120px] items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">
          ✨
        </div>
        <h2 className="text-[24px] font-bold text-[var(--ink)]">Session Complete</h2>
        <p className="mt-2 text-[15px] text-[var(--mute)]">
          Alhamdulillah, you stayed focused for {Math.round(initialDurationRef.current / 60)} minutes.
        </p>
        <button 
          onClick={() => navigate({ to: "/tasks" })}
          className="btn mt-8 px-8 py-3 text-[15px]"
        >
          Return to Tasks
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-[80vh] flex-col items-center justify-center relative">
      <button 
        onClick={endSessionEarly}
        className="absolute top-0 right-0 p-3 text-[var(--mute)] hover:text-[var(--ink)]"
      >
        <X className="h-6 w-6" />
      </button>

      <div className="text-center">
        <h1 className="text-[14px] font-medium uppercase tracking-widest text-[var(--mute)] mb-8">Deep Work</h1>
        
        <div className="relative flex items-center justify-center">
          <div className={cn(
            "absolute h-[280px] w-[280px] rounded-full bg-[var(--primary-soft)] opacity-20",
            isRunning && "animate-[pulse_4s_ease-in-out_infinite]"
          )} />
          <div className="z-10 text-[80px] font-light tabular-nums tracking-tight text-[var(--ink)]">
            {formatTime(secondsLeft)}
          </div>
        </div>

        <div className="mt-12 flex items-center justify-center gap-6">
          <button 
            onClick={toggleTimer}
            className="flex h-[64px] w-[64px] items-center justify-center rounded-full bg-[var(--primary)] text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
          >
            {isRunning ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
          </button>
          
          <button 
            onClick={endSessionEarly}
            className="flex h-[48px] w-[48px] items-center justify-center rounded-full border-2 border-[var(--line)] bg-[var(--surface)] text-[var(--mute)] transition-colors hover:border-[var(--primary-soft)] hover:text-[var(--primary)]"
          >
            <Square className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
