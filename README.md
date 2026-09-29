# NexChat – Real-Time One-to-One Chat Application

A production-quality real-time chat app built with **Next.js 15**, **TypeScript**, **Tailwind CSS v3**, and **Appwrite** for the backend.

---

## 1. Project Overview

NexChat enables authenticated users to send and receive instant messages with any other registered user. Messages are persisted in Appwrite Database and delivered in real-time via Appwrite Realtime WebSocket subscriptions. The frontend is deployable to Vercel in one click.

---

## 2. Features

| Feature | Details |
|---------|---------|
| Authentication | Email/password signup, login, logout |
| Protected routes | `/chat` redirects unauthenticated users to `/login` |
| User discovery | All registered users listed in the sidebar (excluding self) |
| One-to-one messaging | Scoped by deterministic `conversationId` |
| Real-time delivery | Appwrite Realtime WebSocket subscription |
| Message history | Loaded on conversation open, sorted chronologically |
| Sender & timestamp | Displayed on every message bubble |
| Auto-scroll | Scrolls to newest message on arrival |
| Empty-message guard | Client-side validation prevents blank sends |
| Send feedback | Spinner while sending; error toast with draft restore on failure |
| Unread count badge | Per-conversation unread indicator (cleared on open) |
| Mobile responsive | Full-screen sidebar/chat panel with animated transitions |
| Loading skeletons | User list and message area skeleton screens |
| Error recovery | Retry buttons for failed user/message loads |
| Dark UI | Premium dark theme with purple gradient accents |

---

## 3. Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v3.4 + custom CSS variables |
| Backend | Appwrite (Auth + Database + Realtime) |
| Deployment | Vercel |
| Testing | Jest + Testing Library |
| Fonts | Inter (Google Fonts via Next.js) |

---

## 4. Prerequisites

