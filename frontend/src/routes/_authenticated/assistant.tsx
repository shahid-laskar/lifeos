import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { ConversationThread } from "@/components/assistant/conversation-thread";
import { MessageInput } from "@/components/assistant/message-input";
import { ConversationList } from "@/components/assistant/conversation-list";
import {
  listConversations,
  createConversation,
  sendAiMessage,
  deleteConversation,
  type ConversationResponse,
} from "@/lib/api/endpoints";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { Menu, X } from "lucide-react";

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
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: conversations, isLoading: isLoadingConversations } = useQuery({
    queryKey: ["conversations"],
    queryFn: listConversations,
  });

  const currentConversation = conversations?.find((c) => c.id === currentConversationId);

  const createMutation = useMutation({
    mutationFn: createConversation,
    onSuccess: (data) => {
      setCurrentConversationId(data.id);
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      setShowSidebar(false);
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: ({ convId, content }: { convId: string; content: string }) =>
      sendAiMessage(convId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: () => {
      toast({
        title: "Failed to send message",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteConversation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      if (currentConversationId) {
        setCurrentConversationId(null);
      }
      toast({
        title: "Conversation deleted",
        description: "The conversation has been removed.",
      });
    },
  });

  useEffect(() => {
    if (conversations && conversations.length > 0 && !currentConversationId) {
      setCurrentConversationId(conversations[0].id);
    }
  }, [conversations, currentConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentConversation?.messages]);

  const handleSendMessage = (content: string) => {
    if (currentConversationId) {
      sendMessageMutation.mutate({ convId: currentConversationId, content });
    }
  };

  const handleNewConversation = () => {
    createMutation.mutate();
  };

  const handleDeleteConversation = (id: string) => {
    deleteMutation.mutate(id);
  };

  const currentMessages = currentConversation?.messages || [];

  return (
    <>
      <PageHeader title="Assistant" arabic="مُساعِد" subtitle="Ask, slowly">
        <button
          onClick={() => setShowSidebar(!showSidebar)}
          className="ml-auto text-[var(--mute)] hover:text-[var(--ink)] transition-colors"
        >
          {showSidebar ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </PageHeader>

      <div className="flex h-[calc(100vh-160px)]">
        {/* Sidebar */}
        {showSidebar && (
          <div className="w-80 border-r border-[var(--line)] bg-[var(--surface)]">
            <ConversationList
              conversations={conversations || []}
              currentConversationId={currentConversationId}
              onSelectConversation={setCurrentConversationId}
              onNewConversation={handleNewConversation}
              onDeleteConversation={handleDeleteConversation}
              isLoading={isLoadingConversations}
            />
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 flex flex-col">
          {currentConversation ? (
            <>
              <div className="flex-1 overflow-y-auto px-4 py-4">
                <ConversationThread
                  messages={currentMessages}
                  isLoading={sendMessageMutation.isPending}
                />
                <div ref={messagesEndRef} />
              </div>
              <MessageInput
                onSend={handleSendMessage}
                disabled={!currentConversationId}
                isLoading={sendMessageMutation.isPending}
              />
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-center">
                <p className="text-[15px] font-semibold text-[var(--ink)]">No conversation selected</p>
                <p className="mt-2 text-[13px] text-[var(--mute)]">
                  Start a new conversation or select one from the sidebar
                </p>
                <button
                  onClick={handleNewConversation}
                  className="mt-4 rounded-full bg-[var(--primary)] px-6 py-2.5 text-[14px] font-medium text-white transition-opacity hover:opacity-90"
                  disabled={createMutation.isPending}
                >
                  New Conversation
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
