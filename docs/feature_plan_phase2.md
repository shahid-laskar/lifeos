# Muslim Life OS — Phase 2 Implementation Plan (Revised)

## Goal

Phase 1 foundation (ADR-013) is complete — 109 backend tests passing, all infrastructure
increments done. This plan fills the remaining product gaps in strict priority order, informed
by the full design policy corpus (`/opt/lifeos/docs` Volumes 01–04) and architecture constraints
(`/opt/lifeos/docs` Volumes 03, 06, 07).

---

## Design Policy Synthesis (from Volumes 01 & 04)

Every screen built in this plan must satisfy the following non-negotiable rules derived from
the design docs — these are as authoritative as the Constitution:

| Category | Rule |
|---|---|
| **Grid & Spacing** | Strict 8-pt grid tokens: `8, 16, 24, 32, 40, 48, 56, 64 dp`. Zero hardcoded px values. |
| **Touch Targets** | Minimum **48×48 dp** with at least **8 dp** spacing between adjacent controls. |
| **Color & Themes** | Token-based (`Core → Semantic → Component`). Light / Dark / High Contrast via token swap, **never** component duplication. Runtime switching — no page reload. Contrast min 4.5:1 (normal text), 3:1 (large text). |
| **Typography** | Resizable to 200% zoom. No fixed `px` font sizes — use `rem`/`em`. |
| **Performance** | Touch feedback **< 50 ms** visual response. Navigation **< 200 ms**. |
| **Motion** | Simple transitions 100–150 ms, screen transitions 150–250 ms. Honor `prefers-reduced-motion`. |
| **Undo vs Confirm** | Default to **Undo toast (~10 s)** for reversible actions. Confirmation dialogs **only** for irreversible ops (data deletion, family structural changes, privacy/security changes). |
| **Forms** | Live validation as user types. Specific button labels ("Save Settings" not "Submit"). Max 1 primary button per screen. |
| **Navigation depth** | Max 3 levels of feature nesting. Bottom nav max 5 items. |
| **Family privacy** | Default scope is **Personal**. **NEVER** track worship across family members. **NO** family leaderboards, scoring, or sibling comparisons. **NO** auto-access to private journals/AI chats. |
| **Accessibility** | WCAG 2.2 AA. Accessibility bugs are **release blockers** for critical workflows. |
| **AI UX** | AI elements visually distinct from user content. Show confidence + source. Suggestions never presented as decisions. |

---

## User Review Required

