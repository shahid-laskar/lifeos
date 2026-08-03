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

  const starterPrompts = [
    { title: "Daily Coach", prompt: "Can you review my recent prayers and habits and give me some gentle advice for today?" },
    { title: "Planning Assistant", prompt: "Help me plan my day around my prayer times and top priorities." },
    { title: "Reflection Assistant", prompt: "I'd like to reflect on my day. Can you give me an Islamic reflection prompt?" },
    { title: "Learning Coach", prompt: "I want to learn more about the Prophet's (PBUH) character. Can you guide me?" },
  ];

  return (
    <>
      <PageHeader title="Assistant" arabic="المساعد" subtitle="Your calm, supportive companion" />
      <div className="flex h-[calc(100vh-140px)] gap-4 overflow-hidden relative">
        {/* Mobile overlay */}
        {showSidebar && (
          <div 
            className="fixed inset-0 bg-black/20 z-40 lg:hidden"
            onClick={() => setShowSidebar(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`
          fixed lg:static inset-y-0 left-0 z-50 w-[260px] transform transition-transform duration-300 ease-in-out
          ${showSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          bg-[var(--bg)] border-r border-[var(--line)] lg:border lg:rounded-lg
          flex flex-col h-[calc(100vh-80px)] lg:h-full shadow-lg lg:shadow-none
        `}>
          <div className="p-4 border-b border-[var(--line)] flex justify-between items-center bg-[var(--surface)] shrink-0">
            <h3 className="font-semibold text-[14px]">Conversations</h3>
            <button 
              onClick={() => setShowSidebar(false)}
              className="lg:hidden p-1 hover:bg-[var(--bg)] rounded"
            >
              <X className="h-4 w-4 text-[var(--mute)]" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">
            <ConversationList
              conversations={conversations || []}
              currentConversationId={currentConversationId}
              onSelectConversation={(id) => {
                setCurrentConversationId(id);
                setShowSidebar(false);
              }}
              onNewConversation={() => createMutation.mutate()}
              onDeleteConversation={(id) => deleteMutation.mutate(id)}
              isLoading={isLoadingConversations}
            />
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-[var(--surface)] border border-[var(--line)] rounded-lg relative h-full">
          {/* Mobile Header */}
          <div className="lg:hidden p-3 border-b border-[var(--line)] flex items-center shrink-0">
            <button 
              onClick={() => setShowSidebar(true)}
              className="p-2 hover:bg-[var(--bg)] rounded-md mr-2"
            >
              <Menu className="h-5 w-5 text-[var(--ink)]" />
            </button>
            <h2 className="font-medium text-[15px] truncate">
              {currentConversation?.title || "New Chat"}
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 p-4">
            {!currentConversationId ? (
              <div className="h-full flex flex-col items-center justify-center text-[var(--mute)]">
                <MessageCircle className="h-12 w-12 mb-4 opacity-20" />
                <p>Select or start a conversation</p>
                
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full">
                  {starterPrompts.map((p, i) => (
                    <button 
                      key={i}
                      onClick={() => {
                        createMutation.mutate(undefined, {
                          onSuccess: (data) => {
                            sendMessageMutation.mutate({ convId: data.id, content: p.prompt });
                          }
                        });
                      }}
                      className="text-left p-4 rounded-xl border border-[var(--line)] bg-[var(--surface)] hover:border-[var(--primary-soft)] transition-colors"
                    >
                      <h4 className="font-medium text-[13px] text-[var(--ink)] mb-1">{p.title}</h4>
                      <p className="text-[12px] text-[var(--mute)] line-clamp-2">{p.prompt}</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <ConversationThread
                  messages={currentConversation?.messages || []}
                  isLoading={sendMessageMutation.isPending}
                />
                
                {currentConversation?.messages.length === 0 && (
                  <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto w-full">
                    {starterPrompts.map((p, i) => (
                      <button 
                        key={i}
                        onClick={() => handleSendMessage(p.prompt)}
                        className="text-left p-4 rounded-xl border border-[var(--line)] bg-[var(--surface)] hover:border-[var(--primary-soft)] transition-colors"
                      >
                        <h4 className="font-medium text-[13px] text-[var(--ink)] mb-1">{p.title}</h4>
                        <p className="text-[12px] text-[var(--mute)] line-clamp-2">{p.prompt}</p>
                      </button>
                    ))}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
          <MessageInput
            onSend={handleSendMessage}
            disabled={!currentConversationId}
            isLoading={sendMessageMutation.isPending}
          />
        </div>
      </div>
    </>
  );
}
