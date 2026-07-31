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

function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const isRedirected = message.safety_outcome === "redirected";
  const isRefused = message.safety_outcome === "refused";

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
        <p className="text-sm leading-relaxed">{message.content}</p>
        
        {(isRedirected || isRefused) && (
          <div className="mt-2 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-3 w-3" />
            <span>
              {isRedirected
                ? "This question was redirected to general guidance"
                : "This question could not be answered"}
            </span>
          </div>
        )}
        
        {message.source_refs.length > 0 && !isUser && (
          <div className="mt-2 flex flex-wrap gap-1">
            {message.source_refs.map((ref, idx) => (
              <span
                key={idx}
                className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
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
