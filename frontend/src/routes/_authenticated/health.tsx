import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Moon, Activity, Battery, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { getSleepLogs, createSleepLog, getExerciseLogs, createExerciseLog, getEnergyLogs, createEnergyLog } from "@/lib/api/endpoints";

export const Route = createFileRoute("/_authenticated/health")({
  component: HealthPage,
});

function HealthPage() {
  return (
    <>
      <PageHeader title="Health" arabic="الصحة" subtitle="Your body is an Amanah" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SleepTracker />
        <ExerciseTracker />
        <EnergyTracker />
      </div>
    </>
  );
}

function SleepTracker() {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [sleepTime, setSleepTime] = useState("");
  const [wakeTime, setWakeTime] = useState("");
  const [quality, setQuality] = useState(3);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["health-sleep"],
    queryFn: getSleepLogs,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => createSleepLog(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health-sleep"] });
      setIsAdding(false);
      setSleepTime("");
      setWakeTime("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      date,
      sleep_time: sleepTime ? new Date(`${date}T${sleepTime}`).toISOString() : null,
      wake_time: wakeTime ? new Date(`${date}T${wakeTime}`).toISOString() : null,
      quality
    });
  };

  return (
    <div className="card p-5 border-[var(--line)]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-[16px] text-[var(--ink)] flex items-center gap-2">
          <Moon className="h-4 w-4" /> Sleep Tracker
        </h3>
        <button onClick={() => setIsAdding(!isAdding)} className="text-[var(--primary)] text-[13px] font-medium flex items-center gap-1">
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="mb-5 p-4 bg-[var(--surface)] border border-[var(--line)] rounded-lg flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[12px] text-[var(--mute)] mb-1 block">Bedtime</label>
              <input type="time" required value={sleepTime} onChange={e => setSleepTime(e.target.value)} className="w-full bg-white border border-[var(--line)] rounded-md px-2 py-1 text-[13px]" />
            </div>
            <div className="flex-1">
              <label className="text-[12px] text-[var(--mute)] mb-1 block">Wake Time</label>
              <input type="time" required value={wakeTime} onChange={e => setWakeTime(e.target.value)} className="w-full bg-white border border-[var(--line)] rounded-md px-2 py-1 text-[13px]" />
            </div>
          </div>
          <div>
            <label className="text-[12px] text-[var(--mute)] mb-1 block">Quality (1-5)</label>
            <input type="range" min="1" max="5" value={quality} onChange={e => setQuality(Number(e.target.value))} className="w-full" />
            <div className="flex justify-between text-[11px] text-[var(--mute)] px-1 mt-1">
              <span>Poor</span>
              <span>Great</span>
            </div>
          </div>
          <div className="flex justify-end mt-2">
            <button type="submit" disabled={createMutation.isPending} className="btn text-[13px] px-3 py-1">Save Log</button>
          </div>
        </form>
      )}

      <div className="flex flex-col gap-3">
        {isLoading ? (
          <p className="text-[13px] text-[var(--mute)] text-center py-4">Loading...</p>
        ) : logs.length === 0 ? (
          <p className="text-[13px] text-[var(--mute)] text-center py-4">No sleep logged yet.</p>
        ) : (
          logs.slice(0, 5).map(log => (
            <div key={log.id} className="flex justify-between items-center p-3 bg-[var(--surface)] border border-[var(--line)] rounded-lg">
              <div>
                <p className="text-[14px] font-medium text-[var(--ink)]">{log.date}</p>
                <div className="flex gap-2 mt-1">
                  {Array.from({length: 5}).map((_, i) => (
                    <div key={i} className={`h-1.5 w-4 rounded-full ${i < (log.quality || 0) ? 'bg-[var(--primary)]' : 'bg-[var(--line)]'}`} />
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ExerciseTracker() {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [type, setType] = useState("");
  const [duration, setDuration] = useState("");

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["health-exercise"],
    queryFn: getExerciseLogs,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => createExerciseLog(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health-exercise"] });
      setIsAdding(false);
      setType("");
      setDuration("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      date,
      exercise_type: type,
      duration_minutes: parseInt(duration),
    });
  };

  return (
    <div className="card p-5 border-[var(--line)]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-[16px] text-[var(--ink)] flex items-center gap-2">
          <Activity className="h-4 w-4" /> Exercise
        </h3>
        <button onClick={() => setIsAdding(!isAdding)} className="text-[var(--primary)] text-[13px] font-medium flex items-center gap-1">
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="mb-5 p-4 bg-[var(--surface)] border border-[var(--line)] rounded-lg flex flex-col gap-3">
          <div>
            <label className="text-[12px] text-[var(--mute)] mb-1 block">Activity Type</label>
            <input type="text" required value={type} onChange={e => setType(e.target.value)} placeholder="e.g. Running, Gym" className="w-full bg-white border border-[var(--line)] rounded-md px-2 py-1 text-[13px]" />
          </div>
          <div>
            <label className="text-[12px] text-[var(--mute)] mb-1 block">Duration (mins)</label>
            <input type="number" required min="1" value={duration} onChange={e => setDuration(e.target.value)} className="w-full bg-white border border-[var(--line)] rounded-md px-2 py-1 text-[13px]" />
          </div>
          <div className="flex justify-end mt-2">
            <button type="submit" disabled={createMutation.isPending} className="btn text-[13px] px-3 py-1">Save Log</button>
          </div>
        </form>
      )}

      <div className="flex flex-col gap-3">
        {isLoading ? (
          <p className="text-[13px] text-[var(--mute)] text-center py-4">Loading...</p>
        ) : logs.length === 0 ? (
          <p className="text-[13px] text-[var(--mute)] text-center py-4">No exercise logged yet.</p>
        ) : (
          logs.slice(0, 5).map(log => (
            <div key={log.id} className="flex justify-between items-center p-3 bg-[var(--surface)] border border-[var(--line)] rounded-lg">
              <div>
                <p className="text-[14px] font-medium text-[var(--ink)]">{log.exercise_type}</p>
                <p className="text-[12px] text-[var(--mute)]">{log.date}</p>
              </div>
              <div className="text-[14px] font-bold text-[var(--ink)] bg-white px-2 py-1 rounded border border-[var(--line)]">
                {log.duration_minutes}m
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function EnergyTracker() {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [level, setLevel] = useState(3);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["health-energy"],
    queryFn: getEnergyLogs,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => createEnergyLog(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health-energy"] });
      setIsAdding(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      date,
      energy_level: level,
    });
  };

  return (
    <div className="card p-5 border-[var(--line)]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-[16px] text-[var(--ink)] flex items-center gap-2">
          <Battery className="h-4 w-4" /> Daily Energy
        </h3>
        <button onClick={() => setIsAdding(!isAdding)} className="text-[var(--primary)] text-[13px] font-medium flex items-center gap-1">
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="mb-5 p-4 bg-[var(--surface)] border border-[var(--line)] rounded-lg flex flex-col gap-3">
          <div>
            <label className="text-[12px] text-[var(--mute)] mb-1 block">Energy Level (1-5)</label>
            <input type="range" min="1" max="5" value={level} onChange={e => setLevel(Number(e.target.value))} className="w-full" />
            <div className="flex justify-between text-[11px] text-[var(--mute)] px-1 mt-1">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>
          <div className="flex justify-end mt-2">
            <button type="submit" disabled={createMutation.isPending} className="btn text-[13px] px-3 py-1">Save Log</button>
          </div>
        </form>
      )}

      <div className="flex flex-col gap-3">
        {isLoading ? (
          <p className="text-[13px] text-[var(--mute)] text-center py-4">Loading...</p>
        ) : logs.length === 0 ? (
          <p className="text-[13px] text-[var(--mute)] text-center py-4">No energy logged yet.</p>
        ) : (
          logs.slice(0, 5).map(log => (
            <div key={log.id} className="flex justify-between items-center p-3 bg-[var(--surface)] border border-[var(--line)] rounded-lg">
              <div>
                <p className="text-[14px] font-medium text-[var(--ink)]">{log.date}</p>
              </div>
              <div className="flex gap-1">
                {Array.from({length: 5}).map((_, i) => (
                  <div key={i} className={`h-4 w-2 rounded-sm ${i < log.energy_level ? 'bg-amber-400' : 'bg-[var(--line)]'}`} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
