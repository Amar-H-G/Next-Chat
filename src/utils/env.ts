/**
 * Checks required Appwrite environment variables at module load time.
 * Logs a warning (not an error) so the app still starts for dev with partial config.
 */
const REQUIRED_ENV_VARS = [
  "NEXT_PUBLIC_APPWRITE_ENDPOINT",
  "NEXT_PUBLIC_APPWRITE_PROJECT_ID",
  "NEXT_PUBLIC_APPWRITE_DATABASE_ID",
  "NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID",
  "NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID",
] as const;

export function checkEnvConfig(): void {
  if (typeof window === "undefined") return; // skip on server
  const missing = REQUIRED_ENV_VARS.filter(
    (key) => !process.env[key]
  );
  if (missing.length > 0) {
    console.warn(
      "[NexChat] Missing environment variables — app will not connect to Appwrite:\n" +
        missing.map((k) => `  • ${k}`).join("\n") +
        "\nCopy .env.example to .env.local and fill in your Appwrite credentials."
    );
  }
}
