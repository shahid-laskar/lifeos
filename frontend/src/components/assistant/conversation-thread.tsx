import { AIMessage } from "@/lib/api/types";
import { AlertTriangle, BookOpen, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface ConversationThreadProps {
  messages: AIMessage[];
  isLoading?: boolean;
}

export function ConversationThread({ messages, isLoading }: ConversationThreadProps) {
  return (
    <div className="flex flex-col gap-6 py-2">
      {/* Study companion header banner */}
      <div className="rounded-[12px] border border-[var(--line)] bg-[var(--primary-soft)] p-3 text-[12px] text-[var(--primary)] flex items-center gap-2">
        <BookOpen className="h-4 w-4 shrink-0" />
        <span>
          <strong>Study Companion:</strong> Designed for reflection, study guidance, and general learning. Not for fiqh rulings or fatwas.
        </span>
      </div>

      {messages.map((message, index) => (
        <MessageTurn key={index} message={message} />
      ))}

      {isLoading && (
        <div className="flex items-center gap-2 py-4 text-[13px] text-[var(--mute)]">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
          <span>Reflecting...</span>
        </div>
      )}
    </div>
  );
}

const CONFIDENCE_LABEL: Record<AIMessage["confidence"], string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence — verify further",
  unknown: "Educational note",
};

function MessageTurn({ message }: { message: AIMessage }) {
  const isUser = message.role === "user";
  const isRefused = message.safety_outcome === "refused";
  const isFlagged = message.safety_outcome === "flagged";
  const confidence = message.confidence ?? "unknown";
  const [showSources, setShowSources] = useState(false);

  if (isUser) {
    return (
      <div className="flex justify-end my-2">
        <div className="max-w-[85%] rounded-[14px] bg-[var(--primary-soft)] px-4 py-3 text-[13px] font-medium text-[var(--primary)]">
          <p className="whitespace-pre-wrap leading-[1.6]">{message.content}</p>
        </div>
      </div>
    );
  }

  // Assistant turn: Sit directly on surface without chat bubbles like a book page (Mockup Spec 0H)
  return (
    <div className="my-2 border-b border-[var(--line)] pb-6 last:border-0">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">
          <Sparkles className="h-3.5 w-3.5" />
        </div>
        <span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--mute)]">
          Assistant
        </span>
        <span className="ml-auto text-[11px] text-[var(--mute)]">
          {CONFIDENCE_LABEL[confidence]}
        </span>
      </div>

      <div className="pl-8">
        {/* Book page typography in Lora serif for long-form reading */}
        <p
          className="text-[15px] leading-[1.7] text-[var(--ink)] whitespace-pre-wrap"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          {message.content}
        </p>

        {(isRefused || isFlagged) && (
          <div className="mt-3 flex items-center gap-2 text-[12px] text-[var(--brass)] bg-[var(--primary-soft)] p-2.5 rounded-[8px]">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span>
              {isRefused
                ? "This query addresses a fiqh ruling and cannot be answered as a fatwa. Please consult a qualified scholar."
                : "This response was flagged for educational review."}
            </span>
          </div>
        )}

        {/* Collapsible sources pill per mockup spec */}
        {message.source_refs.length > 0 && (
          <div className="mt-3">
            <button
              onClick={() => setShowSources(!showSources)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1 text-[11px] font-semibold text-[var(--primary)] hover:bg-[var(--primary-soft)] transition-colors"
            >
              <BookOpen className="h-3 w-3" />
              <span>{message.source_refs.length} source{message.source_refs.length > 1 ? "s" : ""}</span>
            </button>

            {showSources && (
              <div className="mt-2 flex flex-col gap-1.5 pl-2">
                {message.source_refs.map((ref, idx) => (
                  <div
                    key={idx}
                    className="text-[12px] text-[var(--mute)] border-l-2 border-[var(--primary)] pl-2.5 py-0.5"
                  >
                    {ref}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
