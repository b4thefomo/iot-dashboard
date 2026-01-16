"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FreezerReading } from "@/hooks/use-fleet-data";
import { Send, Bot, User, Loader2, Download, Share2, Bell, ClipboardList, FileText, Wrench, History, HelpCircle, Snowflake, Maximize2, X, MoreVertical, Save, FolderOpen, Trash2 } from "lucide-react";
import { Markdown } from "@/components/ui/markdown";

interface SuggestedAction {
  icon: string;
  label: string;
  action: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  suggestedActions?: SuggestedAction[];
}

interface SavedChat {
  id: string;
  title: string;
  messages: Message[];
  savedAt: string;
}

// Parse suggested actions from AI response
function parseSuggestedActions(content: string): { cleanContent: string; actions: SuggestedAction[] } {
  const actionPatterns: Record<string, string> = {
    "notify": "notify-team",
    "share": "share-report",
    "download csv": "download-csv",
    "csv": "download-csv",
    "pdf": "generate-pdf",
    "report": "generate-pdf",
    "action plan": "create-plan",
    "plan": "create-plan",
    "maintenance": "schedule-maintenance",
    "schedule": "schedule-maintenance",
    "alert": "set-alert",
    "threshold": "set-alert",
    "export": "export-data",
    "history": "review-history",
    "support": "contact-support",
    "contact": "contact-support",
    "dispatch": "dispatch-technician",
    "technician": "dispatch-technician",
    "defrost": "initiate-defrost",
  };

  const actions: SuggestedAction[] = [];
  let cleanContent = content;

  // Look for the suggested actions section
  const suggestedMatch = content.match(/---\s*\n\*\*Suggested Actions:\*\*\s*\n([\s\S]*?)$/i);

  if (suggestedMatch) {
    cleanContent = content.replace(suggestedMatch[0], "").trim();
    const actionLines = suggestedMatch[1].split("\n").filter(line => line.trim().startsWith("-"));

    for (const line of actionLines) {
      const cleanLine = line.replace(/^-\s*/, "").replace(/[\p{Emoji}]/gu, "").trim();
      const lowerLine = cleanLine.toLowerCase();

      for (const [keyword, actionType] of Object.entries(actionPatterns)) {
        if (lowerLine.includes(keyword)) {
          actions.push({
            icon: getActionIcon(actionType),
            label: cleanLine,
            action: actionType,
          });
          break;
        }
      }
    }
  }

  return { cleanContent, actions };
}

function getActionIcon(action: string): string {
  const icons: Record<string, string> = {
    "notify-team": "share",
    "share-report": "share",
    "download-csv": "download",
    "generate-pdf": "file",
    "create-plan": "clipboard",
    "schedule-maintenance": "wrench",
    "set-alert": "bell",
    "export-data": "download",
    "review-history": "history",
    "contact-support": "help",
    "dispatch-technician": "wrench",
    "initiate-defrost": "wrench",
  };
  return icons[action] || "clipboard";
}

interface FreezerChatProps {
  fleetStatus: Record<string, FreezerReading>;
}

const SAVED_CHATS_KEY = "subzero-saved-chats";

