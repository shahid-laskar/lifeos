/**
 * Family feature hooks.
 * ADR-012 Increment 5: Family capability foundations.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'
import type { Family, FamilyInvitation } from '@/lib/api/types'

export const FAMILY_KEYS = {
  families: ['families'] as const,
}

export function useFamilies() {
  return useQuery<Family[]>({
    queryKey: FAMILY_KEYS.families,
    queryFn: () => client.get(ENDPOINTS.FAMILIES).then((r) => r.data),
  })
}

export function useCreateFamily() {
  const qc = useQueryClient()
  return useMutation<Family, Error, { name: string }>({
    mutationFn: (body) => client.post<Family>(ENDPOINTS.FAMILIES, body).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: FAMILY_KEYS.families }),
  })
}

export function useInviteMember() {
  return useMutation<FamilyInvitation, Error, { familyId: string; email: string }>({
    mutationFn: ({ familyId, email }) =>
      client
        .post<FamilyInvitation>(`${ENDPOINTS.FAMILIES}/${familyId}/invitations`, { email })
        .then((r) => r.data),
  })
}

export function useRemoveMember() {
  const qc = useQueryClient()
  return useMutation<void, Error, { familyId: string; memberId: string }>({
    mutationFn: ({ familyId, memberId }) =>
      client.delete(`${ENDPOINTS.FAMILIES}/${familyId}/members/${memberId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: FAMILY_KEYS.families }),
  })
}
