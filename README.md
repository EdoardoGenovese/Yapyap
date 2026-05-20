bash

cat > /mnt/user-data/outputs/README_yapyap.md << 'EOF'
# 💬 YapYap

> Say more, type less.

A real-time chat application with public and private rooms, file uploads, typing indicators and live presence. Built with a Node.js backend and a Next.js frontend.

![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat-square&logo=express)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=flat-square&logo=socket.io)
![Next.js](https://img.shields.io/badge/Next.js_15-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat-square&logo=redis&logoColor=white)

---

## Features

- **Real-time messaging** — instant messages via Socket.io WebSocket connection
- **Public & private rooms** — public rooms open to all, private rooms accessible via invite code
- **File & image uploads** — upload images and files via Cloudinary, with inline preview
- **Typing indicators** — see when someone is typing in real time
- **User presence** — online/offline status tracked via Redis with auto-expiry
- **Message actions** — reply, edit and delete your own messages
- **JWT authentication** — access token (15min) + refresh token (7 days) rotation
- **Member list** — see who's in the room and their online status

---

## Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express |
| Real-time | Socket.io |
| ORM | Prisma 7 |
| Database | PostgreSQL (Neon) |
| Cache & Presence | Redis (Upstash) |
| File storage | Cloudinary |
| Auth | JWT (jsonwebtoken + bcrypt) |
| Validation | Zod |
| Language | TypeScript |

### Frontend
| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Real-time | Socket.io client |
| State | Zustand |
| Data fetching | TanStack Query |
| UI | shadcn/ui + Tailwind CSS |
| Forms | React Hook Form + Zod |

---

## Project Structure

```
yapyap/
├── backend/
│   ├── src/
│   │   ├── index.ts          # Entry point — Express + Socket.io server
│   │   ├── routes/
│   │   │   ├── auth.ts       # Register, login, refresh, logout
│   │   │   ├── rooms.ts      # CRUD rooms, join, leave
│   │   │   ├── messages.ts   # Send, edit, delete, upload
│   │   │   └── users.ts      # Profile, avatar upload
│   │   ├── socket/
│   │   │   └── index.ts      # Socket.io handlers — presence, typing, rooms
│   │   ├── middleware/
│   │   │   ├── auth.ts       # JWT verification middleware
│   │   │   └── errorHandler.ts
│   │   ├── services/
│   │   │   └── cloudinary.ts # File upload service
│   │   ├── utils/
│   │   │   ├── prisma.ts     # Prisma client singleton
│   │   │   ├── redis.ts      # Redis helpers — presence, typing
│   │   │   └── jwt.ts        # Token generation and verification
│   │   └── types/
│   │       └── index.ts      # Shared TypeScript types
│   └── prisma/
│       └── schema.prisma     # Database schema
│
└── frontend/
    ├── app/
    │   ├── (auth)/           # Login and register pages
    │   └── (app)/            # Protected app pages
    │       └── rooms/[id]/   # Chat room page
    ├── components/
    │   ├── layout/
    │   │   └── Sidebar.tsx   # Room list + user footer
    │   ├── chat/
    │   │   ├── ChatRoom.tsx  # Main chat component
    │   │   ├── MessageList.tsx
    │   │   ├── MessageBubble.tsx
    │   │   ├── MessageInput.tsx
    │   │   └── MembersList.tsx
    │   └── rooms/
    │       ├── CreateRoomDialog.tsx
    │       └── JoinRoomDialog.tsx
    └── lib/
        ├── api/              # API clients (auth, rooms, messages)
        ├── socket/           # Socket.io provider and client
        ├── stores/           # Zustand stores
        └── providers/        # React Query provider
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Docker Desktop (for local PostgreSQL and Redis)
- A [Cloudinary](https://cloudinary.com) account (free)
- A [Neon](https://neon.tech) account (free PostgreSQL)
- An [Upstash](https://upstash.com) account (free Redis)

### Backend setup

1. Install dependencies

```bash
cd backend
npm install
```

2. Create **`backend/.env`**:

```bash
DATABASE_URL="postgresql://user:password@ep-xxx.neon.tech/yapyap?sslmode=require"
REDIS_URL="rediss://default:token@xyz.upstash.io:6380"
JWT_SECRET="your-64-byte-random-secret"
JWT_REFRESH_SECRET="another-64-byte-random-secret"
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
CLIENT_URL="http://localhost:3002"
PORT=3001
```

Generate secrets with:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

3. Run migrations and start

```bash
npx prisma migrate deploy
npx prisma generate
npm run dev
```

### Frontend setup

1. Install dependencies

```bash
cd frontend
npm install
```

2. Create **`frontend/.env.local`**:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

3. Start

```bash
npm run dev -- -p 3002
```

---

## Deployment

**Backend → [Railway](https://railway.app)**
- Supports WebSocket and long-lived connections (unlike Vercel)
- Add all environment variables in the Railway dashboard
- Set `CLIENT_URL` to your Vercel frontend URL

**Frontend → [Vercel](https://vercel.com)**
- Set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SOCKET_URL` to your Railway backend URL

---

## Architecture Notes

**Why two tokens?** — The access token expires in 15 minutes for security. The refresh token lasts 7 days and is rotated on every use — the old one is deleted from the database and a new one is issued. If someone steals your access token they have at most 15 minutes.

**Redis for presence** — User online status is stored in Redis with a 5-minute TTL. If the server crashes, presence data expires automatically without leaving ghost users. Typing indicators expire after 5 seconds so they clean themselves up even if the client disconnects mid-type.

**Socket.io rooms** — Each chat room maps directly to a Socket.io room. When a user connects, they automatically join all rooms they're a member of. `io.to(roomId).emit()` broadcasts only to members of that room.

**Prisma 7 + driver adapter** — Prisma 7 requires an explicit driver adapter (`@prisma/adapter-pg`) instead of the built-in engine. This gives more control over connection pooling and is the recommended approach for serverless environments.

---

## License

MIT
EOF
Output

exit code 0