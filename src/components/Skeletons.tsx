"use client";

/** Skeleton for a single user row in the sidebar */
function SkeletonUserRow() {
  return (
    <div className="skeleton-user-row" aria-hidden="true">
      <div className="skeleton skeleton-avatar" />
      <div className="skeleton-user-text">
        <div className="skeleton skeleton-name" />
        <div className="skeleton skeleton-email" />
      </div>
    </div>
  );
}

/** Skeleton list for the sidebar user list */
export function SkeletonUserList({ count = 5 }: { count?: number }) {
  return (
    <div aria-label="Loading contacts…" role="status">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonUserRow key={i} />
      ))}
    </div>
  );
}

/** Skeleton for the message area */
export function SkeletonMessages() {
  return (
    <div
      className="chat-messages"
      aria-label="Loading messages…"
      role="status"
    >
      {[70, 45, 80, 35, 60].map((width, i) => (
        <div
          key={i}
          className={`skeleton-message-row ${i % 2 === 0 ? "skeleton-message-row--sent" : ""}`}
          aria-hidden="true"
        >
          <div
            className="skeleton skeleton-bubble"
            style={{ width: `${width}%` }}
          />
        </div>
      ))}
    </div>
  );
}