export function FreezerChat({ fleetStatus }: FreezerChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [savedChats, setSavedChats] = useState<SavedChat[]>([]);
  const [showSavedChats, setShowSavedChats] = useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Track when component is mounted for portal
  useEffect(() => {
    setMounted(true);
    // Load saved chats from localStorage
    const saved = localStorage.getItem(SAVED_CHATS_KEY);
    if (saved) {
      setSavedChats(JSON.parse(saved));
    }
  }, []);

  // Generate title from first user message
  const generateChatTitle = (msgs: Message[]): string => {
    const firstUserMsg = msgs.find((m) => m.role === "user");
    if (firstUserMsg) {
      const title = firstUserMsg.content.slice(0, 40);
      return title.length < firstUserMsg.content.length ? `${title}...` : title;
    }
    return `Analysis ${new Date().toLocaleDateString()}`;
  };

  // Save current chat
  const saveChat = () => {
    if (messages.length === 0) return;

    const newChat: SavedChat = {
      id: Date.now().toString(),
      title: generateChatTitle(messages),
      messages: messages,
      savedAt: new Date().toISOString(),
    };

    const updatedChats = [newChat, ...savedChats];
    setSavedChats(updatedChats);
    localStorage.setItem(SAVED_CHATS_KEY, JSON.stringify(updatedChats));
  };

  // Load a saved chat
  const loadChat = (chat: SavedChat) => {
    setMessages(chat.messages);
    setShowSavedChats(false);
  };

  // Delete a saved chat
  const deleteChat = (chatId: string) => {
    const updatedChats = savedChats.filter((c) => c.id !== chatId);
    setSavedChats(updatedChats);
    localStorage.setItem(SAVED_CHATS_KEY, JSON.stringify(updatedChats));
  };

  // Download chat as report
  const downloadAsReport = () => {
    if (messages.length === 0) return;

    const timestamp = new Date().toLocaleString();
    let reportContent = `SUBZERO FLEET COMMAND - AI ANALYSIS REPORT\n`;
    reportContent += `Generated: ${timestamp}\n`;
    reportContent += `${"=".repeat(50)}\n\n`;

    messages.forEach((msg) => {
      const role = msg.role === "user" ? "OPERATOR" : "AI ASSISTANT";
      reportContent += `[${role}]\n`;
      reportContent += `${msg.content}\n\n`;
      reportContent += `${"-".repeat(40)}\n\n`;
    });

    reportContent += `\n${"=".repeat(50)}\n`;
    reportContent += `End of Report\n`;

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

  // Start new chat
  const startNewChat = () => {
    setMessages([]);
    setShowSavedChats(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

      // Build conversation history for context
      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await fetch(`${apiUrl}/api/freezer/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          fleetStatus,
          conversationHistory,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      const { cleanContent, actions } = parseSuggestedActions(data.response);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: cleanContent, suggestedActions: actions.length > 0 ? actions : undefined },
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error analyzing the asset data. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-scroll to bottom when new messages arrive
  React.useEffect(() => {
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

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const handleAction = (action: string) => {
    switch (action) {
      case "download-csv":
        window.open(`${apiUrl}/api/fleet/export/csv`, "_blank");
        break;
      case "generate-pdf":
        window.open(`${apiUrl}/api/fleet/export/pdf`, "_blank");
        break;
      case "share-report":
      case "notify-team":
        alert("Report sharing feature coming soon! For now, download the PDF and share manually.");
        break;
      case "create-plan":
        setInput("Create a detailed action plan for addressing the current issues");
        break;
      case "schedule-maintenance":
        setInput("What maintenance should be scheduled based on current asset status?");
        break;
      case "set-alert":
        setInput("What alert thresholds would you recommend for the fleet?");
        break;
      case "review-history":
        setInput("Show me the historical trends and patterns for the fleet");
        break;
      case "contact-support":
        alert("Support: support@subzero-fleet.com | Emergency: 0800-SUBZERO");
        break;
      case "dispatch-technician":
        setInput("Which units need a technician dispatched and what should they check?");
        break;
      case "initiate-defrost":
        setInput("Which units need a defrost cycle initiated?");
        break;
      default:
        setInput(`Tell me more about: ${action}`);
    }
  };

  const ActionIcon = ({ type }: { type: string }) => {
    switch (type) {
      case "download": return <Download className="h-3 w-3" />;
      case "share": return <Share2 className="h-3 w-3" />;
      case "bell": return <Bell className="h-3 w-3" />;
      case "clipboard": return <ClipboardList className="h-3 w-3" />;
      case "file": return <FileText className="h-3 w-3" />;
      case "wrench": return <Wrench className="h-3 w-3" />;
      case "history": return <History className="h-3 w-3" />;
      case "help": return <HelpCircle className="h-3 w-3" />;
      default: return <ClipboardList className="h-3 w-3" />;
    }
  };

  const suggestedQuestions = [
    "What's the overall asset health?",
    "Which units need immediate attention?",
    "Are there any efficiency issues?",
    "Summarize current alerts",
  ];

  const chatContent = (
    <>
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Snowflake className="h-4 w-4 text-cyan-500" />
          <h3 className="font-semibold text-slate-900">Asset AI Assistant</h3>
        </div>
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={saveChat} disabled={messages.length === 0}>
                <Save className="h-4 w-4 mr-2" />
                Save Chat
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowSavedChats(true)}>
                <FolderOpen className="h-4 w-4 mr-2" />
                Load Saved Chat
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={downloadAsReport} disabled={messages.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                Download Report
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={startNewChat} disabled={messages.length === 0}>
                <Trash2 className="h-4 w-4 mr-2" />
                New Chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <X className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-4" ref={scrollRef}>
          {/* Saved Chats View */}
          {showSavedChats ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-slate-900">Saved Analyses</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSavedChats(false)}
                >
                  <X className="h-4 w-4 mr-1" />
                  Close
                </Button>
              </div>
              {savedChats.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No saved analyses yet</p>
                  <p className="text-xs text-slate-400">Save a chat to view it here later</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {savedChats.map((chat) => (
                    <div
                      key={chat.id}
                      className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors border"
                    >
                      <button
                        className="flex-1 text-left"
                        onClick={() => loadChat(chat)}
                      >
                        <div className="font-medium text-sm text-slate-900 truncate">
                          {chat.title}
                        </div>
                        <div className="text-xs text-slate-500">
                          {new Date(chat.savedAt).toLocaleString()} · {chat.messages.length} messages
                        </div>
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-rose-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteChat(chat.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground mb-4">
                Ask me about your freezer assets. I can analyze telemetry, identify issues, and provide recommendations.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {suggestedQuestions.map((question) => (
                  <Button
                    key={question}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      setInput(question);
                    }}
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div key={index} className="space-y-2">
                  <div
                    className={`flex gap-3 ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {message.role === "assistant" && (
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-blue-600" />
                      </div>
                    )}
                    <div
                      className={`px-4 py-2 max-w-[80%] ${
                        message.role === "user"
                          ? "bg-slate-900 text-white"
                          : "bg-muted"
                      }`}
                    >
                      {message.role === "assistant" ? (
                        <Markdown content={message.content} />
                      ) : (
                        <p className="text-sm">{message.content}</p>
                      )}
                    </div>
                    {message.role === "user" && (
                      <div className="flex-shrink-0 w-8 h-8 bg-slate-200 flex items-center justify-center">
                        <User className="h-4 w-4 text-slate-600" />
                      </div>
                    )}
                  </div>
                  {/* Suggested Actions */}
                  {message.role === "assistant" && message.suggestedActions && message.suggestedActions.length > 0 && (
                    <div className="flex flex-wrap gap-2 ml-11">
                      {message.suggestedActions.map((action, idx) => (
                        <Button
                          key={idx}
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs gap-1.5"
                          onClick={() => handleAction(action.action)}
                        >
                          <ActionIcon type={action.icon} />
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="bg-muted px-4 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Footer with Input */}
      <div className="px-4 py-3 border-t flex gap-2 flex-shrink-0">
        <Input
          placeholder="Ask about asset status, issues, or recommendations..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          className="flex-1"
        />
        <Button onClick={sendMessage} disabled={isLoading || !input.trim()}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </>
  );

  // Expanded modal view
  if (isExpanded) {
    return (
      <>
        {/* Inline placeholder */}
        <div className="flex flex-col h-[800px] bg-white border">
          <div className="px-4 py-3 border-b flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <Snowflake className="h-4 w-4 text-cyan-500" />
              <h3 className="font-semibold text-slate-900">Asset AI Assistant</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsExpanded(false)}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
            Chat expanded to modal
          </div>
        </div>

        {/* Modal overlay - rendered via portal to document body */}
        {mounted && createPortal(
          <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-6">
            <div className="bg-white w-full max-w-4xl h-[80vh] flex flex-col">
              {chatContent}
            </div>
          </div>,
          document.body
        )}
      </>
    );
  }

  // Default inline view
  return (
    <div className="flex flex-col h-[800px] bg-white border">
      {chatContent}
    </div>
  );
}
