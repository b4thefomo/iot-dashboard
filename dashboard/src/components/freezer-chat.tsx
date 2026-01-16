"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { FreezerReading } from "@/hooks/use-fleet-data";
import {
  Send,
  Bot,
  User,
  Loader2,
  Download,
  Mail,
  MessageSquare,
  Plus,
  Snowflake,
  X,
  Trash2,
  FileText,
  Share2,
  CheckCircle,
} from "lucide-react";
import { Markdown } from "@/components/ui/markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface SavedChat {
  id: string;
  title: string;
  messages: Message[];
  savedAt: string;
}

const SAVED_CHATS_KEY = "subzero-saved-chats";

// Group chats by date
function groupChatsByDate(chats: SavedChat[]): Record<string, SavedChat[]> {
  const groups: Record<string, SavedChat[]> = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  chats.forEach((chat) => {
    const chatDate = new Date(chat.savedAt);
    chatDate.setHours(0, 0, 0, 0);

    let groupKey: string;
    if (chatDate.getTime() === today.getTime()) {
      groupKey = "TODAY";
    } else if (chatDate.getTime() === yesterday.getTime()) {
      groupKey = "YESTERDAY";
    } else {
      groupKey = chatDate.toLocaleDateString("en-GB", {
        month: "short",
        day: "numeric",
      }).toUpperCase();
    }

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(chat);
  });

  return groups;
}

interface FreezerChatProps {
  fleetStatus: Record<string, FreezerReading>;
}

