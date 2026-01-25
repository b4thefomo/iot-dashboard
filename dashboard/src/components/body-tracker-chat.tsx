"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BodyTrackerReading } from "@/hooks/use-body-tracker-data";
import {
  Send,
  Bot,
  User,
  Loader2,
  Heart,
} from "lucide-react";
import { Markdown } from "@/components/ui/markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface BodyTrackerChatProps {
  latest: BodyTrackerReading | null;
  history: BodyTrackerReading[];
}

export function BodyTrackerChat({ latest, history }: BodyTrackerChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const suggestedQuestions = [
    "How's my running form?",
    "What zone should I train in?",
    "Am I recovered enough?",
    "Analyze my HRV",
  ];

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

      const response = await fetch(`${apiUrl}/api/body-tracker/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, conversationHistory }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const data = await response.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
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

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center gap-2 flex-shrink-0">
        <Heart className="h-5 w-5 text-rose-500" />
        <h3 className="font-semibold text-slate-900">Fitness Coach</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <Bot className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p className="text-sm text-slate-500 mb-4">
                Ask about your workout
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {suggestedQuestions.map((q) => (
                  <Button
                    key={q}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => setInput(q)}
                  >
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
                    <div className="w-7 h-7 bg-rose-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-rose-600" />
                    </div>
                  )}
                  <div
                    className={`px-3 py-2 max-w-[85%] text-sm ${
                      message.role === "user"
                        ? "bg-slate-900 text-white rounded-xl rounded-tr-none"
                        : "bg-slate-50 rounded-xl rounded-tl-none border"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <Markdown content={message.content} />
                    ) : (
                      <p>{message.content}</p>
                    )}
                  </div>
                  {message.role === "user" && (
                    <div className="w-7 h-7 bg-slate-200 rounded-lg flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-slate-600" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-2">
                  <div className="w-7 h-7 bg-rose-100 rounded-lg flex items-center justify-center">
                    <Bot className="h-4 w-4 text-rose-600" />
                  </div>
                  <div className="bg-slate-50 rounded-xl rounded-tl-none px-3 py-2 border">
                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t flex gap-2">
        <Input
          placeholder="Ask about your workout..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          className="flex-1 text-sm"
        />
        <Button size="sm" onClick={sendMessage} disabled={isLoading || !input.trim()}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
