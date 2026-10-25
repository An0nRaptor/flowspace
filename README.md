# FlowSpace

Team project management app (Trello-style boards): workspaces, projects, tasks,
members with roles (Owner / Admin / Member) and invite links.

- **Frontend:** React 18 + TypeScript + Vite, Tailwind + shadcn/ui, TanStack Query
- **Backend:** Express + MongoDB (mongoose), Passport (email/password + Google), cookie sessions

## Run locally

```bash
# 1. backend (port 8000)
cd backend
cp .env.example .env      # fill in MONGO_URL, SESSION_SECRET, Google OAuth keys
npm install
npm run seed              # once: creates the OWNER / ADMIN / MEMBER roles
npm run dev

# 2. frontend (port 5173), in a second terminal
cd Frontend
cp .env.example .env      # VITE_API_BASE_URL="/api"
npm install
npm run dev
```

Open http://localhost:5173. In dev, Vite proxies `/api` to the backend, so the
browser only ever talks to one origin.

If MongoDB fails with `querySrv ECONNREFUSED`, your local DNS refuses SRV
lookups. Set `DNS_SERVERS=8.8.8.8,1.1.1.1` in `backend/.env`.

## Features

- Board view (drag tasks between Backlog / To do / In progress / In review / Done) and table view with filters and pagination
- Workspace and project analytics (total, overdue, completed tasks)
- Invite link to join a workspace; owners change member roles
- Permission-aware UI: members can create and edit tasks; only admins and owners can manage projects and settings
