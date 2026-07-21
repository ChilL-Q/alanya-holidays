import React, { useEffect, useState, useRef } from "react";
import { useChat } from '../hooks/useChat';
import { useAuth } from "../../../context/AuthContext";
import { ChatMessage } from "../../../types/models";
import { chatService } from "../api";

// Subcomponents
import { ChatHeader } from "./subcomponents/ChatHeader";
import { MessageList } from "./subcomponents/MessageList";
import { MessageInput } from "./subcomponents/MessageInput";
import { ReportModal } from "./subcomponents/ReportModal";

interface ChatWindowProps {
  className?: string;
  embedded?: boolean;
  autoScroll?: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  className = "",
  embedded = false,
  autoScroll = true,
}) => {
  const {
    activeConversationId,
    setActiveConversationId,
    sendMessage,
    conversations,
    clearHistory,
  } = useChat();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isReportOpen, setIsReportOpen] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId,
  );

  const otherPerson = activeConversation
    ? user?.id === activeConversation.guest_id
      ? activeConversation.host
      : activeConversation.guest
    : null;

  useEffect(() => {
    let isMounted = true;

    const fetchMessages = async () => {
      if (!activeConversationId) return;

      try {
        const data = await chatService.getMessages(activeConversationId);
        if (isMounted) {
          setMessages((prev) => {
            if (
              prev.length === data.length &&
              prev[prev.length - 1]?.id === data[data.length - 1]?.id
            ) {
              return prev;
            }
            return data;
          });
        }
      } catch (err) {
        console.error(err);
        // If unauthorized, go back to inbox view
        if (
          err instanceof Error &&
          err.message.toLowerCase().includes("authorized")
        ) {
          setActiveConversationId(null);
        }
      }
    };

    fetchMessages();

    const channel = chatService.subscribeToMessages(
      activeConversationId,
      (newMsg) => {
        if (isMounted) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;

            // Deduplication logic: Check if we have a matching optimistic message
            const tempMatchIndex = prev.findIndex(
              (m) =>
                m.id.startsWith("temp-") &&
                m.content === newMsg.content &&
                m.sender_id === newMsg.sender_id,
            );

            if (tempMatchIndex !== -1) {
              // Replace the temp message with the real one immediately
              const newMessages = [...prev];
              newMessages[tempMatchIndex] = newMsg;
              return newMessages;
            }

            return [...prev, newMsg];
          });
        }
      },
    );

    return () => {
      isMounted = false;
      channel.unsubscribe();
    };
  }, [activeConversationId, setActiveConversationId]);

  useEffect(() => {
    if (autoScroll && messagesContainerRef.current) {
      const { scrollHeight } = messagesContainerRef.current;
      messagesContainerRef.current.scrollTo({
        top: scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages.length, activeConversationId, autoScroll]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const content = inputText;
    const tempId = "temp-" + Date.now();
    setInputText("");

    if (user && activeConversationId) {
      const optimisticMsg: ChatMessage = {
        id: tempId,
        conversation_id: activeConversationId,
        sender_id: user.id,
        content: content,
        is_read: false,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimisticMsg]);
    }

    try {
      const realMsg = await sendMessage(content);
      if (realMsg) {
        setMessages((prev) => {
          // Check if realtime subscription already added the message
          if (prev.some((m) => m.id === realMsg.id)) {
            return prev.filter((m) => m.id !== tempId);
          }
          return prev.map((m) => (m.id === tempId ? realMsg : m));
        });
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setInputText(content);
    }
  };

  if (!activeConversationId) return null;

  const reportedId =
    user?.id === activeConversation?.host_id
      ? activeConversation?.guest_id
      : activeConversation?.host_id;

  return (
    <div
      className={`flex flex-col bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 shadow-2xl overflow-hidden ${embedded ? "rounded-none border-0 shadow-none h-full" : "fixed top-72px bottom-0 left-0 right-0 sm:top-28 sm:bottom-6 sm:right-6 sm:left-auto sm:w-400px rounded-t-3xl sm:rounded-3xl z-50"} ${className} font-sans`}
    >
      <ChatHeader
        otherPerson={otherPerson}
        activeConversation={activeConversation}
        activeConversationId={activeConversationId}
        setActiveConversationId={setActiveConversationId}
        embedded={embedded}
        onClearHistory={async () => {
          await clearHistory(activeConversationId);
          setMessages([]);
        }}
        onReportIssue={() => setIsReportOpen(true)}
      />

      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        conversationId={activeConversationId}
        reportedId={reportedId || ""}
      />

      <MessageList
        messages={messages}
        currentUser={user}
        otherPerson={otherPerson}
        embedded={embedded}
        containerRef={messagesContainerRef}
      />

      <MessageInput
        inputText={inputText}
        setInputText={setInputText}
        onSend={handleSend}
        embedded={embedded}
      />
    </div>
  );
};
