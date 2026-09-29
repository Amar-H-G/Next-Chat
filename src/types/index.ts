export interface AppUser {
  $id: string;
  name: string;
  email: string;
  $createdAt: string;
}

export interface UserProfile {
  $id: string;
  userId: string;
  name: string;
  email: string;
  $createdAt: string;
}

export interface Message {
  $id: string;
  senderId: string;
  receiverId: string;
  senderName: string;
  content: string;
  conversationId: string;
  $createdAt: string;
}

export interface Conversation {
  user: UserProfile;
  lastMessage?: Message;
  unreadCount: number;
}

export type SendStatus = "idle" | "sending" | "error";

export interface ValidationError {
  field: string;
  message: string;
}
