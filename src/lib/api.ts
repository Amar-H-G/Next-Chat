import { ID, Query } from "appwrite";
import {
  account,
  databases,
  DATABASE_ID,
  USERS_COLLECTION_ID,
  MESSAGES_COLLECTION_ID,
  getConversationId,
} from "./appwrite";
import type { AppUser, UserProfile, Message } from "@/types";

// ─── Auth ─────────────────────────────────────────────────────────────────

export async function signUp(
  email: string,
  password: string,
  name: string
): Promise<AppUser> {
  const user = await account.create(ID.unique(), email, password, name);
  await account.createEmailPasswordSession(email, password);
  // Store profile in database so other users can discover this user
  await databases.createDocument(DATABASE_ID, USERS_COLLECTION_ID, user.$id, {
    userId: user.$id,
    name: user.name,
    email: user.email,
  });
  return user as AppUser;
}

export async function login(
  email: string,
  password: string
): Promise<AppUser> {
  await account.createEmailPasswordSession(email, password);
  const user = await account.get();
  return user as AppUser;
}

export async function logout(): Promise<void> {
  await account.deleteSession("current");
}

export async function getCurrentUser(): Promise<AppUser | null> {
  try {
    const user = await account.get();
    return user as AppUser;
  } catch {
    return null;
  }
}

// ─── Users ────────────────────────────────────────────────────────────────

export async function getAllUsers(
  currentUserId: string
): Promise<UserProfile[]> {
  const response = await databases.listDocuments(
    DATABASE_ID,
    USERS_COLLECTION_ID,
    [Query.notEqual("userId", currentUserId), Query.limit(100)]
  );
  return response.documents as unknown as UserProfile[];
}

// ─── Messages ─────────────────────────────────────────────────────────────

export async function sendMessage(
  senderId: string,
  receiverId: string,
  senderName: string,
  content: string
): Promise<Message> {
  const conversationId = getConversationId(senderId, receiverId);
  const doc = await databases.createDocument(
    DATABASE_ID,
    MESSAGES_COLLECTION_ID,
    ID.unique(),
    {
      senderId,
      receiverId,
      senderName,
      content,
      conversationId,
    }
  );
  return doc as unknown as Message;
}

export async function getMessages(
  userId1: string,
  userId2: string
): Promise<Message[]> {
  const conversationId = getConversationId(userId1, userId2);
  const response = await databases.listDocuments(
    DATABASE_ID,
    MESSAGES_COLLECTION_ID,
    [
      Query.equal("conversationId", conversationId),
      Query.orderAsc("$createdAt"),
      Query.limit(100),
    ]
  );
  return response.documents as unknown as Message[];
}
