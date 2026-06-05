import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bot,
  Send,
  Mic,
  MicOff,
  BookOpen,
  ExternalLink,
  Sparkles,
  AlertCircle,
  X,
  RotateCcw,
  ChevronDown,
} from 'lucide-react';
import { citizenApi } from '../services/citizenApi';
import { ChatMessage } from '../../shared/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function formatTime(ts: string): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ─── Starter Prompts ──────────────────────────────────────────────────────────

const STARTER_PROMPTS = [
  { label: '🌊 Flood safety', text: 'What should I do if I am trapped in a flood?' },
  { label: '🔥 Fire evacuation', text: 'What is the safe evacuation procedure during a building fire?' },
  { label: '🏥 First aid', text: 'How do I provide basic first aid to an injured person?' },
  { label: '📍 Nearest help', text: 'How can I find the nearest emergency shelter or hospital?' },
];

// ─── Typing Indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 max-w-[70%]">
      {/* Avatar */}
      <div className="w-7 h-7 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center shrink-0 mb-0.5">
        <Bot className="w-3.5 h-3.5 text-green-400" />
      </div>
      {/* Bubble */}
      <div className="bg-[#111827] border border-gray-800 rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex items-center gap-1.5 h-4">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-gray-500"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg }: { key?: React.Key; msg: ChatMessage }) {
  const isUser = msg.sender === 'user';

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20, y: 4 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        className="flex justify-end"
      >
        <div className="max-w-[75%]">
          <div className="bg-green-600/30 border border-green-500/40 rounded-2xl rounded-br-sm px-4 py-3">
            <p className="text-sm text-gray-100 leading-relaxed whitespace-pre-wrap">{msg.message}</p>
          </div>
          <p className="text-[10px] text-gray-600 font-mono mt-1 text-right">
            {formatTime(msg.timestamp)}
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20, y: 4 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      className="flex items-end gap-2"
    >
      {/* Bot Avatar */}
      <div className="w-7 h-7 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center shrink-0 mb-0.5">
        <Bot className="w-3.5 h-3.5 text-green-400" />
      </div>

      <div className="max-w-[75%]">
        {/* Message Bubble */}
        <div className="bg-[#111827] border border-gray-800 rounded-2xl rounded-bl-sm px-4 py-3">
          <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{msg.message}</p>
        </div>

        {/* Source Citations */}
        {msg.contextSources && msg.contextSources.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {msg.contextSources.map((src, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 text-[10px] font-mono bg-gray-800 border border-gray-700 text-gray-500 px-2 py-1 rounded-full"
              >
                <BookOpen className="w-2.5 h-2.5" />
                {src.length > 40 ? src.slice(0, 40) + '…' : src}
                <ExternalLink className="w-2.5 h-2.5 opacity-50" />
              </span>
            ))}
          </div>
        )}

        <p className="text-[10px] text-gray-600 font-mono mt-1">
          {formatTime(msg.timestamp)}
        </p>
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CitizenChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState('');
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  // ── Auto-scroll to bottom ─────────────────────────────────────────────────
  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // ── Show scroll-to-bottom button when user scrolls up ────────────────────
  const handleScroll = () => {
    const el = scrollAreaRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBtn(distFromBottom > 100);
  };

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      const userMsg: ChatMessage = {
        id: generateId(),
        sender: 'user',
        message: trimmed,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setIsLoading(true);
      setError('');

      try {
        const result = await citizenApi.sendCitizenChat(trimmed);
        const assistantMsg: ChatMessage = {
          id: generateId(),
          sender: 'assistant',
          message: result.response,
          timestamp: new Date().toISOString(),
          contextSources: result.sources,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to get a response. Try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading]
  );

  // ── Handle Enter key (Shift+Enter for newline) ────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // ── Auto-resize textarea ──────────────────────────────────────────────────
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  // ── Voice Input ───────────────────────────────────────────────────────────
  const toggleVoice = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRec = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;

    if (!SpeechRec) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rec = new SpeechRec();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript as string;
      setInput((prev) => (prev ? prev + ' ' + transcript : transcript));
      inputRef.current?.focus();
    };

    rec.onerror = () => setIsListening(false);
    rec.onend = () => setIsListening(false);

    recognitionRef.current = rec;
    rec.start();
    setIsListening(true);
  }, [isListening]);

  // ── Clear conversation ────────────────────────────────────────────────────
  const clearChat = () => {
    setMessages([]);
    setError('');
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto pb-4 flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 shrink-0"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-green-500/10 border border-green-500/30 flex items-center justify-center">
              <Bot className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <h2 className="text-base font-mono font-bold text-white tracking-widest uppercase leading-tight">
                Emergency AI Assistant
              </h2>
              <p className="text-[10px] text-gray-500 font-mono">
                Powered by PanicSense · Ask anything about emergency safety
              </p>
            </div>
          </div>

          {messages.length > 0 && (
            <button
              type="button"
              id="clear-chat-btn"
              onClick={clearChat}
              className="flex items-center gap-1.5 text-[10px] font-mono text-gray-500 hover:text-red-400 border border-gray-700 hover:border-red-500/40 px-2.5 py-1.5 rounded-lg transition"
            >
              <RotateCcw className="w-3 h-3" /> CLEAR
            </button>
          )}
        </div>
      </motion.div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col min-h-0 bg-[#111827] border border-gray-800 rounded-2xl overflow-hidden">

        {/* Messages Area */}
        <div
          ref={scrollAreaRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth"
        >
          {/* Empty state */}
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full text-center gap-5 py-8"
            >
              <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-green-400" />
              </div>
              <div>
                <h3 className="text-base font-mono font-bold text-white mb-1">
                  How can I help you?
                </h3>
                <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
                  I'm your AI emergency assistant. Ask me about safety procedures, evacuation
                  routes, first aid, or emergency contacts.
                </p>
              </div>

              {/* Starter Prompts */}
              <div className="grid grid-cols-2 gap-2 w-full max-w-md">
                {STARTER_PROMPTS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => sendMessage(p.text)}
                    disabled={isLoading}
                    className="text-left text-xs font-mono bg-[#0B1220] border border-gray-700 hover:border-green-500/40 hover:bg-green-500/5 text-gray-400 hover:text-gray-200 rounded-xl px-3 py-3 transition disabled:opacity-40"
                  >
                    <span className="block text-sm mb-0.5">{p.label}</span>
                    <span className="text-[10px] text-gray-600 line-clamp-2">{p.text}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Message List */}
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}

          {/* Typing Indicator */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                key="typing"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <TypingIndicator />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>

        {/* Scroll to bottom button */}
        <AnimatePresence>
          {showScrollBtn && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => scrollToBottom()}
              className="absolute bottom-20 right-6 w-8 h-8 bg-green-600 hover:bg-green-500 rounded-full flex items-center justify-center shadow-lg transition z-10"
            >
              <ChevronDown className="w-4 h-4 text-white" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Error Banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mx-4 mb-2 flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2"
            >
              <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <p className="text-xs text-red-300 font-mono flex-1">{error}</p>
              <button type="button" onClick={() => setError('')}>
                <X className="w-3.5 h-3.5 text-red-400 hover:text-red-200" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Bar */}
        <div className="border-t border-gray-800 p-3">
          <div className="flex items-end gap-2">
            {/* Voice Button */}
            <button
              id="chat-voice-btn"
              type="button"
              onClick={toggleVoice}
              className={`w-9 h-9 flex items-center justify-center rounded-xl border transition shrink-0 ${isListening
                ? 'bg-red-500/20 border-red-500/50 text-red-400 animate-pulse'
                : 'bg-[#0B1220] border-gray-700 text-gray-500 hover:border-green-500/40 hover:text-green-400'
                }`}
              title={isListening ? 'Stop recording' : 'Voice input'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Textarea */}
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                id="chat-input"
                rows={1}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={
                  isListening ? 'Listening…' : 'Ask about evacuation, first aid, safety tips…'
                }
                disabled={isLoading}
                className="w-full bg-[#0B1220] border border-gray-700 text-white text-sm rounded-xl px-4 py-2.5 pr-4 placeholder:text-gray-600 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/20 transition resize-none leading-relaxed disabled:opacity-50"
                style={{ maxHeight: '120px', overflowY: 'auto' }}
              />
            </div>

            {/* Send Button */}
            <motion.button
              id="chat-send-btn"
              type="button"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 text-white transition shrink-0"
            >
              <Send className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Mic status indicator */}
          {isListening && (
            <div className="mt-2 flex items-center gap-2 text-[10px] text-red-400 font-mono px-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
              Recording — speak your question clearly
            </div>
          )}

          {/* Character hint */}
          <p className="text-[9px] text-gray-700 font-mono mt-1.5 px-1">
            Press <kbd className="bg-gray-800 border border-gray-700 rounded px-1">Enter</kbd> to send ·{' '}
            <kbd className="bg-gray-800 border border-gray-700 rounded px-1">Shift+Enter</kbd> for new line
          </p>
        </div>
      </div>
    </div>
  );
}
