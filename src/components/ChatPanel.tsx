"use client";

import {
  useEffect,
  useRef,
  useState,
  FormEvent,
  KeyboardEvent,
  useCallback,
} from "react";
import type { RealtimeResponseEvent } from "appwrite";
import {
  client,
  getConversationId,
  MESSAGES_COLLECTION_ID,
  DATABASE_ID,
} from "@/lib/appwrite";
import { getMessages, sendMessage } from "@/lib/api";
import { MessageList } from "@/components/MessageBubble";
import { SkeletonMessages } from "@/components/Skeletons";
import { getAvatarGradient, getInitials } from "@/utils/avatar";
import { validateMessage } from "@/utils/validation";
import type { Message, UserProfile, AppUser, SendStatus } from "@/types";

const MAX_CHARS = 4000;

interface ChatPanelProps {
  currentUser: AppUser;
  otherUser: UserProfile;
  onBack?: () => void;
}

export function ChatPanel({ currentUser, otherUser, onBack }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sendStatus, setSendStatus] = useState<SendStatus>("idle");
  const [sendError, setSendError] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [loadError, setLoadError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // Track pending send to prevent duplicates (optimistic ID)
  const pendingMsgIdRef = useRef<string | null>(null);

  const conversationId = getConversationId(currentUser.$id, otherUser.userId);

  // ── Load historical messages ────────────────────────────────────────────
  const loadHistory = useCallback(async () => {
    setLoadingMessages(true);
    setLoadError("");
    setMessages([]);
    try {
      const history = await getMessages(currentUser.$id, otherUser.userId);
      setMessages(history);
    } catch {
      setLoadError("Failed to load messages. Tap to retry.");
    } finally {
      setLoadingMessages(false);
    }
  }, [currentUser.$id, otherUser.userId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // ── Real-time subscription ──────────────────────────────────────────────
  useEffect(() => {
    const channel = `databases.${DATABASE_ID}.collections.${MESSAGES_COLLECTION_ID}.documents`;

    const unsubscribe = client.subscribe<Message>(
      channel,
      (response: RealtimeResponseEvent<Message>) => {
        if (
          !response.events.includes(
            "databases.*.collections.*.documents.*.create"
          )
        ) {
          return;
        }

        const newMsg = response.payload;

        // Validate this message belongs to the active conversation
        const belongs =
          newMsg.conversationId === conversationId &&
          // Double-check participants against this specific conversation
          ((newMsg.senderId === currentUser.$id &&
            newMsg.receiverId === otherUser.userId) ||
            (newMsg.senderId === otherUser.userId &&
              newMsg.receiverId === currentUser.$id));

        if (!belongs) return;

        setMessages((prev) => {
          // De-duplicate by $id (handles optimistic + realtime race)
          if (prev.some((m) => m.$id === newMsg.$id)) return prev;
          // Also clear the pendingMsgId if this is the confirmed version
          if (pendingMsgIdRef.current === newMsg.$id) {
            pendingMsgIdRef.current = null;
          }
          return [...prev, newMsg];
        });
      }
    );

    return () => unsubscribe();
  }, [conversationId, currentUser.$id, otherUser.userId]);

  // ── Auto-scroll ─────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Send message ────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const validationError = validateMessage(input);
    if (validationError) return; // silent: send button already disabled
    if (sendStatus === "sending") return;

    const text = input.trim();
    setInput("");
    setSendError("");
    setSendStatus("sending");

    try {
      const created = await sendMessage(
        currentUser.$id,
        otherUser.userId,
        currentUser.name,
        text
      );
      pendingMsgIdRef.current = created.$id;
      setSendStatus("idle");
      // The realtime subscription will add the message; no need to push here
    } catch {
      setSendStatus("error");
      setSendError("Message failed to send. Your draft is restored.");
      setInput(text); // restore draft
    } finally {
      inputRef.current?.focus();
    }
  }, [input, sendStatus, currentUser, otherUser]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleSend();
  };

  const isInputValid = !validateMessage(input);
  const charsLeft = MAX_CHARS - input.length;

  const gradient = getAvatarGradient(otherUser.name);
  const initials = getInitials(otherUser.name);

  return (
    <>
      {/* ── Chat header ── */}
      <div className="chat-header">
        {/* Back button (mobile only) */}
        {onBack && (
          <button
            className="mobile-back-btn"
            onClick={onBack}
            aria-label="Back to contacts"
            type="button"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}
        <div className={`avatar avatar-lg ${gradient}`} aria-hidden="true">
          {initials}
        </div>
        <div className="chat-header-info">
          <div className="chat-header-name">{otherUser.name}</div>
          <div className="chat-header-status" aria-label="Online">
            <span className="status-dot" aria-hidden="true" />
            Online
          </div>
        </div>
      </div>

      {/* ── Send error toast ── */}
      {sendStatus === "error" && (
        <div className="send-error-toast" role="alert" aria-live="assertive">
          <span>{sendError}</span>
          <button
            className="send-error-dismiss"
            onClick={() => {
              setSendStatus("idle");
              setSendError("");
            }}
            aria-label="Dismiss error"
            type="button"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Messages area ── */}
      {loadingMessages ? (
        <SkeletonMessages />
      ) : loadError ? (
        <div className="load-error-state">
          <div className="load-error-icon" aria-hidden="true">
            ⚠️
          </div>
          <div className="load-error-text">{loadError}</div>
          <button
            className="error-state-retry"
            onClick={loadHistory}
            type="button"
          >
            Retry
          </button>
        </div>
      ) : (
        <div
          className="chat-messages"
          id="messages-container"
          aria-live="polite"
          aria-label={`Conversation with ${otherUser.name}`}
        >
          {messages.length === 0 ? (
            <div className="empty-conversation">
              <div className="empty-conversation-icon" aria-hidden="true">
                👋
              </div>
              <p>
                Start the conversation with{" "}
                <strong>{otherUser.name}</strong>!
              </p>
            </div>
          ) : (
            <MessageList
              messages={messages}
              currentUserId={currentUser.$id}
            />
          )}
          <div ref={bottomRef} aria-hidden="true" />
        </div>
      )}

      {/* ── Input area ── */}
      <form
        className="chat-input-area"
        onSubmit={handleSubmit}
        aria-label="Message composer"
      >
        <div className="chat-input-wrapper">
          <textarea
            ref={inputRef}
            id="message-input"
            className="chat-input"
            placeholder={`Message ${otherUser.name}… (Enter to send)`}
            value={input}
            onChange={(e) => {
              if (e.target.value.length <= MAX_CHARS) {
                setInput(e.target.value);
                if (sendStatus === "error") {
                  setSendStatus("idle");
                  setSendError("");
                }
              }
            }}
            onKeyDown={handleKeyDown}
            rows={1}
            autoFocus
            aria-label="Type a message"
            aria-multiline="true"
            maxLength={MAX_CHARS}
            disabled={sendStatus === "sending"}
          />
          {/* Character counter — only shown near limit */}
          {input.length > MAX_CHARS * 0.8 && (
            <div
              className={`char-counter ${charsLeft < 100 ? "char-counter--warning" : ""}`}
              aria-live="polite"
            >
              {charsLeft}
            </div>
          )}
        </div>
        <button
          id="send-btn"
          type="submit"
          className={`send-btn ${sendStatus === "sending" ? "send-btn--sending" : ""}`}
          disabled={!isInputValid || sendStatus === "sending"}
          aria-label={sendStatus === "sending" ? "Sending…" : "Send message"}
          title="Send (Enter)"
        >
          {sendStatus === "sending" ? (
            <span className="send-btn-spinner" aria-hidden="true" />
          ) : (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          )}
        </button>
      </form>
    </>
  );
}
