import { afterEach, describe, expect, it, vi } from 'vitest'

import client from '@/lib/api/client'

import { queuedOperationCount, requestWithOfflineQueue } from './queue'

describe('offline operation queue', () => {
  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('stores idempotent mutations while offline', async () => {
    vi.stubGlobal('crypto', { randomUUID: () => 'operation-1' })
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false })

    const result = await requestWithOfflineQueue({
      method: 'put',
      url: '/api/v1/quran/reading-progress',
      data: { surah_number: 1, last_ayah_number: 3 },
    })

    expect(result).toEqual({ queued: true })
    expect(queuedOperationCount()).toBe(1)
    expect(JSON.parse(localStorage.getItem('mlos-offline-operations') ?? '[]')[0]).toMatchObject({
      id: 'operation-1',
      method: 'put',
      url: '/api/v1/quran/reading-progress',
    })
  })

  it('returns the server response while online', async () => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true })
    vi.spyOn(client, 'request').mockResolvedValue({ data: { ok: true } } as never)

    await expect(requestWithOfflineQueue({ method: 'get', url: '/health' })).resolves.toEqual({
      queued: false,
      data: { ok: true },
    })
    expect(queuedOperationCount()).toBe(0)
  })
})
