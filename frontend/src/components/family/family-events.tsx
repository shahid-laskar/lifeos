import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Calendar as CalendarIcon, Plus, Trash2 } from "lucide-react";
import { getFamilyEvents, createFamilyEvent, deleteFamilyEvent } from "@/lib/api/endpoints";

export function FamilyEvents({ familyId, currentUserId }: { familyId: string, currentUserId: string }) {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["family-events", familyId],
    queryFn: () => getFamilyEvents(familyId),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => createFamilyEvent(familyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["family-events", familyId] });
      setIsAdding(false);
      setTitle("");
      setStartTime("");
      setEndTime("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (eventId: string) => deleteFamilyEvent(familyId, eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["family-events", familyId] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startTime || !endTime) return;
    
    createMutation.mutate({
      title,
      start_time: new Date(startTime).toISOString(),
      end_time: new Date(endTime).toISOString(),
      is_all_day: false
    });
  };

  return (
    <div className="card p-5 border-[var(--line)]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-[16px] text-[var(--ink)] flex items-center gap-2">
          <CalendarIcon className="h-4 w-4" /> Shared Calendar
        </h3>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1 text-[13px] font-medium text-[var(--primary)]"
        >
          <Plus className="h-4 w-4" /> Add Event
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="mb-5 p-4 border border-[var(--primary)] rounded-lg bg-[var(--surface)] flex flex-col gap-3">
          <div>
            <label className="text-[12px] font-medium text-[var(--mute)] mb-1 block">Event Title</label>
            <input 
              autoFocus
              type="text" 
              required
              placeholder="e.g. Family Outing"
              className="w-full bg-white border border-[var(--line)] rounded-md px-3 py-1.5 text-[14px] outline-none focus:border-[var(--primary)]"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[12px] font-medium text-[var(--mute)] mb-1 block">Start Time</label>
              <input 
                type="datetime-local" 
                required
                className="w-full bg-white border border-[var(--line)] rounded-md px-3 py-1.5 text-[14px] outline-none focus:border-[var(--primary)]"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="text-[12px] font-medium text-[var(--mute)] mb-1 block">End Time</label>
              <input 
                type="datetime-local" 
                required
                className="w-full bg-white border border-[var(--line)] rounded-md px-3 py-1.5 text-[14px] outline-none focus:border-[var(--primary)]"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <button 
              type="button" 
              onClick={() => setIsAdding(false)}
              className="text-[13px] text-[var(--mute)] px-3 py-1"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={createMutation.isPending}
              className="btn px-4 py-1.5"
            >
              Save Event
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="py-5 text-center text-[13px] text-[var(--mute)]">Loading events...</div>
      ) : events.length === 0 ? (
        <div className="py-5 text-center">
          <p className="text-[13px] text-[var(--mute)]">No upcoming family events.</p>
        </div>
      ) : (
        <div className="flex flex-col">
          {events.map((event, index) => {
            const isLast = index === events.length - 1;
            const sDate = new Date(event.start_time);
            return (
              <div key={event.id} className="tl flex gap-4">
                <div className="tl-line flex flex-col items-center">
                  <div className="tl-dot h-3 w-3 rounded-full bg-[var(--primary)] mt-1.5" />
                  {!isLast && <div className="h-full w-[2px] bg-[var(--line)] my-1" />}
                </div>
                <div className="tl-content pb-6 flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-[15px] text-[var(--ink)]">
                        {event.title}
                      </h4>
                      <p className="text-[12px] text-[var(--mute)]">
                        {sDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {sDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </p>
                    </div>
                    {event.creator_id === currentUserId && (
                      <button 
                        onClick={() => { if(confirm('Delete event?')) deleteMutation.mutate(event.id) }}
                        className="p-1 text-[var(--mute)] hover:text-red-500 rounded-md"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