export function FreezerChat({ fleetStatus }: FreezerChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [savedChats, setSavedChats] = useState<SavedChat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Load saved chats on mount
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(SAVED_CHATS_KEY);
    if (saved) {
      setSavedChats(JSON.parse(saved));
    }
  }, []);

  // Auto-save current chat
  useEffect(() => {
    if (messages.length > 0) {
      const title = generateChatTitle(messages);

      if (currentChatId) {
        // Update existing chat
        const updatedChats = savedChats.map((chat) =>
          chat.id === currentChatId
            ? { ...chat, messages, title }
            : chat
        );
        setSavedChats(updatedChats);
        localStorage.setItem(SAVED_CHATS_KEY, JSON.stringify(updatedChats));
      } else {
        // Create new chat
        const newChat: SavedChat = {
          id: Date.now().toString(),
          title,
          messages,
          savedAt: new Date().toISOString(),
        };
        const updatedChats = [newChat, ...savedChats];
        setSavedChats(updatedChats);
        setCurrentChatId(newChat.id);
        localStorage.setItem(SAVED_CHATS_KEY, JSON.stringify(updatedChats));
      }
    }
  }, [messages]);

  // Generate title from first user message
  const generateChatTitle = (msgs: Message[]): string => {
    const firstUserMsg = msgs.find((m) => m.role === "user");
    if (firstUserMsg) {
      const title = firstUserMsg.content.slice(0, 30);
      return title.length < firstUserMsg.content.length ? `${title}...` : title;
    }
    return `Analysis ${new Date().toLocaleDateString()}`;
  };

  // Start new chat
  const startNewChat = () => {
    setMessages([]);
    setCurrentChatId(null);
  };

  // Load a saved chat
  const loadChat = (chat: SavedChat) => {
    setMessages(chat.messages);
    setCurrentChatId(chat.id);
  };

  // Delete a chat
  const deleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedChats = savedChats.filter((c) => c.id !== chatId);
    setSavedChats(updatedChats);
    localStorage.setItem(SAVED_CHATS_KEY, JSON.stringify(updatedChats));
    if (currentChatId === chatId) {
      startNewChat();
    }
  };

  // Download as report
  const downloadAsReport = () => {
    if (messages.length === 0) return;
    const timestamp = new Date().toLocaleString();
    let reportContent = `SUBZERO FLEET COMMAND - AI ANALYSIS REPORT\n`;
    reportContent += `Generated: ${timestamp}\n`;
    reportContent += `${"=".repeat(50)}\n\n`;
    messages.forEach((msg) => {
      const role = msg.role === "user" ? "OPERATOR" : "AI ASSISTANT";
      reportContent += `[${role}]\n${msg.content}\n\n${"-".repeat(40)}\n\n`;
    });
    reportContent += `\n${"=".repeat(50)}\nEnd of Report\n`;

    const blob = new Blob([reportContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fleet-analysis-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle email share
  const handleEmailShare = () => {
    setEmailSent(true);
    setTimeout(() => {
      setShowEmailModal(false);
      setEmailSent(false);
      setEmailAddress("");
    }, 2000);
  };

  // Send message
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await fetch(`${apiUrl}/api/freezer/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, fleetStatus, conversationHistory }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const data = await response.json();
      // Clean suggested actions from response (we'll add them as pills)
      const cleanContent = data.response.replace(/---\s*\n\*\*Suggested Actions:\*\*[\s\S]*$/i, "").trim();
      setMessages((prev) => [...prev, { role: "assistant", content: cleanContent }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I encountered an error. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const groupedChats = groupChatsByDate(savedChats);
  const groupOrder = ["TODAY", "YESTERDAY"];
  // Add other dates in order
  Object.keys(groupedChats)
    .filter((k) => !groupOrder.includes(k))
    .sort((a, b) => {
      const dateA = new Date(groupedChats[a][0].savedAt);
      const dateB = new Date(groupedChats[b][0].savedAt);
      return dateB.getTime() - dateA.getTime();
    })
    .forEach((k) => groupOrder.push(k));

  const suggestedQuestions = [
    "What's the overall asset health?",
    "Which units need attention?",
    "Show efficiency issues",
  ];

  // Chat sidebar
  const chatSidebar = (
    <div className="w-72 border-r bg-slate-50 flex flex-col h-full">
      {/* New Chat Button */}
      <div className="p-3">
        <Button
          onClick={startNewChat}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white gap-2"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      {/* Chat History */}
      <ScrollArea className="flex-1">
        <div className="px-3 pb-3">
          {groupOrder.map((group) => {
            const chats = groupedChats[group];
            if (!chats || chats.length === 0) return null;

            return (
              <div key={group} className="mb-4">
                <div className="text-xs font-semibold text-slate-400 mb-2 px-2">
                  {group}
                </div>
                <div className="space-y-1">
                  {chats.map((chat) => (
                    <button
                      key={chat.id}
                      onClick={() => loadChat(chat)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm rounded-lg transition-colors group ${
                        currentChatId === chat.id
                          ? "bg-slate-200 text-slate-900"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <MessageSquare className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate flex-1">{chat.title}</span>
                      <button
                        onClick={(e) => deleteChat(chat.id, e)}
                        className="opacity-0 group-hover:opacity-100 hover:text-rose-500 transition-opacity"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );

  // Main chat content
  const chatMain = (
    <div className="flex-1 flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Snowflake className="h-5 w-5 text-cyan-500" />
          <h3 className="font-semibold text-slate-900">Asset AI Assistant</h3>
        </div>
        <div className="flex items-center gap-2">
          {/* Action Pills */}
          {messages.length > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={() => setShowEmailModal(true)}
              >
                <Mail className="h-3.5 w-3.5" />
                Share via Email
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={downloadAsReport}
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsExpanded(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full" ref={scrollRef}>
          <div className="p-4 space-y-6">
            {messages.length === 0 ? (
              <div className="text-center py-16">
                <Bot className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                <h4 className="text-lg font-medium text-slate-700 mb-2">
                  How can I help you today?
                </h4>
                <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
                  Ask me about your freezer fleet. I can analyze telemetry, identify issues, and provide recommendations.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {suggestedQuestions.map((q) => (
                    <Button
                      key={q}
                      variant="outline"
                      size="sm"
                      onClick={() => setInput(q)}
                    >
                      {q}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div key={index} className="flex gap-3">
                  {message.role === "assistant" ? (
                    <>
                      <div className="flex-shrink-0 w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                        <Bot className="h-4 w-4 text-slate-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="bg-slate-50 rounded-2xl rounded-tl-none px-4 py-3 border-l-4 border-cyan-400">
                          <Markdown content={message.content} />
                        </div>
                        {/* Action pills after AI response */}
                        {index === messages.length - 1 && !isLoading && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs gap-1.5"
                              onClick={() => setShowEmailModal(true)}
                            >
                              <Mail className="h-3 w-3" />
                              Email Report
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs gap-1.5"
                              onClick={downloadAsReport}
                            >
                              <FileText className="h-3 w-3" />
                              Download PDF
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs gap-1.5"
                              onClick={() => setInput("Create an action plan for addressing these issues")}
                            >
                              <Share2 className="h-3 w-3" />
                              Create Action Plan
                            </Button>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex-1 flex justify-end">
                        <div className="bg-slate-900 text-white rounded-2xl rounded-tr-none px-4 py-3 max-w-[80%]">
                          <p className="text-sm">{message.content}</p>
                        </div>
                      </div>
                      <div className="flex-shrink-0 w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center">
                        <User className="h-4 w-4 text-slate-600" />
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                  <Bot className="h-4 w-4 text-slate-600" />
                </div>
                <div className="bg-slate-50 rounded-2xl rounded-tl-none px-4 py-3 border-l-4 border-cyan-400">
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            placeholder="Ask about asset status, issues, or recommendations..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="flex-1"
          />
          <Button onClick={sendMessage} disabled={isLoading || !input.trim()}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );

  // Email Share Modal
  const emailModal = (
    <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-cyan-500" />
            Share Analysis via Email
          </DialogTitle>
          <DialogDescription>
            Send this analysis report to a colleague or stakeholder.
          </DialogDescription>
        </DialogHeader>
        {emailSent ? (
          <div className="py-8 text-center">
            <CheckCircle className="h-12 w-12 text-teal-500 mx-auto mb-3" />
            <p className="font-medium text-slate-900">Email Sent Successfully!</p>
            <p className="text-sm text-slate-500 mt-1">
              The report has been sent to {emailAddress}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                  Recipient Email
                </label>
                <Input
                  type="email"
                  placeholder="colleague@company.com"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                />
              </div>
              <div className="bg-slate-50 rounded-lg p-3 border">
                <p className="text-xs text-slate-500 mb-1">Preview</p>
                <p className="text-sm font-medium text-slate-700">
                  Subzero Fleet Analysis Report
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {messages.length} messages · Generated {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEmailModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleEmailShare}
                disabled={!emailAddress.includes("@")}
                className="bg-slate-900 hover:bg-slate-800"
              >
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );

  // Compact view (not expanded)
  if (!isExpanded) {
    return (
      <div className="flex flex-col h-[500px] bg-white border">
        {/* Compact Header */}
        <div className="px-4 py-3 border-b flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <Snowflake className="h-4 w-4 text-cyan-500" />
            <h3 className="font-semibold text-slate-900">Asset AI Assistant</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(true)}
            className="text-xs"
          >
            Expand
          </Button>
        </div>

        {/* Compact Messages */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full p-4" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <Bot className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                <p className="text-sm text-slate-500 mb-4">
                  Ask me about your fleet
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {suggestedQuestions.slice(0, 2).map((q) => (
                    <Button key={q} variant="outline" size="sm" className="text-xs" onClick={() => setInput(q)}>
                      {q}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.role === "assistant" && (
                      <div className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center flex-shrink-0">
                        <Bot className="h-3 w-3 text-slate-600" />
                      </div>
                    )}
                    <div
                      className={`px-3 py-2 max-w-[85%] text-sm ${
                        message.role === "user"
                          ? "bg-slate-900 text-white rounded-xl rounded-tr-none"
                          : "bg-slate-50 rounded-xl rounded-tl-none"
                      }`}
                    >
                      {message.role === "assistant" ? (
                        <Markdown content={message.content} />
                      ) : (
                        <p>{message.content}</p>
                      )}
                    </div>
                    {message.role === "user" && (
                      <div className="w-6 h-6 bg-slate-200 rounded flex items-center justify-center flex-shrink-0">
                        <User className="h-3 w-3 text-slate-600" />
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-2">
                    <div className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center">
                      <Bot className="h-3 w-3 text-slate-600" />
                    </div>
                    <div className="bg-slate-50 rounded-xl rounded-tl-none px-3 py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Compact Input */}
        <div className="px-4 py-3 border-t flex gap-2">
          <Input
            placeholder="Ask a question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="flex-1 text-sm"
          />
          <Button size="sm" onClick={sendMessage} disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Expanded view with sidebar
  return (
    <>
      {/* Placeholder in original position */}
      <div className="flex flex-col h-[500px] bg-white border">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Snowflake className="h-4 w-4 text-cyan-500" />
            <h3 className="font-semibold text-slate-900">Asset AI Assistant</h3>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
          Chat expanded to fullscreen
        </div>
      </div>

      {/* Fullscreen Modal */}
      {mounted &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-5xl h-[85vh] rounded-lg overflow-hidden flex shadow-2xl">
              {chatSidebar}
              {chatMain}
            </div>
          </div>,
          document.body
        )}

      {emailModal}
    </>
  );
}
