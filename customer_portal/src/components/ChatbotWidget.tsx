'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { chatbotApi } from '@/lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    } catch (err) {
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
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' },
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

  const formatMessage = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-200 px-1 rounded text-sm">$1</code>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <>
      {/* Floating Robot Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
        style={{ backgroundColor: '#094166' }}
        title="HVAC Support Chat"
      >
        {isOpen ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Robot head */}
            <rect x="5" y="8" width="14" height="10" rx="2" />
            {/* Antenna */}
            <line x1="12" y1="8" x2="12" y2="4" />
            <circle cx="12" cy="3" r="1" />
            {/* Eyes */}
            <circle cx="9" cy="13" r="1" fill="white" />
            <circle cx="15" cy="13" r="1" fill="white" />
            {/* Ears */}
            <line x1="5" y1="11" x2="3" y2="11" />
            <line x1="5" y1="15" x2="3" y2="15" />
            <line x1="19" y1="11" x2="21" y2="11" />
            <line x1="19" y1="15" x2="21" y2="15" />
            {/* Mouth */}
            <path d="M9 16h6" />
          </svg>
        )}
      </button>

      {/* Chat Popup Window */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 z-50 w-96 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{
            height: '520px',
            maxHeight: 'calc(100vh - 140px)',
            border: '1px solid #e5e7eb',
          }}
        >
          {/* Header */}
          <div
            className="px-5 py-4 flex items-center space-x-3"
            style={{ backgroundColor: '#094166' }}
          >
            <div className="w-9 h-9 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="5" y="8" width="14" height="10" rx="2" />
                <line x1="12" y1="8" x2="12" y2="4" />
                <circle cx="12" cy="3" r="1" />
                <circle cx="9" cy="13" r="1" fill="white" />
                <circle cx="15" cy="13" r="1" fill="white" />
                <path d="M9 16h6" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold text-sm">HVAC Support</h3>
              <p className="text-white text-xs opacity-75">Online - Ready to help</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white opacity-75 hover:opacity-100 transition-opacity"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3"
                  style={{ backgroundColor: '#094166' }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="5" y="8" width="14" height="10" rx="2" />
                    <line x1="12" y1="8" x2="12" y2="4" />
                    <circle cx="12" cy="3" r="1" />
                    <circle cx="9" cy="13" r="1" fill="white" />
                    <circle cx="15" cy="13" r="1" fill="white" />
                    <path d="M9 16h6" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-700 mb-1">HVAC Support Assistant</h4>
                <p className="text-sm text-gray-500 px-4">
                  Hi! I can help you with AC control, HVAC troubleshooting, maintenance advice, and
                  more. How can I assist you?
                </p>
                <div className="mt-4 space-y-2">
                  {[
                    'How do I reset my AC unit?',
                    'My AC is not cooling properly',
                    'Energy saving tips',
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleSuggestion(suggestion)}
                      className="block w-full text-left px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'text-white rounded-br-md'
                      : 'bg-white text-gray-800 rounded-bl-md shadow-sm border border-gray-100'
                  }`}
                  style={msg.role === 'user' ? { backgroundColor: '#094166' } : undefined}
                  dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                />
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-md shadow-sm border border-gray-100">
                  <div className="flex space-x-1.5">
                    <div
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{ backgroundColor: '#094166', animationDelay: '0ms' }}
                    ></div>
                    <div
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{ backgroundColor: '#094166', animationDelay: '150ms' }}
                    ></div>
                    <div
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{ backgroundColor: '#094166', animationDelay: '300ms' }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 border-t bg-white">
            <div className="flex items-center space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                disabled={loading}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50"
                style={{ focusRingColor: '#094166' }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-opacity disabled:opacity-40"
                style={{ backgroundColor: '#094166' }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
