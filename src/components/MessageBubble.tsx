"use client";

import { format, isToday, isYesterday } from "date-fns";
import type { Message } from "@/types";

interface MessageBubbleProps {
  message: Message;
  isSent: boolean;
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return format(date, "h:mm a");
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMMM d, yyyy");
}

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
}

export function MessageList({ messages, currentUserId }: MessageListProps) {
  let lastDate = "";

  return (
    <>
      {messages.map((msg) => {
        const dateLabel = formatDate(msg.$createdAt);
        const showDate = dateLabel !== lastDate;
        lastDate = dateLabel;
        const isSent = msg.senderId === currentUserId;

        return (
          <div key={msg.$id}>
            {showDate && (
              <div className="day-separator">
                <div className="day-separator-line" />
                <span className="day-separator-text">{dateLabel}</span>
                <div className="day-separator-line" />
              </div>
            )}
            <MessageBubble message={msg} isSent={isSent} />
          </div>
        );
      })}
    </>
  );
}

export function MessageBubble({ message, isSent }: MessageBubbleProps) {
  return (
    <div
      className={`message-group ${isSent ? "sent" : "received"} message-appear`}
    >
      {!isSent && (
        <div className="message-sender-label">{message.senderName}</div>
      )}
      <div className={`message-bubble ${isSent ? "sent" : "received"}`}>
        {message.content}
      </div>
      <div className={`message-time ${isSent ? "sent" : ""}`}>
        {formatTime(message.$createdAt)}
      </div>
    </div>
  );
}
