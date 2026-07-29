/**
 * Shared API types — platform neutral.
 *
 * These are the canonical types for all Muslim Life OS API contracts.
 * Both web (React + Vite) and mobile (React Native) import from here.
 * The backend Pydantic models are the authoritative source; this file
 * must stay in sync with app/domain/{domain}/models.py.
 */

export * from './api'
export * from './domain'
