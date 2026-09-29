"use client";

import { getAvatarGradient, getInitials } from "@/utils/avatar";
import type { UserProfile } from "@/types";

interface UserListItemProps {
  user: UserProfile;
  isActive: boolean;
  unreadCount: number;
  onClick: () => void;
}

export function UserListItem({
  user,
  isActive,
  unreadCount,
  onClick,
}: UserListItemProps) {
  const gradient = getAvatarGradient(user.name);
  const initials = getInitials(user.name);

  return (
    <div
      className={`user-list-item ${isActive ? "active" : ""}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
      aria-label={`Open conversation with ${user.name}${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
      aria-current={isActive ? "true" : undefined}
      aria-pressed={isActive}
    >
      <div className="user-list-avatar-wrap">
        <div className={`avatar ${gradient}`} aria-hidden="true">
          {initials}
        </div>
        <span
          className="online-dot"
          aria-label="Online"
          role="status"
          title="Online"
        />
      </div>
      <div className="user-item-info">
        <div className="user-item-name">{user.name}</div>
        <div className="user-item-email">{user.email}</div>
      </div>
      {unreadCount > 0 && (
        <div
          className="unread-badge"
          aria-label={`${unreadCount} unread messages`}
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </div>
      )}
    </div>
  );
}
