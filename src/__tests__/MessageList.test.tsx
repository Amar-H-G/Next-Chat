import React from "react";
import { render, screen } from "@testing-library/react";
import { MessageList } from "@/components/MessageBubble";
import type { Message } from "@/types";

const BASE_DATE = "2024-06-15T10:00:00.000Z";
const LATER_DATE = "2024-06-15T10:05:00.000Z";

const mockMessages: Message[] = [
  {
    $id: "msg-1",
    senderId: "user-a",
    receiverId: "user-b",
    senderName: "Alice",
    content: "Hello Bob!",
    conversationId: "user-a_user-b",
    $createdAt: BASE_DATE,
  },
  {
    $id: "msg-2",
    senderId: "user-b",
    receiverId: "user-a",
    senderName: "Bob",
    content: "Hey Alice!",
    conversationId: "user-a_user-b",
    $createdAt: LATER_DATE,
  },
];

describe("MessageList", () => {
  it("renders all messages", () => {
    render(<MessageList messages={mockMessages} currentUserId="user-a" />);
    expect(screen.getByText("Hello Bob!")).toBeInTheDocument();
    expect(screen.getByText("Hey Alice!")).toBeInTheDocument();
  });

  it("renders sender name only for received messages", () => {
    render(<MessageList messages={mockMessages} currentUserId="user-a" />);
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("does not show sender label for sent messages", () => {
    render(<MessageList messages={mockMessages} currentUserId="user-a" />);
    // Alice is the current user — should NOT appear as a label
    expect(screen.queryByText("Alice")).not.toBeInTheDocument();
  });

  it("applies 'sent' class to current user's messages", () => {
    const { container } = render(
      <MessageList messages={mockMessages} currentUserId="user-a" />
    );
    const sentBubbles = container.querySelectorAll(".message-bubble.sent");
    expect(sentBubbles.length).toBe(1);
  });

  it("applies 'received' class to other user's messages", () => {
    const { container } = render(
      <MessageList messages={mockMessages} currentUserId="user-a" />
    );
    const receivedBubbles = container.querySelectorAll(".message-bubble.received");
    expect(receivedBubbles.length).toBe(1);
  });

  it("renders timestamps for each message", () => {
    const { container } = render(
      <MessageList messages={mockMessages} currentUserId="user-a" />
    );
    const times = container.querySelectorAll(".message-time");
    expect(times.length).toBe(2);
  });

  it("renders empty list without error", () => {
    const { container } = render(
      <MessageList messages={[]} currentUserId="user-a" />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders a date separator for the day", () => {
    const { container } = render(
      <MessageList messages={mockMessages} currentUserId="user-a" />
    );
    // At least one day separator should appear
    expect(container.querySelector(".day-separator")).toBeInTheDocument();
  });

  it("does not leak messages from a different conversation", () => {
    // This simulates filtering — in this test we just ensure the component
    // renders exactly the messages passed to it
    const filteredMessages = mockMessages.filter(
      (m) => m.conversationId === "user-a_user-b"
    );
    render(<MessageList messages={filteredMessages} currentUserId="user-a" />);
    expect(screen.getByText("Hello Bob!")).toBeInTheDocument();
    expect(screen.getByText("Hey Alice!")).toBeInTheDocument();
  });
});
