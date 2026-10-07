"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getAllUsers } from "@/lib/api";
import { client, DATABASE_ID, MESSAGES_COLLECTION_ID } from "@/lib/appwrite";
import { UserListItem } from "@/components/UserListItem";
import { ChatPanel } from "@/components/ChatPanel";
import { SkeletonUserList } from "@/components/Skeletons";
import { getAvatarGradient, getInitials } from "@/utils/avatar";
import { checkEnvConfig } from "@/utils/env";
import type { UserProfile, Message } from "@/types";
import type { RealtimeResponseEvent } from "appwrite";

export default function ChatPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  // Mobile: show sidebar or chat panel
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(true);

  // Check env config once
  useEffect(() => {
    checkEnvConfig();
  }, []);

  // Guard: redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  // Load other registered users
  const loadUsers = useCallback(async () => {
    if (!user) return;
    setLoadingUsers(true);
    setUsersError("");
    try {
      const result = await getAllUsers(user.$id);
      setUsers(result);
    } catch {
      setUsersError("Failed to load contacts. Tap to retry.");
    } finally {
      setLoadingUsers(false);
    }
  }, [user]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Subscribe globally to track unread messages in background conversations
  useEffect(() => {
    if (!user) return;

    const channel = `databases.${DATABASE_ID}.collections.${MESSAGES_COLLECTION_ID}.documents`;

    const unsubscribe = client.subscribe<Message>(
      channel,
      (response: RealtimeResponseEvent<Message>) => {
        if (
          response.events.includes(
            "databases.*.collections.*.documents.*.create",
          )
        ) {
          const msg = response.payload;

          // Only process messages sent to the current user
          if (msg.receiverId !== user.$id) return;

          // Move the sender to the top of the sidebar
          setUsers((prevUsers) => {
            const sender = prevUsers.find((u) => u.userId === msg.senderId);

            if (!sender) return prevUsers;

            return [
              sender,
              ...prevUsers.filter((u) => u.userId !== msg.senderId),
            ];
          });

          // Only increment unread count if this conversation
          // is not currently open
          const isCurrentConversation = selectedUser?.userId === msg.senderId;

          if (!isCurrentConversation) {
            setUnreadCounts((prev) => ({
              ...prev,
              [msg.senderId]: (prev[msg.senderId] ?? 0) + 1,
            }));
          }
        }
      },
    );

    return () => unsubscribe();
  }, [user, selectedUser]);

  const handleSelectUser = (u: UserProfile) => {
    setSelectedUser(u);
    // Clear unread count for this conversation
    setUnreadCounts((prev) => ({ ...prev, [u.userId]: 0 }));
    // On mobile: switch to chat panel view
    setMobileSidebarOpen(false);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut();
      router.replace("/login");
    } catch {
      setLoggingOut(false);
    }
  };

  const handleBackToSidebar = () => {
    setMobileSidebarOpen(true);
  };

  if (loading || !user) {
    return (
      <div className="auth-container">
        <div className="loading-spinner" aria-label="Loading…" />
      </div>
    );
  }

  const userGradient = getAvatarGradient(user.name);
  const userInitials = getInitials(user.name);

  return (
    <div className="chat-layout">
      {/* ── Sidebar ── */}
      <aside
        className={`sidebar ${mobileSidebarOpen ? "sidebar--mobile-open" : "sidebar--mobile-closed"}`}
        aria-label="Contacts sidebar"
      >
        {/* Brand header */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon" aria-hidden="true">
              💬
            </div>
            <span className="sidebar-logo-text">NexChat</span>
          </div>
        </div>

        {/* Current user info */}
        <div className="sidebar-user-info">
          <div
            className={`avatar avatar-sm ${userGradient}`}
            aria-label={`Your avatar: ${user.name}`}
          >
            {userInitials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="sidebar-current-name">{user.name}</div>
            <div className="sidebar-current-email">{user.email}</div>
          </div>
        </div>

        {/* Users list header */}
        <div className="sidebar-section-title">
          {loadingUsers
            ? "Loading…"
            : usersError
              ? "Contacts"
              : `${users.length} Contact${users.length !== 1 ? "s" : ""}`}
        </div>

        {/* Users list */}
        <div
          className="sidebar-users-list"
          role="list"
          aria-label="Contact list"
          aria-busy={loadingUsers}
        >
          {loadingUsers ? (
            <SkeletonUserList count={5} />
          ) : usersError ? (
            <div className="error-state">
              <div className="error-state-icon" aria-hidden="true">
                ⚠️
              </div>
              <div className="error-state-text">{usersError}</div>
              <button
                className="error-state-retry"
                onClick={loadUsers}
                type="button"
              >
                Retry
              </button>
            </div>
          ) : users.length === 0 ? (
            <div className="empty-users">
              <div
                aria-hidden="true"
                style={{ fontSize: "2rem", marginBottom: "0.5rem" }}
              >
                😶
              </div>
              No other users registered yet.
              <br />
              Invite someone to get chatting!
            </div>
          ) : (
            users.map((u) => (
              <UserListItem
                key={u.$id}
                user={u}
                isActive={selectedUser?.userId === u.userId}
                unreadCount={unreadCounts[u.userId] ?? 0}
                onClick={() => handleSelectUser(u)}
              />
            ))
          )}
        </div>

        {/* Logout */}
        <button
          id="logout-btn"
          className="logout-btn"
          onClick={handleLogout}
          disabled={loggingOut}
          aria-label="Sign out"
          type="button"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          {loggingOut ? "Signing out…" : "Sign out"}
        </button>
      </aside>

      {/* ── Main Chat Panel ── */}
      <main
        className={`chat-panel ${!mobileSidebarOpen ? "chat-panel--mobile-open" : "chat-panel--mobile-closed"}`}
        aria-label="Chat area"
      >
        {selectedUser ? (
          <ChatPanel
            key={selectedUser.userId}
            currentUser={user}
            otherUser={selectedUser}
            onBack={handleBackToSidebar}
          />
        ) : (
          <div className="no-conversation">
            <div className="no-conversation-icon" aria-hidden="true">
              💬
            </div>
            <div className="no-conversation-title">
              No conversation selected
            </div>
            <div className="no-conversation-text">
              Choose a contact from the sidebar to start a real-time
              conversation.
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
