import { AIMessage } from "@/lib/api/types";
import { Bot, User, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConversationThreadProps {
  messages: AIMessage[];
  isLoading?: boolean;
}

export function ConversationThread({ messages, isLoading }: ConversationThreadProps) {
  return (
    <div className="flex flex-col gap-4">
      {messages.map((message, index) => (
        <MessageBubble key={index} message={message} />
      ))}
      {isLoading && (
        <div className="flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
    </div>
  );
}

interface MessageBubbleProps {
  message: AIMessage;
}

const CONFIDENCE_LABEL: Record<AIMessage["confidence"], string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence — verify further",
  unknown: "Confidence unknown",
};

function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const isRefused = message.safety_outcome === "refused";
  const isFlagged = message.safety_outcome === "flagged";
  const confidence = message.confidence ?? "unknown";

  return (
    <div
      className={cn(
        "flex gap-3",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Bot className="h-4 w-4 text-primary" />
        </div>
      )}
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-none"
            : "bg-card border rounded-bl-none"
        )}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>

        {(isRefused || isFlagged) && (
          <div className="mt-2 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-3 w-3" />
            <span>
              {isRefused
                ? "This question could not be answered as a religious ruling"
                : "This response was flagged for review"}
            </span>
          </div>
        )}

        {!isUser && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 text-xs text-muted-foreground",
                confidence === "high" && "text-emerald-700 dark:text-emerald-400",
                confidence === "medium" && "text-sky-700 dark:text-sky-400",
                confidence === "low" && "text-amber-700 dark:text-amber-400",
              )}
              title="Educational confidence per Islamic Knowledge Framework"
            >
              {CONFIDENCE_LABEL[confidence]}
            </span>
            {message.source_refs.length > 0 &&
              message.source_refs.map((ref, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                >
                  {ref}
                </span>
              ))}
          </div>
        )}
      </div>
      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
          <User className="h-4 w-4 text-primary-foreground" />
        </div>
      )}
    </div>
  );
}
