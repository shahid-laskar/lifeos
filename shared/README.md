# @mlos/shared

Platform-neutral shared packages for Muslim Life OS.

Used by:
- `frontend/` — React + Vite web app
- `mobile/` — React Native (Android + iOS, planned per ADR-012 Increment 8)

## Packages

| Package | Purpose |
|---------|---------|
| `types` | Canonical API response types (mirrors backend Pydantic models) |
| `auth` | Token storage contract, JWT decoding utilities |
| `offline` | Offline queue interface (web: localStorage, mobile: AsyncStorage) |
| `i18n` | Locale config, RTL detection, supported language list |
| `domain` | Shared business logic safe to run on-device |

## Usage

```typescript
import { PRAYER_NAMES, todayLocalDate } from '@mlos/shared/domain'
import { isRtl } from '@mlos/shared/i18n'
import type { PrayerTimes, UserProfile } from '@mlos/shared/types'
```

## Adding React Native

Per ADR-012 Increment 8: React Native shells should be added only after the
web API contracts, authentication, offline queue, and design tokens are stable.

When adding `mobile/`, install this package as a workspace dependency:

```json
{ "dependencies": { "@mlos/shared": "workspace:*" } }
```
