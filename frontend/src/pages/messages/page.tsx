import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/pages/home/components/Navbar";
import Footer from "@/pages/home/components/Footer";
import {
  chatService,
  formatChatTime,
  formatMessageClockTime,
  type ChatConversation,
  type ChatMessage,
} from "@/api-services/chat.service";
import { logger } from "@/lib/logger";

export default function MessagesPage() {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "unread">("all");
  const [inputText, setInputText] = useState("");
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");

  // Report Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("spam");
  const [reportDescription, setReportDescription] = useState("");
  const [reportSuccess, setReportSuccess] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // New Chat Modal State
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [newRecipientName, setNewRecipientName] = useState("");
  const [newInitialMessage, setNewInitialMessage] = useState("");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Load conversations on mount
  useEffect(() => {
    let mounted = true;
    async function loadConversations() {
      setIsLoadingConversations(true);
      try {
        const data = await chatService.getConversations();
        if (mounted) {
          setConversations(data);
          if (data.length > 0) {
            setActiveConvId((prev) => prev || data[0].id);
          }
        }
      } catch (err) {
        logger.error("Failed to load conversations:", err);
      } finally {
        if (mounted) {
          setIsLoadingConversations(false);
        }
      }
    }
    loadConversations();
    return () => {
      mounted = false;
    };
  }, []);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeConvId) return;

    const conversationId = activeConvId;
    let mounted = true;
    async function loadMessages() {
      setIsLoadingMessages(true);
      try {
        const data = await chatService.getMessages(conversationId);
        if (mounted) {
          setMessages(data.messages);
          // Mark conversation as read locally and via API
          try {
            await chatService.markAsRead(conversationId);
          } catch (readErr) {
            logger.warn("Failed to mark conversation as read on backend:", readErr);
          }
          setConversations((prev) =>
            prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c))
          );
        }
      } catch (err) {
        logger.error("Failed to load messages:", err);
      } finally {
        if (mounted) {
          setIsLoadingMessages(false);
        }
      }
    }
    loadMessages();
    return () => {
      mounted = false;
    };
  }, [activeConvId]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const activeConversation = conversations.find((c) => c.id === activeConvId);

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    const matchesSearch =
      c.participant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.propertyName && c.propertyName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.lastMessage?.content &&
        c.lastMessage.content.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (filterType === "unread") return c.unreadCount > 0;
    return true;
  });

  // Handle select conversation
  const handleSelectConversation = (id: string) => {
    setActiveConvId(id);
    setMobileView("chat");
  };

  // Handle send message with optimistic update and failure rollback / retry support
  const handleSendMessage = async (e?: React.FormEvent, retryMessage?: ChatMessage) => {
    if (e) e.preventDefault();
    const messageContent = retryMessage ? retryMessage.content : inputText.trim();
    if (!messageContent || !activeConvId || isSending) return;

    if (!retryMessage) {
      setInputText("");
    }
    setIsSending(true);

    // Optimistic UI message
    const tempId = retryMessage ? retryMessage.id : `msg-optimistic-${Date.now()}`;
    const optimisticMessage: ChatMessage = {
      id: tempId,
      conversationId: activeConvId,
      senderId: "me",
      senderName: "You",
      content: messageContent,
      isRead: false,
      createdAt: retryMessage ? retryMessage.createdAt : new Date().toISOString(),
      isOutgoing: true,
      status: "sending",
    };

    if (retryMessage) {
      setMessages((prev) => prev.map((m) => (m.id === tempId ? optimisticMessage : m)));
    } else {
      setMessages((prev) => [...prev, optimisticMessage]);
    }

    const previousConversations = conversations;
    // Update conversation last message in list
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConvId
          ? {
              ...c,
              lastMessage: {
                content: messageContent,
                createdAt: optimisticMessage.createdAt,
                senderId: "me",
                isRead: false,
              },
              updatedAt: optimisticMessage.createdAt,
            }
          : c
      )
    );

    try {
      const deliveredMessage = await chatService.sendMessage(activeConvId, messageContent);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId
            ? { ...deliveredMessage, isOutgoing: true, status: "delivered" }
            : m
        )
      );
    } catch (err) {
      logger.error("Failed to send message:", err);
      // Mark optimistic message as failed and rollback conversation preview
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, status: "failed" } : m))
      );
      setConversations(previousConversations);
    } finally {
      setIsSending(false);
    }
  };

  // Handle report chat submit
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConversation) return;

    setIsSubmittingReport(true);
    try {
      await chatService.reportChat({
        reportedId: activeConversation.participant.id,
        conversationId: activeConversation.id,
        reason: reportReason,
        description: reportDescription,
      });
      setReportSuccess(true);
      setTimeout(() => {
        setIsReportModalOpen(false);
        setReportSuccess(false);
        setReportDescription("");
      }, 1500);
    } catch (err) {
      logger.error("Failed to report chat:", err);
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Handle create new conversation
  const handleCreateNewChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecipientName.trim() || !newInitialMessage.trim()) return;

    try {
      const created = await chatService.createConversation({
        recipientId: `user-${Date.now()}`,
        initialMessage: newInitialMessage.trim(),
      });
      created.participant.name = newRecipientName.trim();

      setConversations((prev) => [created, ...prev]);
      setActiveConvId(created.id);
      setIsNewChatModalOpen(false);
      setNewRecipientName("");
      setNewInitialMessage("");
      setMobileView("chat");
    } catch (err) {
      logger.error("Failed to create new conversation:", err);
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background-50 flex flex-col">
        {/* Hero Header */}
        <section className="relative w-full h-[180px] md:h-[220px] overflow-hidden shrink-0">
          <img
            src="https://readdy.ai/api/search-image?query=Abstract%20warm%20Mediterranean%20gradient%20background%20with%20soft%20golden%20amber%20tones%20gentle%20light%20textures%20minimalist%20composition%20serene%20atmosphere&width=1800&height=560&seq=messages-hero-01&orientation=landscape"
            alt="Messages"
            className="absolute inset-0 w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-foreground-950/60 via-foreground-950/40 to-foreground-950/75"></div>

          <div className="absolute bottom-0 left-0 right-0 w-full px-4 md:px-8 lg:px-12 pb-6 md:pb-8">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Link
                    to="/"
                    className="text-white/70 hover:text-white text-xs md:text-sm transition-colors underline underline-offset-2"
                  >
                    Home
                  </Link>
                  <i className="ri-arrow-right-s-line text-white/40 text-xs md:text-sm"></i>
                  <span className="text-white/95 text-xs md:text-sm font-medium">Messages</span>
                </div>
                <h1 className="font-heading text-2xl md:text-3xl text-white mb-1">Messages & Chat</h1>
                <p className="text-white/75 text-xs md:text-sm">
                  Direct communication with property hosts, organizers, and local guides.
                </p>
              </div>

              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                <span>Live Messenger</span>
              </div>
            </div>
          </div>
        </section>

        {/* Main Messenger Container */}
        <section className="w-full px-3 md:px-8 lg:px-12 py-4 md:py-8 flex-1 max-w-7xl mx-auto flex flex-col">
          <div className="bg-white rounded-2xl border border-background-200/80 shadow-sm overflow-hidden flex-1 flex flex-col md:flex-row h-[700px] max-h-[calc(100vh-280px)] min-h-[520px]">
            {/* LEFT PANE: Conversation List */}
            <div
              className={`w-full md:w-80 lg:w-96 border-r border-background-100 flex flex-col bg-white shrink-0 ${
                mobileView === "chat" ? "hidden md:flex" : "flex"
              }`}
            >
              {/* Left Pane Header */}
              <div className="p-4 border-b border-background-100">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-foreground-900 text-base flex items-center gap-2">
                    <span>Chats</span>
                    <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-medium">
                      {conversations.length}
                    </span>
                  </h2>
                  <button
                    onClick={() => setIsNewChatModalOpen(true)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors cursor-pointer"
                    title="Start new conversation"
                    aria-label="Start new conversation"
                  >
                    <i className="ri-edit-line text-sm"></i>
                  </button>
                </div>

                {/* Search Input */}
                <div className="relative mb-3">
                  <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400 text-sm"></i>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search conversations..."
                    className="w-full pl-9 pr-3 py-2 text-xs md:text-sm rounded-xl bg-background-50 border border-background-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-foreground-900 placeholder:text-foreground-400"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-400 hover:text-foreground-600 text-xs"
                      aria-label="Clear search"
                    >
                      <i className="ri-close-line"></i>
                    </button>
                  )}
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilterType("all")}
                    className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                      filterType === "all"
                        ? "bg-primary-500 text-white shadow-sm"
                        : "bg-background-100 text-foreground-600 hover:bg-background-200"
                    }`}
                  >
                    All Messages
                  </button>
                  <button
                    onClick={() => setFilterType("unread")}
                    className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                      filterType === "unread"
                        ? "bg-primary-500 text-white shadow-sm"
                        : "bg-background-100 text-foreground-600 hover:bg-background-200"
                    }`}
                  >
                    <span>Unread</span>
                    {conversations.filter((c) => c.unreadCount > 0).length > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-300"></span>
                    )}
                  </button>
                </div>
              </div>

              {/* Conversations List Scrollable */}
              <div className="flex-1 overflow-y-auto divide-y divide-background-50">
                {isLoadingConversations ? (
                  <div className="p-8 text-center text-foreground-400 text-sm">
                    <i className="ri-loader-4-line animate-spin text-2xl text-primary-500 mb-2 block"></i>
                    Loading messages...
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="p-8 text-center text-foreground-400 text-xs md:text-sm">
                    <i className="ri-chat-search-line text-3xl mb-2 text-foreground-300 block"></i>
                    {searchQuery ? "No conversations matching search." : "No messages yet."}
                  </div>
                ) : (
                  filteredConversations.map((conv) => {
                    const isSelected = conv.id === activeConvId;
                    return (
                      <div
                        key={conv.id}
                        onClick={() => handleSelectConversation(conv.id)}
                        className={`flex items-start gap-3 p-3.5 transition-all cursor-pointer select-none relative ${
                          isSelected
                            ? "bg-primary-50/70 border-l-4 border-primary-500 pl-2.5"
                            : "hover:bg-background-50/80"
                        }`}
                      >
                        {/* Avatar with status indicator */}
                        <div className="relative shrink-0">
                          <img
                            src={conv.participant.avatar}
                            alt={conv.participant.name}
                            className="w-11 h-11 rounded-full object-cover bg-background-200 border border-background-200"
                            loading="lazy"
                          />
                          {conv.participant.online && (
                            <span
                              className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-white"
                              title="Online"
                            ></span>
                          )}
                        </div>

                        {/* Thread Preview */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <h3
                              className={`text-xs md:text-sm truncate ${
                                conv.unreadCount > 0 || isSelected
                                  ? "font-semibold text-foreground-900"
                                  : "font-medium text-foreground-700"
                              }`}
                            >
                              {conv.participant.name}
                            </h3>
                            <span className="text-[11px] text-foreground-400 shrink-0 ml-2">
                              {formatChatTime(conv.lastMessage?.createdAt || conv.updatedAt)}
                            </span>
                          </div>

                          {conv.propertyName && (
                            <div className="flex items-center gap-1 text-[11px] text-primary-700 mb-0.5 truncate font-medium">
                              <i className="ri-home-4-line text-[10px]"></i>
                              <span className="truncate">{conv.propertyName}</span>
                            </div>
                          )}

                          <p
                            className={`text-xs truncate ${
                              conv.unreadCount > 0
                                ? "text-foreground-800 font-medium"
                                : "text-foreground-500"
                            }`}
                          >
                            {conv.lastMessage?.content || "No messages yet"}
                          </p>
                        </div>

                        {/* Unread badge */}
                        {conv.unreadCount > 0 && (
                          <div className="shrink-0 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary-500 text-white text-[10px] font-bold">
                            {conv.unreadCount}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* RIGHT PANE: Active Chat Thread */}
            <div
              className={`flex-1 flex flex-col bg-background-50/40 min-w-0 ${
                mobileView === "list" ? "hidden md:flex" : "flex"
              }`}
            >
              {activeConversation ? (
                <>
                  {/* Active Chat Top Bar */}
                  <div className="px-4 py-3 bg-white border-b border-background-100 flex items-center justify-between shrink-0 shadow-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Mobile Back Button */}
                      <button
                        onClick={() => setMobileView("list")}
                        className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-background-100 text-foreground-600 cursor-pointer"
                        title="Back to conversations"
                        aria-label="Back to conversations"
                      >
                        <i className="ri-arrow-left-line text-lg"></i>
                      </button>

                      {/* Participant Avatar */}
                      <div className="relative shrink-0">
                        <img
                          src={activeConversation.participant.avatar}
                          alt={activeConversation.participant.name}
                          className="w-10 h-10 rounded-full object-cover bg-background-200 border border-background-200"
                        />
                        {activeConversation.participant.online && (
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white"></span>
                        )}
                      </div>

                      {/* Participant Info */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground-900 text-sm md:text-base truncate">
                            {activeConversation.participant.name}
                          </h3>
                          {activeConversation.participant.role && (
                            <span className="text-[10px] bg-background-100 text-foreground-600 px-1.5 py-0.5 rounded-md font-medium shrink-0">
                              {activeConversation.participant.role}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-foreground-400 truncate">
                          {activeConversation.participant.online
                            ? "Active now"
                            : activeConversation.participant.lastSeen || "Offline"}
                          {activeConversation.propertyName && ` • ${activeConversation.propertyName}`}
                        </p>
                      </div>
                    </div>

                    {/* Chat Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setIsReportModalOpen(true)}
                        className="p-2 text-foreground-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer text-sm"
                        title="Report Conversation"
                        aria-label="Report Conversation"
                      >
                        <i className="ri-flag-line"></i>
                      </button>
                    </div>
                  </div>

                  {/* Messages Bubble Area */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-4">
                    {isLoadingMessages ? (
                      <div className="h-full flex items-center justify-center text-foreground-400 text-sm">
                        <i className="ri-loader-4-line animate-spin text-2xl text-primary-500 mr-2"></i>
                        Loading messages...
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-foreground-400 text-center p-6">
                        <i className="ri-chat-smile-3-line text-4xl text-foreground-300 mb-2"></i>
                        <p className="text-sm font-medium text-foreground-700">No messages yet</p>
                        <p className="text-xs text-foreground-400 mt-1">
                          Say hello to start the conversation with {activeConversation.participant.name}!
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="text-center my-2">
                          <span className="text-[10px] font-medium bg-background-200/70 text-foreground-500 px-3 py-1 rounded-full uppercase tracking-wider">
                            Direct Message Thread
                          </span>
                        </div>

                        {messages.map((msg) => {
                          const isOutgoing =
                            msg.isOutgoing ||
                            msg.senderId === "me" ||
                            msg.senderId === "my-user-id";

                          return (
                            <div
                              key={msg.id}
                              className={`flex items-end gap-2.5 ${
                                isOutgoing ? "justify-end" : "justify-start"
                              }`}
                            >
                              {!isOutgoing && (
                                <img
                                  src={
                                    msg.senderAvatar || activeConversation.participant.avatar
                                  }
                                  alt={msg.senderName || activeConversation.participant.name}
                                  className="w-7 h-7 rounded-full object-cover shrink-0 mb-1 border border-background-200"
                                />
                              )}

                              <div
                                className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-2.5 text-xs md:text-sm shadow-xs ${
                                  isOutgoing
                                    ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-br-xs"
                                    : "bg-white text-foreground-900 border border-background-200/80 rounded-bl-xs"
                                }`}
                              >
                                <p className="leading-relaxed whitespace-pre-wrap break-words">
                                  {msg.content}
                                </p>
                                <div
                                  className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                                    isOutgoing ? "text-white/80" : "text-foreground-400"
                                  }`}
                                >
                                  <span>{formatMessageClockTime(msg.createdAt)}</span>
                                  {isOutgoing && (
                                    <i
                                      className={`text-xs ${
                                        msg.isRead
                                          ? "ri-check-double-line text-white"
                                          : "ri-check-line text-white/70"
                                      }`}
                                    ></i>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </>
                    )}
                  </div>

                  {/* Message Composer Area */}
                  <div className="p-3 md:p-4 bg-white border-t border-background-100 shrink-0">
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          placeholder={`Message ${activeConversation.participant.name}...`}
                          className="w-full pl-4 pr-10 py-2.5 text-xs md:text-sm rounded-xl bg-background-50 border border-background-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-foreground-900 placeholder:text-foreground-400"
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-400 hover:text-foreground-600 text-base cursor-pointer"
                          title="Attach image"
                          aria-label="Attach image"
                        >
                          <i className="ri-image-line"></i>
                        </button>
                      </div>

                      <button
                        type="submit"
                        disabled={!inputText.trim() || isSending}
                        className={`h-10 px-4 rounded-xl flex items-center justify-center gap-1.5 text-xs md:text-sm font-medium transition-all cursor-pointer shrink-0 ${
                          inputText.trim() && !isSending
                            ? "bg-primary-500 text-white hover:bg-primary-600 shadow-sm"
                            : "bg-background-200 text-foreground-400 cursor-not-allowed"
                        }`}
                        title="Send message"
                        aria-label="Send message"
                      >
                        {isSending ? (
                          <i className="ri-loader-4-line animate-spin text-base"></i>
                        ) : (
                          <>
                            <span className="hidden sm:inline">Send</span>
                            <i className="ri-send-plane-2-fill text-sm"></i>
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                /* Empty Chat state (No active conversation) */
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-primary-50 text-primary-500 flex items-center justify-center text-3xl mb-3">
                    <i className="ri-chat-smile-2-line"></i>
                  </div>
                  <h3 className="font-semibold text-foreground-800 text-base mb-1">
                    Select a conversation
                  </h3>
                  <p className="text-xs text-foreground-500 max-w-sm mb-4">
                    Choose an existing conversation from the list or start a new message with a host.
                  </p>
                  <button
                    onClick={() => setIsNewChatModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-primary-500 text-white text-xs font-medium hover:bg-primary-600 transition-colors shadow-sm cursor-pointer"
                  >
                    Start New Conversation
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Report Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground-950/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-background-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-red-600">
                <i className="ri-flag-line text-lg"></i>
                <h3 className="font-semibold text-foreground-900 text-base">Report Conversation</h3>
              </div>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="text-foreground-400 hover:text-foreground-600 p-1 rounded-lg"
                aria-label="Close modal"
              >
                <i className="ri-close-line text-lg"></i>
              </button>
            </div>

            {reportSuccess ? (
              <div className="py-6 text-center text-green-600">
                <i className="ri-checkbox-circle-line text-4xl mb-2 block"></i>
                <p className="font-medium text-sm">Report submitted successfully.</p>
                <p className="text-xs text-foreground-500 mt-1">
                  Our moderation team will review this conversation.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReport}>
                <p className="text-xs text-foreground-600 mb-3">
                  Please let us know why you are reporting this conversation with{" "}
                  <strong>{activeConversation?.participant.name}</strong>.
                </p>

                <div className="space-y-2 mb-4">
                  {[
                    { id: "spam", label: "Spam or unwanted advertising" },
                    { id: "harassment", label: "Harassment or inappropriate behavior" },
                    { id: "fraud", label: "Suspected scam or payment violation" },
                    { id: "other", label: "Other issue" },
                  ].map((option) => (
                    <label
                      key={option.id}
                      className="flex items-center gap-2 text-xs text-foreground-800 p-2 rounded-lg hover:bg-background-50 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="reportReason"
                        value={option.id}
                        checked={reportReason === option.id}
                        onChange={(e) => setReportReason(e.target.value)}
                        className="text-primary-500 focus:ring-primary-400"
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-medium text-foreground-700 mb-1">
                    Additional Details (optional)
                  </label>
                  <textarea
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    rows={3}
                    placeholder="Provide any additional context..."
                    className="w-full p-2.5 text-xs rounded-xl bg-background-50 border border-background-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  ></textarea>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsReportModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-foreground-600 hover:bg-background-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReport}
                    className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {isSubmittingReport ? "Submitting..." : "Submit Report"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* New Chat Modal */}
      {isNewChatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground-950/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-background-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground-900 text-base flex items-center gap-2">
                <i className="ri-mail-send-line text-primary-500"></i>
                <span>New Conversation</span>
              </h3>
              <button
                onClick={() => setIsNewChatModalOpen(false)}
                className="text-foreground-400 hover:text-foreground-600 p-1 rounded-lg"
                aria-label="Close modal"
              >
                <i className="ri-close-line text-lg"></i>
              </button>
            </div>

            <form onSubmit={handleCreateNewChat}>
              <div className="mb-3">
                <label className="block text-xs font-medium text-foreground-700 mb-1">
                  Recipient Name / Host
                </label>
                <input
                  type="text"
                  value={newRecipientName}
                  onChange={(e) => setNewRecipientName(e.target.value)}
                  placeholder="e.g. Alanya Villa Support or Host Name"
                  required
                  className="w-full px-3 py-2 text-xs md:text-sm rounded-xl bg-background-50 border border-background-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-xs font-medium text-foreground-700 mb-1">
                  Initial Message
                </label>
                <textarea
                  value={newInitialMessage}
                  onChange={(e) => setNewInitialMessage(e.target.value)}
                  rows={3}
                  placeholder="Type your first inquiry or greeting..."
                  required
                  className="w-full p-2.5 text-xs md:text-sm rounded-xl bg-background-50 border border-background-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewChatModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-foreground-600 hover:bg-background-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newRecipientName.trim() || !newInitialMessage.trim()}
                  className="px-4 py-2 rounded-xl bg-primary-500 text-white text-xs font-medium hover:bg-primary-600 transition-colors shadow-sm disabled:opacity-50"
                >
                  Start Chat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}