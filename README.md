# Aether Chat: Production-Ready Discord/Slack Clone

Aether Chat is a highly polished, fully functional real-time communication platform designed in a premium slate-dark aesthetic with glassmorphic borders and glowing neon accents. It features low-latency instant messaging, one-on-one private direct messages, invite-only group channels, read receipts, unread badges, typing indicators, attachments sharing, message pinning, and message reactions.

## Technical Architecture

- **Frontend**: Vite + React + TypeScript + Tailwind CSS + Framer Motion (60fps UI animations) + Zustand (state management) + Socket.IO Client.
- **Backend**: Node.js + Express + Socket.IO (room multiplexing, user statuses, and events) + Mongoose (MongoDB ODM) + Multer.
- **Deployment**: Dockerized services using `docker-compose`.

---

## Directory Structure

```
real-time-chat/
├── package.json                 # Root script runner for concurrent dev
├── docker-compose.yml           # Multi-container orchestration
├── server/                      # Express API & WebSocket Server
│   ├── server.js                # Core bootstrap & Socket.IO server
│   ├── config.js                # Configuration options
│   ├── models/                  # mongoose database schemas
│   ├── middleware/              # JWT auth verification
│   ├── routes/                  # REST endpoint routers (auth, channels, upload)
│   └── sockets/                 # Socket.IO connection event triggers
└── client/                      # React SPA
    ├── index.html               # Vite build entry
    ├── tailwind.config.js       # Tailwind configuration file
    ├── src/
    │   ├── main.tsx             # React mount
    │   ├── App.tsx              # Router, layout bindings, and uploads
    │   ├── socket.ts            # Socket.IO event handler
    │   ├── stores/              # Zustand Auth and Chat stores
    │   ├── components/          # Reusable view components
    │   └── types/               # TypeScript interfaces
```

---

## Configuration & Environments

Create a `.env` file in the **server** directory to override defaults.

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/aetherchat
JWT_SECRET=your_jwt_secret_token_123
FRONTEND_URL=http://localhost:3000

# OPTIONAL: Cloud Storage credentials to automatically activate S3/Cloudinary hooks
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

AWS_S3_BUCKET_NAME=your_bucket_name
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
```

---

## Getting Started

You can spin up the application in two ways:

### Method 1: Using Docker (Recommended)

Make sure Docker Desktop is running on your machine, then execute the following command at the root of the project:

```bash
npm run docker:up
```

This will automatically:
1. Boot up a local MongoDB container instance on port `27017`.
2. Build and start the Node.js Express server on port `5000`.
3. Build and launch the React Vite application on port `3000`.

To tear down the containers:
```bash
npm run docker:down
```

---

### Method 2: Running Locally

If running locally without Docker:

1. **Install Root dependencies & Sub-project packages**:
   ```bash
   npm run install:all
   ```

2. **Ensure MongoDB is running locally**:
   Make sure your local MongoDB instance is active on `mongodb://localhost:27017/aetherchat`.

3. **Start the development servers**:
   Run the following command at the project root to start both backend and frontend concurrently:
   ```bash
   npm run dev
   ```

4. **Access the application**:
   - Frontend Client: **`http://localhost:3000`**
   - Backend API: **`http://localhost:5000`**

---

## Key Design & UI Features

- **Slate Dark Theme**: Built first-class using Tailwind colors (Slate `#0F172A`, Surface `#111827`, Cards `#1E293B`, Indigo `#6366F1`).
- **Responsive 4-Panel Workspace**: Toggles right member directories, collapsible category sidebars, left iconic workspace rails, and sticky input footer attachments.
- **Message Grouping**: Combines consecutive messages sent by the same user within a 3-minute window, rendering a single avatar block with hover timestamps.
- **Real-Time Presence Sync**: Avatars render status color rings (Online: Green, Idle: Yellow, DND: Red, Offline: Gray) synced immediately via WebSockets.
- **Inline Previews**: Shared image attachments render inline. Video links map video players. Document uploads (PDF, ZIP, DOCX) display attachment download cards.
