'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { chatbotApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import {
  Bot,
  X,
  Send,
  MessageSquare,
  Sparkles,
  ThermometerSun,
  Wrench,
  Zap,
  Loader2,
  ChevronDown,
} from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const suggestions = [
  { icon: Wrench, text: 'How do I reset my AC unit?' },
  { icon: ThermometerSun, text: 'My AC is not cooling properly' },
  { icon: Zap, text: 'Energy saving tips' },
];

export default function ChatbotWidget() {
  const { isAuthenticated, isLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  // Lock body scroll on mobile when chat is open
  useEffect(() => {
    if (isOpen) {
      const isMobile = window.innerWidth < 640;
      if (isMobile) {
        document.body.style.overflow = 'hidden';
      }
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMessage: Message = { role: 'user', content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        content: m.content,
      }));

      const response = await chatbotApi.sendMessage({
        message: trimmed,
        sessionId: sessionId || undefined,
        history,
      });

      const { reply, sessionId: newSessionId } = response.data;
      if (newSessionId) setSessionId(newSessionId);
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestion = async (text: string) => {
    if (loading) return;
    const userMessage: Message = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await chatbotApi.sendMessage({
        message: text,
        sessionId: sessionId || undefined,
        history: [],
      });

      const { reply, sessionId: newSessionId } = response.data;
      if (newSessionId) setSessionId(newSessionId);
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMessage = (text: string): string => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(
        /`(.*?)`/g,
        '<code class="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>'
      )
      .replace(
        /^### (.+)$/gm,
        '<h3 class="text-sm font-bold text-slate-800 mt-3 mb-1">$1</h3>'
      )
      .replace(
        /^## (.+)$/gm,
        '<h2 class="text-sm font-bold text-slate-800 mt-3 mb-1">$1</h2>'
      )
      .replace(
        /^[-•] (.+)$/gm,
        '<div class="flex gap-2 items-start ml-1 my-0.5"><span class="text-sky-500 mt-1 text-[8px]">●</span><span>$1</span></div>'
      )
      .replace(
        /^\d+\.\s(.+)$/gm,
        '<div class="flex gap-2 items-start ml-1 my-0.5"><span class="text-sky-500 font-medium text-xs min-w-[16px]">$&</span></div>'
      )
      .replace(/\n{2,}/g, '<div class="h-2"></div>')
      .replace(/\n/g, '<br/>');
  };

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* ── Floating Action Button ── */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 z-50 group"
          title="HVAC Support Chat"
        >
          <div
            className="relative w-14 h-14 rounded-2xl shadow-lg shadow-sky-900/20 flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-sky-900/30"
            style={{
              background: 'linear-gradient(135deg, #0c5a8a 0%, #063c5c 100%)',
            }}
          >
            <MessageSquare className="w-6 h-6 text-white" strokeWidth={2} />
            {/* Pulse indicator */}
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-400 border-2 border-white" />
            </span>
          </div>
        </button>
      )}

      {/* ── Chat Window ── */}
      {isOpen && (
        <div
          className={`
            fixed z-50 flex flex-col bg-white
            /* Mobile: full screen */
            inset-0
            /* Desktop: floating popup */
            sm:inset-auto sm:bottom-5 sm:right-5
            sm:w-[400px] sm:h-[600px] sm:max-h-[80vh]
            sm:rounded-2xl sm:shadow-2xl sm:shadow-slate-900/15
            sm:border sm:border-slate-200/80
            transition-all duration-300 animate-in
          `}
          style={{
            animationName: 'slideUp',
            animationDuration: '0.3s',
            animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* ── Header ── */}
          <div
            className="relative flex items-center gap-3 px-4 py-3.5 sm:rounded-t-2xl shrink-0"
            style={{
              background: 'linear-gradient(135deg, #0c5a8a 0%, #063c5c 100%)',
            }}
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm">
              <Bot className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-white font-semibold text-[15px] leading-tight">
                HVAC Support
              </h2>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="Close chat"
            >
              {/* Show down-chevron on desktop (minimize), X on mobile (close full-screen) */}
              <ChevronDown className="w-5 h-5 text-white hidden sm:block" />
              <X className="w-5 h-5 text-white sm:hidden" />
            </button>
          </div>

          {/* ── Messages Area ── */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gradient-to-b from-slate-50/80 to-white overscroll-contain">
            {/* Welcome State */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center text-center pt-6 pb-2">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                  style={{
                    background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
                  }}
                >
                  <Bot className="w-7 h-7 text-sky-600" />
                </div>
                <h3 className="text-slate-800 font-semibold text-base">
                  HVAC AI Support Assistant
                </h3>
                <p className="text-slate-500 text-sm mt-1.5 max-w-[280px] leading-relaxed">
                  Hi! I can help with AC control, troubleshooting, maintenance, and
                  more.
                </p>

                {/* Suggestion Chips */}
                <div className="w-full mt-6 space-y-2">
                  {suggestions.map(({ icon: Icon, text }) => (
                    <button
                      key={text}
                      onClick={() => handleSuggestion(text)}
                      className="flex items-center gap-3 w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-left text-sm text-slate-700 hover:border-sky-300 hover:bg-sky-50/50 transition-all duration-200 group"
                    >
                      <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-sky-100 transition-colors shrink-0">
                        <Icon className="w-4 h-4 text-slate-500 group-hover:text-sky-600 transition-colors" />
                      </span>
                      <span className="leading-snug">{text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message Bubbles */}
            {messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={index}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'} gap-2`}
                >
                  {/* Assistant avatar */}
                  {!isUser && (
                    <div className="flex items-end shrink-0">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{
                          background:
                            'linear-gradient(135deg, #0c5a8a 0%, #063c5c 100%)',
                        }}
                      >
                        <Bot className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>
                  )}

                  <div
                    className={`
                      max-w-[78%] px-3.5 py-2.5 text-[14px] leading-relaxed
                      ${
                        isUser
                          ? 'bg-gradient-to-br from-sky-600 to-sky-700 text-white rounded-2xl rounded-br-md'
                          : 'bg-white border border-slate-200/80 text-slate-700 rounded-2xl rounded-bl-md shadow-sm'
                      }
                    `}
                  >
                    {isUser ? (
                      <span>{msg.content}</span>
                    ) : (
                      <div
                        className="assistant-msg prose-sm [&_strong]:text-slate-900 [&_code]:break-all"
                        dangerouslySetInnerHTML={{
                          __html: formatMessage(msg.content),
                        }}
                      />
                    )}
                  </div>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {loading && (
              <div className="flex items-end gap-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    background:
                      'linear-gradient(135deg, #0c5a8a 0%, #063c5c 100%)',
                  }}
                >
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full bg-slate-400 animate-bounce"
                      style={{ animationDelay: '0ms' }}
                    />
                    <span
                      className="w-2 h-2 rounded-full bg-slate-400 animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    />
                    <span
                      className="w-2 h-2 rounded-full bg-slate-400 animate-bounce"
                      style={{ animationDelay: '300ms' }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ── Input Area ── */}
          <div className="shrink-0 border-t border-slate-100 bg-white px-3 py-3 sm:rounded-b-2xl">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                disabled={loading}
                className="flex-1 resize-none px-4 py-2.5 m-2 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 disabled:opacity-50 disabled:bg-slate-100 transition-all max-h-[120px] leading-relaxed"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background:
                    input.trim() && !loading
                      ? 'linear-gradient(135deg, #0c5a8a 0%, #063c5c 100%)'
                      : '#e2e8f0',
                }}
                aria-label="Send message"
              >
                {loading ? (
                  <Loader2 className="w-4.5 h-4.5 text-white animate-spin" />
                ) : (
                  <Send
                    className={`w-4.5 h-4.5 ${
                      input.trim() ? 'text-white' : 'text-slate-400'
                    }`}
                    strokeWidth={2}
                  />
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 text-center mt-2">
              Powered by HVAC AI &middot; Responses may vary
            </p>
          </div>
        </div>
      )}

      {/* ── Keyframes ── */}
      <style jsx global>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* Mobile full-screen override */
        @media (max-width: 639px) {
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(100%);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        }

        .assistant-msg a {
          color: #0284c7;
          text-decoration: underline;
          text-underline-offset: 2px;
        }

        .assistant-msg a:hover {
          color: #0369a1;
        }
      `}</style>
    </>
  );
}