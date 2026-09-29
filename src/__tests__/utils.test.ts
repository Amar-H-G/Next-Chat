import {
  validateName,
  validateEmail,
  validatePassword,
  validateMessage,
} from "@/utils/validation";
import { getConversationId } from "@/lib/appwrite";
import { getInitials, getAvatarGradient } from "@/utils/avatar";

// ─── validateName ────────────────────────────────────────────────────────────

describe("validateName", () => {
  it("accepts a valid two-word name", () => {
    expect(validateName("Jane Smith")).toBeNull();
  });
  it("accepts a single word name of 3+ chars", () => {
    expect(validateName("Alice")).toBeNull();
  });
  it("rejects empty string", () => {
    expect(validateName("")).not.toBeNull();
  });
  it("rejects whitespace-only", () => {
    expect(validateName("   ")).not.toBeNull();
  });
  it("rejects single character", () => {
    expect(validateName("A")).not.toBeNull();
  });
  it("rejects name over 128 chars", () => {
    expect(validateName("A".repeat(129))).not.toBeNull();
  });
  it("accepts name at exactly 128 chars", () => {
    expect(validateName("A".repeat(128))).toBeNull();
  });
});

// ─── validateEmail ───────────────────────────────────────────────────────────

describe("validateEmail", () => {
  it("accepts valid email", () => {
    expect(validateEmail("user@example.com")).toBeNull();
  });
  it("accepts email with subdomain", () => {
    expect(validateEmail("user@mail.example.co.uk")).toBeNull();
  });
  it("rejects empty string", () => {
    expect(validateEmail("")).not.toBeNull();
  });
  it("rejects missing @", () => {
    expect(validateEmail("userexample.com")).not.toBeNull();
  });
  it("rejects missing domain", () => {
    expect(validateEmail("user@")).not.toBeNull();
  });
  it("rejects missing TLD", () => {
    expect(validateEmail("user@example")).not.toBeNull();
  });
  it("trims whitespace before checking", () => {
    expect(validateEmail("  user@example.com  ")).toBeNull();
  });
});

// ─── validatePassword ────────────────────────────────────────────────────────

describe("validatePassword", () => {
  it("accepts 8-char password", () => {
    expect(validatePassword("secure12")).toBeNull();
  });
  it("accepts long password", () => {
    expect(validatePassword("A".repeat(100))).toBeNull();
  });
  it("rejects empty string", () => {
    expect(validatePassword("")).not.toBeNull();
  });
  it("rejects 7-char password", () => {
    expect(validatePassword("1234567")).not.toBeNull();
  });
  it("rejects password over 256 chars", () => {
    expect(validatePassword("A".repeat(257))).not.toBeNull();
  });
});

// ─── validateMessage ─────────────────────────────────────────────────────────

describe("validateMessage", () => {
  it("accepts valid message", () => {
    expect(validateMessage("Hello world")).toBeNull();
  });
  it("rejects empty string", () => {
    expect(validateMessage("")).not.toBeNull();
  });
  it("rejects whitespace-only", () => {
    expect(validateMessage("   \n   ")).not.toBeNull();
  });
  it("rejects message over 4000 chars", () => {
    expect(validateMessage("A".repeat(4001))).not.toBeNull();
  });
  it("accepts message at exactly 4000 chars", () => {
    expect(validateMessage("A".repeat(4000))).toBeNull();
  });
});

// ─── getConversationId ───────────────────────────────────────────────────────

describe("getConversationId", () => {
  it("is commutative — same ID regardless of argument order", () => {
    expect(getConversationId("user_a", "user_b")).toBe(
      getConversationId("user_b", "user_a")
    );
  });
  it("produces different IDs for different pairs", () => {
    expect(getConversationId("user_a", "user_b")).not.toBe(
      getConversationId("user_a", "user_c")
    );
  });
  it("contains both user IDs", () => {
    const id = getConversationId("alice", "bob");
    expect(id).toContain("alice");
    expect(id).toContain("bob");
  });
  it("is a string", () => {
    expect(typeof getConversationId("x", "y")).toBe("string");
  });
});

// ─── getInitials ─────────────────────────────────────────────────────────────

