import { Client, Account, Databases } from "appwrite";

const client = new Client();

client
  .setEndpoint(
    process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1"
  )
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "");

export const account = new Account(client);
export const databases = new Databases(client);
export { client };

export const DATABASE_ID =
  process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "";
export const MESSAGES_COLLECTION_ID =
  process.env.NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID || "";
export const USERS_COLLECTION_ID =
  process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID || "";

/**
 * Generate a deterministic conversation ID from two user IDs.
 * Sorting ensures user A->B and user B->A produce the same ID.
 */
export function getConversationId(userId1: string, userId2: string): string {
  return [userId1, userId2].sort().join("_");
}
