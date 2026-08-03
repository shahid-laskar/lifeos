import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Calendar as CalendarIcon, Clock, Plus } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { LoadingBlock } from "@/components/brand/pattern";
import { ErrorState } from "@/components/brand/states";
import { getEvents, createEvent } from "@/lib/api/endpoints";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/calendar")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Calendar — Muslim Life OS" }],
  }),
  component: CalendarPage,
});

function getIslamicDateString(date: Date) {
  return new Intl.DateTimeFormat("en-US-u-ca-islamic", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function getGregorianDateString(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function CalendarPage() {
  const queryClient = useQueryClient();
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const eventsQuery = useQuery({
    queryKey: ["events"],
    queryFn: () => getEvents(), // fetch all for now
  });

  const createEventMutation = useMutation({
    mutationFn: (data: any) => createEvent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setIsAddingEvent(false);
      setTitle("");
      setStartTime("");
      setEndTime("");
    },
  });

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startTime || !endTime) return;
    createEventMutation.mutate({
      title,
      start_time: new Date(startTime).toISOString(),
      end_time: new Date(endTime).toISOString(),
    });
  };

  const events = eventsQuery.data ?? [];
  const today = new Date();

  return (
    <>
      <PageHeader title="Calendar" subtitle="Plan your time, remember your priorities" arabic="تَقْوِيم" />

      <div className="flex flex-col gap-6 mt-6">
        <div className="card flex flex-col items-center justify-center p-6 text-center">
          <CalendarIcon className="h-8 w-8 text-[var(--primary)] mb-2 opacity-80" />
          <h2 className="text-[20px] font-bold text-[var(--primary)]">
            {getIslamicDateString(today)}
          </h2>
          <p className="text-[14px] text-[var(--mute)] mt-1">
            {getGregorianDateString(today)}
          </p>
        </div>

        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-[16px]">Upcoming Events</h3>
          <button 
            onClick={() => setIsAddingEvent(!isAddingEvent)}
            className="flex items-center gap-1 text-[13px] font-medium text-[var(--primary)]"
          >
            <Plus className="h-4 w-4" /> Add Event
          </button>
        </div>

        {isAddingEvent && (
          <form onSubmit={handleCreateEvent} className="card p-4 flex flex-col gap-3 border-[var(--primary)] border">
            <div>
              <label className="text-[12px] font-medium text-[var(--mute)] mb-1 block">Event Title</label>
              <input 
                autoFocus
                type="text" 
                required
                className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-md px-3 py-1.5 text-[14px] outline-none focus:border-[var(--primary)]"
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
                  className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-md px-3 py-1.5 text-[14px] outline-none focus:border-[var(--primary)]"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <label className="text-[12px] font-medium text-[var(--mute)] mb-1 block">End Time</label>
                <input 
                  type="datetime-local" 
                  required
                  className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-md px-3 py-1.5 text-[14px] outline-none focus:border-[var(--primary)]"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-2">
              <button 
                type="button" 
                onClick={() => setIsAddingEvent(false)}
                className="text-[13px] text-[var(--mute)] px-3 py-1"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={createEventMutation.isPending}
                className="btn px-4 py-1.5"
              >
                Save
              </button>
            </div>
          </form>
        )}

        {eventsQuery.isPending ? (
          <LoadingBlock label="Loading calendar" />
        ) : eventsQuery.isError ? (
          <ErrorState 
            title="Couldn't load calendar" 
            message="Please try again." 
            onRetry={() => eventsQuery.refetch()} 
          />
        ) : events.length === 0 ? (
          <div className="empty py-10 text-center">
            <h3 className="font-semibold text-[var(--ink)]">No events scheduled</h3>
            <p className="mt-1 text-[13px] text-[var(--mute)]">Your calendar is clear.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {events.map((event) => {
              const startDate = new Date(event.start_time);
              const endDate = new Date(event.end_time);
              return (
                <div key={event.id} className="card p-4 flex flex-col gap-1">
                  <h4 className="font-medium text-[15px]">{event.title}</h4>
                  <div className="flex items-center gap-2 text-[13px] text-[var(--mute)] mt-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>
                      {startDate.toLocaleDateString()} {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {" - "}
                      {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
