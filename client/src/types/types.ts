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
  users: string[]; // array of user IDs
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