- Node.js ≥ 20
- npm ≥ 10
- An Appwrite account (free tier at [cloud.appwrite.io](https://cloud.appwrite.io))
- A Vercel account (free tier at [vercel.com](https://vercel.com))

---

## 5. Local Installation

```bash
git clone https://github.com/<your-org>/nexchat.git
cd nexchat
npm install
cp .env.example .env.local
# Edit .env.local with your Appwrite credentials
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 6. Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server on port 3000 |
| `npm run build` | Production build |
| `npm run start` | Start production server locally |
| `npm run lint` | ESLint check |
| `npm run typecheck` | TypeScript type check |
| `npm test` | Run all tests |
| `npm run test:coverage` | Tests with coverage report |

---

## 7. Environment Variable Reference

Copy `.env.example` to `.env.local` and fill in each value:

```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=<your-project-id>
NEXT_PUBLIC_APPWRITE_DATABASE_ID=<your-database-id>
NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID=<users-collection-id>
NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID=<messages-collection-id>
```

All variables are prefixed `NEXT_PUBLIC_` because the Appwrite SDK runs in the browser. **No privileged API key is used** — all operations are scoped to user sessions enforced by Appwrite.

---

## 8. Appwrite Project Setup

1. Sign up at [cloud.appwrite.io](https://cloud.appwrite.io).
2. Click **Create Project**, give it a name (e.g., `nexchat`), and note the **Project ID**.
3. Go to **Platforms** → **Add Platform** → **Web App**.
   - Hostname: `localhost` (for dev)
4. After deploying to Vercel, add another web platform with your Vercel domain.

---

## 9. Authentication Configuration

1. In your Appwrite project, go to **Auth → Settings**.
2. Ensure **Email/Password** is enabled (it is by default).
3. No other providers are required.

---

## 10. Database Collections, Attributes & Indexes

### Create a Database

**Databases** → **Create Database** → name it `nexchat` → note the Database ID.

---

### `users` Collection

**Create Collection** → ID: `users`.

**Attributes:**

| Attribute | Type | Size | Required |
|-----------|------|------|----------|
| `userId` | String | 36 | ✅ |
| `name` | String | 128 | ✅ |
| `email` | String | 256 | ✅ |

**Indexes:**

| Index name | Type | Attribute |
|------------|------|-----------|
| `userId_key` | Key | `userId` |

---

### `messages` Collection

**Create Collection** → ID: `messages`.

**Attributes:**

| Attribute | Type | Size | Required |
|-----------|------|------|----------|
| `senderId` | String | 36 | ✅ |
| `receiverId` | String | 36 | ✅ |
| `senderName` | String | 128 | ✅ |
| `content` | String | 4096 | ✅ |
| `conversationId` | String | 80 | ✅ |

**Indexes:**

| Index name | Type | Attribute | Order |
|------------|------|-----------|-------|
| `conversationId_created` | Key | `conversationId`, `$createdAt` | ASC |

---

## 11. Database Permissions & Security

### `users` Collection

| Role | Permissions |
|------|------------|
| `users` (any authenticated user) | Read |
| `user:<userId>` (document owner) | Create, Update |

This means any logged-in user can list other users (required for the contact list), but only the owner can create their own profile. **No unauthenticated reads are allowed.**

### `messages` Collection

| Role | Permissions |
|------|------------|
| `users` (any authenticated user) | Create |
| `user:<senderId>` | Read (their own sent messages) |
| `user:<receiverId>` | Read (messages sent to them) |

> **Security note:** Appwrite permissions gate document access at the storage layer before any query filter runs. A user cannot read a message they are neither the sender nor receiver of, even by guessing a document ID.

**Sender impersonation prevention:** The `senderId` is set server-side to the authenticated user's `$id` at write time via the SDK — the client cannot supply a different `senderId` without the request being rejected by Appwrite Auth.

---

## 12. How User Profiles Are Registered & Queried

**On signup:**
```ts
await account.create(ID.unique(), email, password, name);
await account.createEmailPasswordSession(email, password);
await databases.createDocument(DATABASE_ID, USERS_COLLECTION_ID, user.$id, {
  userId: user.$id, name, email,
});
```

The user profile document is stored under the same `$id` as the Auth account.

**On the chat page:**
```ts
databases.listDocuments(DATABASE_ID, USERS_COLLECTION_ID, [
  Query.notEqual("userId", currentUserId),
  Query.limit(100),
]);
```

---

## 13. How Message History Queries Work

Messages are keyed by a deterministic `conversationId`:

```ts
function getConversationId(userId1: string, userId2: string): string {
  return [userId1, userId2].sort().join("_");
}
```

This ensures `A↔B` and `B↔A` produce the same ID regardless of who initiated.

To load history:
```ts
databases.listDocuments(DATABASE_ID, MESSAGES_COLLECTION_ID, [
  Query.equal("conversationId", conversationId),
  Query.orderAsc("$createdAt"),
  Query.limit(100),
]);
```

Each message also stores `senderId` and `receiverId` for explicit participant verification and permission enforcement.

---

## 14. How Real-Time Subscriptions Work

```ts
const channel = `databases.${DATABASE_ID}.collections.${MESSAGES_COLLECTION_ID}.documents`;

const unsubscribe = client.subscribe<Message>(channel, (response) => {
  if (!response.events.includes("databases.*.collections.*.documents.*.create"))
    return;

  const msg = response.payload;

  // Validate participant pair before displaying
  const belongs =
    msg.conversationId === activeConversationId &&
    ((msg.senderId === currentUser.$id && msg.receiverId === otherUser.userId) ||
     (msg.senderId === otherUser.userId && msg.receiverId === currentUser.$id));

  if (!belongs) return;

  setMessages(prev => {
    if (prev.some(m => m.$id === msg.$id)) return prev; // de-duplicate
    return [...prev, msg];
  });
});

// Cleanup on unmount/conversation switch
return () => unsubscribe();
```

A second global subscription in the chat page tracks unread counts for background conversations.

---

## 15. How to Run Automated Tests

```bash
npm test                    # Run all tests (passes with no Appwrite credentials)
npm run test:coverage       # Coverage report
npm run typecheck           # TypeScript check
npm run lint                # ESLint
npm run build               # Production build verification
```

---

## 16. How to Perform a Real Two-Account Test

1. Start the dev server: `npm run dev`
2. Open **Browser A** at `http://localhost:3000/signup` → register **User A** (e.g., `alice@test.com`)
3. Open **Browser B** (private window or different browser) at `http://localhost:3000/signup` → register **User B** (e.g., `bob@test.com`)
4. In Browser A, select User B from the sidebar
5. Send a message from A
6. Verify Browser B shows the message **without refreshing**
7. Reply from B, verify A receives it in real-time
8. Check sender names and timestamps are correct
9. Switch to a different conversation in A and confirm messages do not mix
10. Reopen the A↔B conversation and confirm history is intact

---

## 17. How to Deploy to Vercel

```bash
# 1. Push to GitHub
git init && git add . && git commit -m "feat: nexchat initial"
git remote add origin https://github.com/<you>/nexchat.git
git push -u origin main

# 2. Import in Vercel
# Go to https://vercel.com/new → Import Git Repository → select nexchat

# 3. Add environment variables in Vercel project settings:
#    NEXT_PUBLIC_APPWRITE_ENDPOINT
#    NEXT_PUBLIC_APPWRITE_PROJECT_ID
#    NEXT_PUBLIC_APPWRITE_DATABASE_ID
#    NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID
#    NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID

# 4. Deploy
```

Vercel auto-detects Next.js and deploys with zero configuration.

---

## 18. Configure the Vercel Domain in Appwrite

After deployment:

1. Copy your Vercel URL (e.g., `https://nexchat-abc.vercel.app`)
2. In Appwrite → **Platforms** → **Add Platform** → **Web App**
3. Set **Hostname**: `nexchat-abc.vercel.app` (no `https://`)
4. Save

Without this step, Appwrite will reject requests from your production URL with a CORS/platform error.

---

## 19. Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| "Missing environment variables" in console | `.env.local` not configured | Copy `.env.example` → `.env.local`, fill values |
| Auth fails silently | Wrong project ID or endpoint | Check Appwrite project settings |
| No users in sidebar | `users` collection missing or wrong permissions | Re-read Section 11 |
| Messages not real-time | Missing web platform in Appwrite | Add `localhost` (dev) or Vercel domain (prod) |
| CORS error in production | Vercel domain not added to Appwrite platforms | See Section 18 |
| Build fails | Node < 20 or missing deps | `node --version`, then `npm install` |

---

## 20. Known Limitations & Remaining Manual Actions

| Item | Status | Action needed |
|------|--------|--------------|
| Appwrite project setup | ⚠️ Manual | Create project, database, collections, set permissions |
| `.env.local` configuration | ⚠️ Manual | Fill in your Appwrite IDs |
| GitHub repository | ⚠️ Manual | `git init && git push` |
| Vercel deployment | ⚠️ Manual | Import repo in Vercel dashboard |
| Two-account real-time test | ⚠️ Manual | Run with two browsers (credentials needed) |
| Message pagination | 💡 Limited | Currently fixed at 100 messages; no infinite scroll |
| Session expiry handling | 💡 Basic | Redirect to login; no auto-refresh token |
| Offline/reconnect | 💡 Basic | Appwrite SDK reconnects automatically; no offline queue |

---

## Security Summary

- No Appwrite API key in the client bundle — only the public project ID
- All database permissions enforced server-side by Appwrite
- Sender identity tied to the authenticated session, not client-supplied
- XSS: all message content rendered as text nodes via React (`white-space: pre-wrap`)
- Realtime events validated against active conversation participants before display
- `.env.local` excluded from Git via `.gitignore`