describe("getInitials", () => {
  it("returns two initials for two-word name", () => {
    expect(getInitials("Jane Smith")).toBe("JS");
  });
  it("returns two chars for single word", () => {
    expect(getInitials("Alice")).toBe("AL");
  });
  it("is uppercase", () => {
    expect(getInitials("john doe")).toBe("JD");
  });
  it("handles leading/trailing spaces", () => {
    expect(getInitials("  Jane  Smith  ")).toBe("JS");
  });
});

// ─── getAvatarGradient ───────────────────────────────────────────────────────

describe("getAvatarGradient", () => {
  it("returns avatar-gradient-N class", () => {
    expect(getAvatarGradient("Test User")).toMatch(/^avatar-gradient-\d+$/);
  });
  it("is deterministic", () => {
    expect(getAvatarGradient("Alice")).toBe(getAvatarGradient("Alice"));
  });
  it("handles empty string without throwing", () => {
    expect(() => getAvatarGradient("")).not.toThrow();
  });
});

// ─── Conversation participant matching logic ──────────────────────────────────

describe("Conversation participant matching", () => {
  const userA = "user_a";
  const userB = "user_b";
  const userC = "user_c";

  function messageMatchesConversation(
    msg: { senderId: string; receiverId: string },
    convId: string,
    currentUserId: string,
    otherUserId: string
  ): boolean {
    const convIdForPair = getConversationId(currentUserId, otherUserId);
    const msgConvId = getConversationId(msg.senderId, msg.receiverId);
    if (msgConvId !== convId) return false;
    if (msgConvId !== convIdForPair) return false;
    return (
      (msg.senderId === currentUserId && msg.receiverId === otherUserId) ||
      (msg.senderId === otherUserId && msg.receiverId === currentUserId)
    );
  }

  const convId = getConversationId(userA, userB);

  it("accepts A→B message for A↔B conversation", () => {
    expect(
      messageMatchesConversation(
        { senderId: userA, receiverId: userB },
        convId, userA, userB
      )
    ).toBe(true);
  });

  it("accepts B→A message for A↔B conversation", () => {
    expect(
      messageMatchesConversation(
        { senderId: userB, receiverId: userA },
        convId, userA, userB
      )
    ).toBe(true);
  });

  it("rejects A→C message for A↔B conversation", () => {
    expect(
      messageMatchesConversation(
        { senderId: userA, receiverId: userC },
        convId, userA, userB
      )
    ).toBe(false);
  });

  it("rejects C→A message for A↔B conversation", () => {
    expect(
      messageMatchesConversation(
        { senderId: userC, receiverId: userA },
        convId, userA, userB
      )
    ).toBe(false);
  });

  it("no cross-conversation leakage between A↔B and A↔C", () => {
    const convIdAC = getConversationId(userA, userC);
    expect(convId).not.toBe(convIdAC);
  });
});

// ─── Duplicate message prevention ────────────────────────────────────────────

describe("Duplicate message prevention", () => {
  function addMessageNoDuplicate(
    existing: Array<{ $id: string }>,
    newMsg: { $id: string }
  ): Array<{ $id: string }> {
    if (existing.some((m) => m.$id === newMsg.$id)) return existing;
    return [...existing, newMsg];
  }

  it("adds a new message", () => {
    const result = addMessageNoDuplicate(
      [{ $id: "msg-1" }],
      { $id: "msg-2" }
    );
    expect(result).toHaveLength(2);
  });

  it("does not add duplicate", () => {
    const result = addMessageNoDuplicate(
      [{ $id: "msg-1" }],
      { $id: "msg-1" }
    );
    expect(result).toHaveLength(1);
  });

  it("handles empty list", () => {
    const result = addMessageNoDuplicate([], { $id: "msg-1" });
    expect(result).toHaveLength(1);
  });
});

// ─── Message ordering ────────────────────────────────────────────────────────

describe("Message chronological ordering", () => {
  const msgs = [
    { $id: "3", $createdAt: "2024-01-01T10:30:00Z" },
    { $id: "1", $createdAt: "2024-01-01T10:00:00Z" },
    { $id: "2", $createdAt: "2024-01-01T10:15:00Z" },
  ];

  it("sorts messages by $createdAt ascending", () => {
    const sorted = [...msgs].sort(
      (a, b) =>
        new Date(a.$createdAt).getTime() - new Date(b.$createdAt).getTime()
    );
    expect(sorted.map((m) => m.$id)).toEqual(["1", "2", "3"]);
  });
});
