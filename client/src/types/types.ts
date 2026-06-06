export interface Session {
  _id: string;
  userAgent: string;
  ipAddress: string;
  lastActive: string;
}

export interface User {
  _id: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  statusText?: string;
  lastSeen?: string;
  createdAt: string;

  // --- UI PREFERENCES ---
  theme: 'midnight' | 'cyber-neon' | 'royal-purple' | 'emerald-dark' | 'crimson-elite' | 'light-professional';
  fontFamily: string;
  fontSizeUI: number;
  fontSizeChat: number;
  lineHeight: number;
  accentColor: string;

  // --- ACTIVE SESSIONS ---
  sessions?: Session[];
}

export interface Member {
  user: User;
  role: 'owner' | 'moderator' | 'member' | 'guest';
}

export interface Channel {
  _id: string;
  name: string;
  type: 'public' | 'private';
  creator?: string;
  members: Member[];
  isDirectMessage: boolean;
  createdAt: string;
  updatedAt: string;
  lastMessage?: Message;
}

export interface Attachment {
  url: string;
  name: string;
  fileType: string;
  size: number;
}

export interface Reaction {
  emoji: string;
  users: string[];
}

export interface Message {
  _id: string;
  channel: string;
  sender: User;
  content: string;
  attachment?: Attachment | null;
  reactions: Reaction[];
  replyTo?: Message | null;
  isPinned: boolean;
  isEdited: boolean;
  readers: string[];
  createdAt: string;
  updatedAt: string;
}
