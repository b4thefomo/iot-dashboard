"use client";

import * as React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, Bot, User, Loader2, Cpu, Download, Share2, Bell, ClipboardList, FileText, Wrench, History, HelpCircle } from "lucide-react";
import { API_URL } from "@/lib/socket";
import { Markdown } from "@/components/ui/markdown";

interface SuggestedAction {
  icon: string;
  label: string;
  action: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  suggestedActions?: SuggestedAction[];
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
      const cleanLine = line.replace(/^-\s*/, "").replace(/[^\x00-\x7F]/g, "").trim();
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

export function UnifiedChat() {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/unified-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userMessage.content }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const { cleanContent, actions } = parseSuggestedActions(data.response);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: cleanContent,
        timestamp: new Date(),
        suggestedActions: actions.length > 0 ? actions : undefined,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I couldn't process your request. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleAction = (action: string) => {
    switch (action) {
      case "download-csv":
        window.open(`${API_URL}/api/fleet/export/csv`, "_blank");
        break;
      case "generate-pdf":
        window.open(`${API_URL}/api/fleet/export/pdf`, "_blank");
        break;
      case "share-report":
      case "notify-team":
        // Could integrate with email/Slack in the future
        alert("Report sharing feature coming soon! For now, download the PDF and share manually.");
        break;
      case "create-plan":
        setInput("Create a detailed action plan for addressing the current issues");
        break;
      case "schedule-maintenance":
        setInput("What maintenance should be scheduled based on current fleet status?");
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

  return (
    <Card className="flex flex-col h-[450px] sm:h-[400px] lg:h-[450px]">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Cpu className="h-5 w-5" />
          Unified AI Assistant
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Ask about weather, car data, or correlations between both
        </p>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4 pb-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <p>Ask me anything about your IoT systems!</p>
                <p className="text-sm mt-2">
                  Try: &quot;What&apos;s the status of all systems?&quot; or &quot;Is it safe to drive fast in this weather?&quot;
                </p>
              </div>
            )}
            {messages.map((message) => (
              <div key={message.id} className="space-y-2">
                <div
                  className={`flex gap-3 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <Avatar className="h-6 w-6 sm:h-8 sm:w-8 shrink-0">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <Bot className="h-3 w-3 sm:h-4 sm:w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={` px-3 py-1.5 sm:px-4 sm:py-2 max-w-[90%] sm:max-w-[80%] ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <Markdown content={message.content} />
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>
                  {message.role === "user" && (
                    <Avatar className="h-6 w-6 sm:h-8 sm:w-8 shrink-0">
                      <AvatarFallback>
                        <User className="h-3 w-3 sm:h-4 sm:w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
                {/* Suggested Actions */}
                {message.role === "assistant" && message.suggestedActions && message.suggestedActions.length > 0 && (
                  <div className="flex flex-wrap gap-2 ml-9 sm:ml-11">
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
              <div className="flex gap-3 justify-start">
                <Avatar className="h-6 w-6 sm:h-8 sm:w-8 shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot className="h-3 w-3 sm:h-4 sm:w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className=" px-3 py-1.5 sm:px-4 sm:py-2 bg-muted">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              placeholder="Ask about all your sensors..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
            <Button onClick={sendMessage} disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
