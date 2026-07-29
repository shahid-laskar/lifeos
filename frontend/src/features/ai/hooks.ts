/**
 * AI feature hooks.
 * ADR-012 Increment 4: AI foundation.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'
import type { Conversation, ConversationMessage, MemoryEntry } from '@/lib/api/types'

export const AI_KEYS = {
  conversations: ['ai-conversations'] as const,
  conversation: (id: string) => ['ai-conversation', id] as const,
  memory: ['ai-memory'] as const,
}

export function useConversations() {
  return useQuery<Conversation[]>({
    queryKey: AI_KEYS.conversations,
    queryFn: () => client.get(ENDPOINTS.AI_CONVERSATIONS).then((r) => r.data),
  })
}

export function useConversation(id: string) {
  return useQuery<Conversation>({
    queryKey: AI_KEYS.conversation(id),
    queryFn: () => client.get(`${ENDPOINTS.AI_CONVERSATIONS}/${id}`).then((r) => r.data),
    enabled: !!id,
  })
}

export function useCreateConversation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () =>
      client.post<{ id: string; created_at: string }>(ENDPOINTS.AI_CONVERSATIONS),
    onSuccess: () => qc.invalidateQueries({ queryKey: AI_KEYS.conversations }),
  })
}

export function useSendMessage(conversationId: string) {
  const qc = useQueryClient()
  return useMutation<ConversationMessage, Error, { content: string; include_memory?: boolean }>({
    mutationFn: (body) =>
      client
        .post<ConversationMessage>(`${ENDPOINTS.AI_CONVERSATIONS}/${conversationId}/messages`, body)
        .then((r) => r.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: AI_KEYS.conversation(conversationId) }),
  })
}

export function useDeleteConversation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => client.delete(`${ENDPOINTS.AI_CONVERSATIONS}/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: AI_KEYS.conversations }),
  })
}

export function useMemory() {
  return useQuery<MemoryEntry[]>({
    queryKey: AI_KEYS.memory,
    queryFn: () => client.get(ENDPOINTS.AI_MEMORY).then((r) => r.data),
  })
}

export function useDeleteMemoryEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => client.delete(`${ENDPOINTS.AI_MEMORY}/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: AI_KEYS.memory }),
  })
}