> [!IMPORTANT]
> **Bottom nav restructure**: `018_Navigation_System.md` specifies the 8 global destinations as:
> Home, Planner, Faith, Knowledge, **Family**, Search, **AI**, Profile.
> The current bottom nav has 6 tabs (Home, Qur'an, Dhikr, Assistant, Family, Settings).
> This plan proposes reducing to **5 tabs** (per mobile spec): **Home, Qur'an, Dhikr, Assistant, Profile**.
> Settings moves inside Profile. Family moves inside Profile or gets its own tab replacing one of the others.
> Confirm preferred nav structure before I implement.

> [!WARNING]
> **PostgreSQL**: This plan migrates from SQLite to PostgreSQL as Increment 0.
> The existing `muslim_life_os.db` SQLite file contains one real user (`slaskar39@gmail.com`).
> That data will need to be migrated or re-created after switching. Shall I include a data
> migration script, or is re-registration acceptable?

> [!IMPORTANT]
> **AI provider**: The AI backend uses an in-memory stub. The chat UI will work with stub
> responses. To enable a real LLM, set `MLOS_AI_PROVIDER=openai` + `MLOS_OPENAI_API_KEY` in `.env`.
> I'll build the frontend to support both — no UI changes needed when the real provider is enabled.

---

## Open Questions

> [!IMPORTANT]
> 1. **Family invites (no email)**: With `ConsoleEmailService`, invite tokens appear in backend logs. Should the UI show the raw token for copy-paste sharing? Or is a shareable link (e.g. `http://10.44.0.209:8080/invite?token=XXX`) better?
> 2. **Fasting tracker (Increment D)**: Include in this batch or defer?
> 3. **SQLite data migration**: Re-register, or migrate the one existing user to Postgres?

---

## Proposed Changes

---

## Increment 0 — PostgreSQL + Alembic + SQLAlchemy repos for Family & AI

**This must land first** — every subsequent increment depends on a durable, production-grade DB.

### Why now
- ADR-013 explicitly mandates replacing `InMemoryFamilyRepository`, `InMemoryConversationRepository`, and `InMemoryMemoryRepository` before production.
- Alembic migrations are flagged as follow-up work in ADR-004 — Increment A adds family tables, making this the last safe moment to init migrations.
- Server is already running (`10.44.0.209`) — SQLite write-locking under concurrent requests is a real risk.

---

### Backend: Dependencies

#### [MODIFY] `backend/requirements.txt`
```diff
+psycopg2-binary==2.9.9
+alembic==1.13.2
```

---

### Backend: Docker Compose

#### [MODIFY] `docker-compose.yml`
```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: mlos
      POSTGRES_USER: mlos
      POSTGRES_PASSWORD: ${MLOS_DB_PASSWORD:?Set MLOS_DB_PASSWORD}
    volumes:
      - pg-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U mlos"]
      interval: 5s
      timeout: 3s
      retries: 10

  backend:
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      MLOS_DATABASE_URL: postgresql://mlos:${MLOS_DB_PASSWORD}@postgres:5432/mlos
      ...

volumes:
  pg-data:
  backend-data:  # keep for any file assets
```

#### [MODIFY] `mlos/.env` (development)
```
MLOS_DATABASE_URL=postgresql://mlos:mlos_dev@localhost:5432/mlos
MLOS_DB_PASSWORD=mlos_dev
```

---

### Backend: Alembic

#### [NEW] `backend/alembic.ini` + `backend/alembic/env.py`

```python
# env.py — key config
from app.core.db import Base
from app.infrastructure import orm_models  # registers all ORM models

target_metadata = Base.metadata
```

Commands to run after setup:
```bash
alembic init alembic
alembic revision --autogenerate -m "initial_schema"
alembic upgrade head
```

#### [MODIFY] `backend/app/main.py`
Remove the `Base.metadata.create_all(bind=engine)` dev shortcut — Alembic owns schema now:
```diff
-    # Dev-only table creation.
-    Base.metadata.create_all(bind=engine)
+    # Schema managed by Alembic migrations — run `alembic upgrade head` before starting.
     yield
```

---

### Backend: Family SQLAlchemy ORM + Repository

#### [MODIFY] `backend/app/infrastructure/orm_models.py`
Add family tables:
```python
class FamilyORM(Base):
    __tablename__ = "families"
    id = Column(String(36), primary_key=True)
    name = Column(String(255), nullable=False)
    owner_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=False)

class FamilyMemberORM(Base):
    __tablename__ = "family_members"
    family_id = Column(String(36), ForeignKey("families.id"), primary_key=True)
    user_id = Column(String(36), ForeignKey("users.id"), primary_key=True)
    role = Column(String(16), nullable=False)  # owner | adult | dependent

class FamilyInvitationORM(Base):
    __tablename__ = "family_invitations"
    id = Column(String(36), primary_key=True)
    family_id = Column(String(36), ForeignKey("families.id"), nullable=False, index=True)
    invited_email = Column(String(320), nullable=False, index=True)
    invited_by_user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    role = Column(String(16), nullable=False)
    hashed_token = Column(String(255), unique=True, nullable=False)
    status = Column(String(16), nullable=False, default="pending")
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False)
```

#### [NEW] `backend/app/infrastructure/family_repository_sqlalchemy.py`
Implements `FamilyRepository` Protocol using SQLAlchemy Session — replaces `InMemoryFamilyRepository`.

---

### Backend: AI SQLAlchemy ORM + Repository

#### [MODIFY] `backend/app/infrastructure/orm_models.py`
Add AI conversation tables:
```python
class AIConversationORM(Base):
    __tablename__ = "ai_conversations"
    id = Column(String(36), primary_key=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=False)

class AIMessageORM(Base):
    __tablename__ = "ai_messages"
    id = Column(String(36), primary_key=True)
    conversation_id = Column(String(36), ForeignKey("ai_conversations.id"), nullable=False, index=True)
    role = Column(String(16), nullable=False)          # user | assistant | system
    content = Column(Text, nullable=False)
    safety_outcome = Column(String(16), nullable=False, default="allowed")
    source_refs = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), nullable=False)

class AIMemoryORM(Base):
    __tablename__ = "ai_memories"
    id = Column(String(36), primary_key=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False)
```

#### [NEW] `backend/app/infrastructure/ai_repository_sqlalchemy.py`
Replaces `InMemoryConversationRepository` and `InMemoryMemoryRepository`.

---

### Backend: Missing Family API routes

Based on the gap analysis, add to `backend/app/api/v1/families.py`:
```python
GET  /api/v1/families/{family_id}         # single family detail
DELETE /api/v1/families/{family_id}       # owner-only family deletion (confirmation required)
GET  /api/v1/families/{family_id}/invitations  # list pending invitations
DELETE /api/v1/families/{family_id}/invitations/{inv_id}  # revoke invitation
```

`GET /families` already returns the user's families — frontend will use this (no `/mine` route needed, just take `[0]`).

---

### Backend: Wire new repos into deps.py

#### [MODIFY] `backend/app/api/deps.py`
Replace in-memory instantiation with SQLAlchemy-backed repos, injected via `get_db()`.

---

### Verification (Increment 0)
```bash
# Postgres running
docker compose up postgres -d

# Run migrations
cd backend && alembic upgrade head

# All 109 tests still pass (using TEST_DATABASE_URL=sqlite for unit tests)
python -m pytest tests/ -v
```

---

## Increment A — Settings page (Profile + Location + Prayer Prefs + Theme)

**Highest user impact** — location/prayer method are required for meaningful prayer times.

---

### Frontend: New API endpoints

#### [MODIFY] `frontend/src/lib/api/endpoints.ts`
```ts
// Already exists: getProfile(), updateProfile()
// Add geocoding helper (calls Nominatim — privacy-safe, no key required)
export async function geocodeCity(query: string): Promise<GeoResult[]> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  return res.json();
}
```

#### [MODIFY] `frontend/src/lib/api/types.ts`
```ts
export type UserProfile = {
  id: string;
  email: string;
  preferred_language: string;
  country: string | null;
  timezone: string | null;
  latitude: number | null;
  longitude: number | null;
  prayer_calculation_method: string | null;
  asr_method: string | null;
  goals: string[];
  created_at: string;
};
```

---

### Frontend: Theme system

#### [NEW] `frontend/src/lib/theme.ts`
```ts
export type Theme = 'light' | 'dark' | 'system';

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const isDark = theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  root.classList.toggle('dark', isDark);
  localStorage.setItem('mlos-theme', theme);
}

export function getStoredTheme(): Theme {
  return (localStorage.getItem('mlos-theme') as Theme) ?? 'system';
}
```

Wire into `__root.tsx` to apply on load (no flash).

---

### Frontend: Settings components

#### [MODIFY] `frontend/src/routes/_authenticated/settings.tsx`
Full settings page with 4 collapsible sections. Follows `030_Settings_and_Privacy_UX.md`:

```
Settings
├── Profile          (display name, language)
├── Location         (city search → lat/lng, timezone auto-detect)
├── Prayer           (calculation method dropdown, Asr method)
├── Appearance       (Light / Dark / System — live preview, no reload)
└── Account          (sign out, link to /governance/my-data)
```

#### [NEW] `frontend/src/components/settings/location-section.tsx`
- City search input → debounced Nominatim call (300 ms)
- Results list (max 5) — tap to select → sets `latitude`, `longitude`, `country`, `timezone`
- Manual override available
- Save with optimistic update + undo toast (10 s)

#### [NEW] `frontend/src/components/settings/prayer-prefs-section.tsx`
- `<select>` for `prayer_calculation_method`: MWL / ISNA / Egypt / Makkah / Karachi / Tehran
- `<select>` for `asr_method`: Standard (Shafi/Maliki/Hanbali) / Hanafi
- Auto-saves on change with toast confirmation (not a form submit — matches 019 live-save pattern)
- Each option has a brief explanation (Evidence over Opinion, Article 5)

#### [NEW] `frontend/src/components/settings/appearance-section.tsx`
- 3-option tile group: Light / Dark / System (with icons)
- **Live preview** — theme applies immediately (no save button needed — reversible, no confirmation)
- Persisted to `localStorage` per `082_Design_System_Implementation.md`

#### [NEW] `frontend/src/components/settings/account-section.tsx`
- Sign out button (Undo not needed — user-initiated, easily reversible by logging in again)
- Link to data export: `GET /api/v1/governance/my-data`

---

## Increment B — AI Assistant (Chat UI)

Backend has full conversation CRUD. Need to wire the frontend.

---

### Frontend: New API types + endpoints

#### [MODIFY] `frontend/src/lib/api/types.ts`
```ts
export type AIMessage = {
  role: 'user' | 'assistant';
  content: string;
  safety_outcome: 'allowed' | 'refused' | 'redirected';
  source_refs: string[];
  created_at: string;
};
export type AIConversation = {
  id: string;
  title: string | null;
  messages: AIMessage[];
  created_at: string;
  updated_at: string;
};
```

#### [MODIFY] `frontend/src/lib/api/endpoints.ts`
```ts
export function createConversation() {
  return apiFetch<{ id: string; created_at: string }>('/api/v1/ai/conversations', { method: 'POST' });
}
export function sendAiMessage(convId: string, content: string) {
  return apiFetch<AIMessage>(`/api/v1/ai/conversations/${convId}/messages`, {
    method: 'POST', body: { content, include_memory: false }
  });
}
export function getConversation(convId: string) {
  return apiFetch<AIConversation>(`/api/v1/ai/conversations/${convId}`);
}
export function listConversations() {
  return apiFetch<AIConversation[]>('/api/v1/ai/conversations');
}
export function deleteConversation(convId: string) {
  return apiFetch<null>(`/api/v1/ai/conversations/${convId}`, { method: 'DELETE' });
}
```

---

### Frontend: Assistant components

#### [MODIFY] `frontend/src/routes/_authenticated/assistant.tsx`
```
Assistant
├── ConversationList   (sidebar/sheet on mobile)
├── ConversationThread (message bubbles + safety badges)
│   ├── UserBubble     (right-aligned, bg-primary)
│   └── AssistantBubble (left-aligned, bg-card, with source refs)
└── MessageInput       (textarea + send, disabled while awaiting)
```

#### [NEW] `frontend/src/components/assistant/conversation-thread.tsx`
- User messages: right-aligned, `bg-primary text-primary-foreground`, rounded-br-none
- Assistant messages: left-aligned, `bg-card border`, rounded-bl-none
- Safety badge: amber pill shown when `safety_outcome !== 'allowed'` — e.g. "This question was redirected to general guidance"
- Source refs: small linked chips below assistant messages (Evidence over Opinion, Article 5)
- Scroll-to-bottom on new message
- Loading: `StarSpinner` while awaiting response (< 50 ms visual feedback)

#### [NEW] `frontend/src/components/assistant/message-input.tsx`
- `<textarea>` with auto-resize (max 5 rows)
- Character counter (500 char limit)
- Send on `Enter` (Shift+Enter = newline) — matches 48dp touch target for send button
- Disabled + spinner while request in flight

#### [NEW] `frontend/src/components/assistant/conversation-list.tsx`
- List of past conversations (title or "Conversation from {date}")
- Swipe-to-delete (with 10 s Undo toast — reversible, no confirmation needed)
- "New conversation" button at top

**AI UX compliance notes:**
- AI assistant visually distinct from user content (different bubble color + small robot icon)
- No conversation auto-starts — user must tap "New Conversation"
- Safety refusals shown respectfully, never as errors

---

## Increment C — Family Management UI + DB Persistence

DB persistence is done in Increment 0. This wires the frontend.

---

### Frontend: New API types + endpoints

#### [MODIFY] `frontend/src/lib/api/types.ts`
```ts
export type FamilyMember = {
  user_id: string;
  role: 'owner' | 'adult' | 'dependent';
  email?: string;
};
export type FamilyInvitation = {
  id: string;
  invited_email: string;
  role: string;
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  expires_at: string;
};
export type Family = {
  id: string;
  name: string;
  owner_id: string;
  members: FamilyMember[];
  created_at: string;
};
```

#### [MODIFY] `frontend/src/lib/api/endpoints.ts`
```ts
export function listMyFamilies() {
  return apiFetch<Family[]>('/api/v1/families');
}
export function createFamily(name: string) {
  return apiFetch<Family>('/api/v1/families', { method: 'POST', body: { name } });
}
export function getFamily(familyId: string) {
  return apiFetch<Family>(`/api/v1/families/${familyId}`);
}
export function inviteMember(familyId: string, email: string, role: string) {
  return apiFetch<FamilyInvitation>(`/api/v1/families/${familyId}/invitations`, {
    method: 'POST', body: { invited_email: email, role }
  });
}
export function listInvitations(familyId: string) {
  return apiFetch<FamilyInvitation[]>(`/api/v1/families/${familyId}/invitations`);
}
export function acceptInvitation(invitationId: string) {
  return apiFetch<unknown>(`/api/v1/families/invitations/${invitationId}/accept`, { method: 'POST' });
}
export function removeMember(familyId: string, memberId: string) {
  return apiFetch<null>(`/api/v1/families/${familyId}/members/${memberId}`, { method: 'DELETE' });
}
export function deleteFamily(familyId: string) {
  return apiFetch<null>(`/api/v1/families/${familyId}`, { method: 'DELETE' });
}
```

---

### Frontend: Family components

#### [MODIFY] `frontend/src/routes/_authenticated/families.tsx`
```
Family
├── (No family)  → CreateFamilyPrompt
└── (Has family) → FamilyDashboard
    ├── MemberList    (role badges, remove button — owner only)
    ├── InviteSection (email input + role select → generates token or invite link)
    ├── PendingInvites (list with revoke option)
    └── DangerZone    (Leave / Disband — destructive, confirmation required per 019)
```

#### [NEW] `frontend/src/components/family/create-family-prompt.tsx`
- Single input: family name
- Call to action: "Start your family circle"
- No pre-selected invasive defaults per `030_Settings_and_Privacy_UX.md`

#### [NEW] `frontend/src/components/family/family-dashboard.tsx`
- Member cards with role chip (Owner / Adult / Dependent)
- Owner sees "Remove" button on non-owner members (confirmation required — structural change)
- Non-owners see "Leave" button (confirmation required)

#### [NEW] `frontend/src/components/family/invite-section.tsx`
- Email input + role dropdown
- On success: shows invite token/link with copy button (dev mode — no email)
- Pending invites listed with expiry countdown and Revoke button

**Family privacy compliance:**
- NEVER show prayer logs, Qur'an progress, or Dhikr counts for family members (Article 6)
- No "who prayed today" shared view — this is the most critical anti-pattern to avoid
- All data shown is only what the member voluntarily shares

---

## Increment D — Fasting Tracker (Optional)

### Backend additions

#### [NEW] `backend/app/api/v1/habits.py` additions
```python
POST /api/v1/habits/fasting/log
  body: { date: str, type: "voluntary" | "obligatory" | "broken" | "excused" }
  → idempotent (same pattern as prayer logging)

GET /api/v1/habits/fasting/status?date=YYYY-MM-DD
GET /api/v1/habits/fasting/summary  # last 30 days, no streak counter (ADR-003)
```

#### [NEW] `backend/app/infrastructure/orm_models.py` — `fasting_logs` table

### Frontend additions
- `FastingWidget` on Home page alongside `PrayerStatusRow`
- Single tap: Not fasting → Fasting → Broken → Excused (same cycle pattern as prayer)
- Copy on `PrayerStatusRow` — same accessible tap-cycle UX

---

## Verification Plan

### Automated Tests

```bash
# Postgres running
docker compose up postgres -d

# Apply migrations
cd /opt/lifeos/mlos/backend
alembic upgrade head

# Full backend test suite (must remain ≥ 109 passing)
python -m pytest tests/ -v --tb=short

# Frontend quality gates
cd /opt/lifeos/mlos/frontend
npm run typecheck
npm run lint
npm run build  # confirms no TS errors in prod bundle
```

### Manual Verification Checklist

**Increment 0 (Postgres + Alembic):**
- [ ] `alembic upgrade head` runs cleanly from scratch
- [ ] Restart backend → family data persists (SQLite would lose it)
- [ ] AI conversations persist across restarts
- [ ] All 109 tests still pass

**Increment A (Settings):**
- [ ] Search "Karachi" → location auto-fills → prayer times update on home page
- [ ] Change calculation method → prayer times change correctly
- [ ] Toggle dark mode → applies instantly, persists after hard reload
- [ ] Settings form shows live validation (not just on submit)

**Increment B (AI Assistant):**
- [ ] Create conversation → receive stub reply
- [ ] Conversation appears in history list
- [ ] Safety-refused message shows amber badge (not a raw error)
- [ ] Delete conversation → undo toast appears (10 s to cancel)
- [ ] Conversations persist across page reload (now stored in Postgres)

**Increment C (Family):**
- [ ] Create family → see member list with Owner badge
- [ ] Generate invite → copy token → second account accepts → appears as Adult member
- [ ] Owner can remove Adult member (with confirmation dialog)
- [ ] Family data persists across backend restart
- [ ] No prayer/Qur'an data visible in family view (privacy check)

---

## Implementation Order

```mermaid
graph TD
    P0[Increment 0\nPostgres + Alembic\n+ SQLAlchemy Family + AI repos]
    PA[Increment A\nSettings Page\nLocation + Prayer + Theme]
    PB[Increment B\nAI Chat UI]
    PC[Increment C\nFamily UI]
    PD[Increment D\nFasting Tracker\noptional]

    P0 --> PA
    P0 --> PB
    P0 --> PC
    PA --> PD
    PC --> PD
```

| # | Increment | Key deliverables | Est. files changed |
|---|---|---|---|
| 0 | Postgres + Alembic + repos | `docker-compose.yml`, `requirements.txt`, `orm_models.py`, 2 new SQLAlchemy repos, `alembic/`, `deps.py` | ~12 |
| A | Settings | `settings.tsx` + 4 new setting components, `theme.ts` | ~7 |
| B | AI Assistant | `assistant.tsx` + 3 new components, API types/endpoints | ~7 |
| C | Family | `families.tsx` + 3 new components, missing backend routes, API types/endpoints | ~10 |
| D | Fasting (opt.) | 1 backend endpoint, 1 frontend widget | ~4 |
