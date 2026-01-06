# PROJECT STATE SNAPSHOT – NowTrip

## 1. Project overview
- Name: NowTrip – Web bán tour du lịch
- Architecture: Monorepo
- Frontend:
  - apps/public-web (Next.js 16, App Router)
  - apps/portal-web (Next.js 16, CRM cho admin/staff)
- Backend:
  - Firebase Auth
  - Firestore
  - Cloud Functions (onCall)
- Local dev:
  - Firebase Emulator (Auth, Firestore, Functions)
- Java: OpenJDK 21 (fixed globally)

---

## 2. Local URLs
- Public web: http://localhost:3000
- Portal web: http://localhost:3001
- Firebase Emulator UI: http://localhost:4000
  - Auth: /auth
  - Firestore: /firestore
  - Functions: /functions

---

## 3. Current folder structure (important)
nowtrip/
├─ apps/
│ ├─ public-web/
│ │ ├─ src/
│ │ │ ├─ app/
│ │ │ │ ├─ page.tsx
│ │ │ │ ├─ contact/
│ │ │ │ │ └─ page.tsx # submit lead
│ │ │ └─ lib/
│ │ │ └─ firebaseClient.ts
│ │ └─ .env.local
│ ├─ portal-web/
│ │ ├─ src/
│ │ │ ├─ app/
│ │ │ │ ├─ login/
│ │ │ │ │ └─ page.tsx
│ │ │ │ ├─ leads/
│ │ │ │ │ ├─ page.tsx # list leads
│ │ │ │ │ └─ [id]/
│ │ │ │ │ └─ page.tsx # lead detail
│ │ │ │ ├─ admin/
│ │ │ │ │ ├─ bootstrap/
│ │ │ │ │ │ └─ page.tsx # set admin claim (dev-only)
│ │ │ │ │ └─ users/
│ │ │ │ │ └─ page.tsx # create staff
│ │ │ └─ lib/
│ │ │ └─ firebaseClient.ts
│ │ └─ .env.local
├─ firebase/
│ ├─ functions/
│ │ ├─ src/
│ │ │ ├─ index.ts
│ │ │ ├─ public/public_submitLead.ts
│ │ │ └─ admin/
│ │ │ ├─ admin_createStaffUser.ts
│ │ │ └─ devSetMyRoleAdmin.ts
│ │ └─ package.json
│ ├─ firestore.rules
│ ├─ firebase.json
│ └─ .emulator-data/ # (persist emulator data – đang triển khai)
└─ docs/
└─ PROJECT_STATE.md

---

## 4. Implemented features (DONE)
- Public submit lead via callable `public_submitLead`
  - CAPTCHA check
  - Phone dedupe (7 days)
  - Write Firestore server-only
- Portal authentication via Auth Emulator
- Dev-only bootstrap admin claim
- Admin create staff user
- Portal:
  - List leads
  - Lead detail
  - Update status
  - Add note
  - Assign to me
  - Call / WhatsApp actions
- Firestore rules:
  - Lead create: server-only
  - Staff update limited fields
  - Admin-only CRUD tour/promo

---

## 5. Emulator commands (current)
```bash
# start emulators
cd firebase
firebase emulators:start

# public web
cd apps/public-web
npm run dev

# portal web
cd apps/portal-web
npm run dev

---

## 6. CURRENT TASK (where development stopped)
Step 1: Persist emulator data (Done)

Goal:

Do not lose Auth users, claims, Firestore data after restart

Plan:

firebase.json: add emulators.import / exportOnExit

folder: firebase/.emulator-data


---

## 7. NEXT TASKS (in order)

Unassigned leads queue + SLA (>24h highlight)

Export leads CSV (admin-only)

Prepare staging deploy (Vercel + Firebase)


---

## Cách dùng file này cho chat mới (rất quan trọng)

### Trong chat mới, bạn chỉ cần nói:
> Mình có file `docs/PROJECT_STATE.md`, hãy tiếp tục code từ **Step 1 – Persist emulator data**

Hoặc:
> Đọc PROJECT_STATE và làm tiếp **Step 2 – Unassigned queue + SLA**