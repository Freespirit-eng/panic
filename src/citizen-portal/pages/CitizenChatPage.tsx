import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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
  Search,
  Cpu,
  Layers,
  Terminal,
  Book,
} from 'lucide-react';
import { io } from 'socket.io-client';
import { citizenApi } from '../services/citizenApi';
import { ChatMessage, KnowledgeArticle, Volunteer } from '../../shared/types';
import { knowledgeBase } from '../../ai-engine/data/knowledgeBase';
import { useToast } from '../components/ToastProvider';

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
      <div className="w-7 h-7 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center shrink-0 mb-0.5">
        <Bot className="w-3.5 h-3.5 text-green-400" />
      </div>
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

function MessageBubble({
  msg,
  onSelectCitation,
}: {
  key?: React.Key;
  msg: ChatMessage;
  onSelectCitation: (sourceStr: string) => void;
}) {
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
      <div className="w-7 h-7 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center shrink-0 mb-0.5">
        <Bot className="w-3.5 h-3.5 text-green-400" />
      </div>

      <div className="max-w-[75%]">
        <div className="bg-[#111827] border border-gray-800 rounded-2xl rounded-bl-sm px-4 py-3">
          <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{msg.message}</p>
        </div>

        {msg.contextSources && msg.contextSources.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {msg.contextSources.map((src, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onSelectCitation(src)}
                className="inline-flex items-center gap-1.5 text-[10px] font-mono bg-[#0f1d14] hover:bg-[#163520] border border-green-800/40 hover:border-green-500/60 text-green-400 hover:text-green-300 px-2.5 py-1 rounded-full cursor-pointer transition shadow-[0_0_8px_rgba(34,197,94,0.05)]"
              >
                <BookOpen className="w-2.5 h-2.5 text-green-500" />
                {src.length > 35 ? src.slice(0, 35) + '…' : src}
                <ExternalLink className="w-2.5 h-2.5 opacity-60" />
              </button>
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

// ─── RAG Inspector Modal ──────────────────────────────────────────────────────

interface RagInspectorProps {
  article: KnowledgeArticle;
  onClose: () => void;
}

function RagInspector({ article, onClose }: RagInspectorProps) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-[#070e0a] border border-green-900/60 rounded-2xl w-full max-w-xl max-h-[85vh] overflow-hidden shadow-[0_0_50px_rgba(34,197,94,0.15)] flex flex-col font-mono text-xs"
      >
        {/* Header */}
        <div className="p-4 border-b border-green-900/20 bg-[#040a06] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_#22c55e] animate-pulse" />
            <span className="text-gray-300 font-bold tracking-widest text-[10px] uppercase flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-green-400" /> RAG SOURCE INSPECTOR
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Metadata */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">ARTICLE: {article.id}</span>
              <span className="bg-green-950/60 border border-green-800 text-green-400 px-2.5 py-0.5 rounded-full text-[9px] font-bold">
                {article.category}
              </span>
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">{article.title}</h3>
          </div>

          {/* Diagnostic Info */}
          <div className="bg-green-950/10 border border-green-900/30 rounded-xl p-4 space-y-3">
            <h4 className="text-[10px] text-green-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
              <Terminal className="w-3 h-3" /> Retrieval Diagnostics
            </h4>
            <div className="grid grid-cols-2 gap-3 text-[10px] text-gray-400">
              <div className="border border-green-900/10 bg-[#050c07]/50 p-2 rounded-lg">
                <p className="text-gray-600 mb-0.5">MATCH METHOD</p>
                <p className="font-bold text-white uppercase">Vector Search</p>
              </div>
              <div className="border border-green-900/10 bg-[#050c07]/50 p-2 rounded-lg">
                <p className="text-gray-600 mb-0.5">RELEVANCE METRIC</p>
                <p className="font-bold text-green-400">Cosine Similarity</p>
              </div>
              <div className="border border-green-900/10 bg-[#050c07]/50 p-2 rounded-lg">
                <p className="text-gray-600 mb-0.5">EMBEDDING MODEL</p>
                <p className="font-bold text-white">text-embedding-004</p>
              </div>
              <div className="border border-green-900/10 bg-[#050c07]/50 p-2 rounded-lg">
                <p className="text-gray-600 mb-0.5">RETRIEVAL WEIGHT</p>
                <p className="font-bold text-green-400">Grounded (80%+ Similarity)</p>
              </div>
            </div>
            <p className="text-[10px] text-gray-500 leading-relaxed pt-1">
              RAG (Retrieval-Augmented Generation) matches user queries against this knowledge corpus. This text is passed directly into the LLM context pool, ensuring responses are mathematically grounded in verified guidelines rather than model hallucinations.
            </p>
          </div>

          {/* Document Content */}
          <div className="space-y-2">
            <h4 className="text-[10px] text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-green-500" /> Grounding Source Content
            </h4>
            <div className="bg-[#050a06] border border-green-900/20 rounded-xl p-4 text-[11px] text-gray-300 leading-relaxed font-sans whitespace-pre-wrap max-h-60 overflow-y-auto select-text">
              {article.content}
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {article.tags.map((tag) => (
              <span key={tag} className="bg-green-950/20 border border-green-900/30 text-green-400 px-2 py-0.5 rounded text-[9px]">
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-green-900/20 bg-[#040a06] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="bg-green-700 hover:bg-green-600 text-white font-bold px-4 py-2 rounded-xl transition cursor-pointer"
          >
            DISMISS INSPECTOR
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CitizenChatPage() {
  const [activeTab, setActiveTab] = useState<'chat' | 'knowledge'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState('');
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  // Knowledge Base tab states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // RAG Inspector state
  const [activeInspectorArticle, setActiveInspectorArticle] = useState<KnowledgeArticle | null>(null);

  // Live reported incident tracking states
  const [reportedIncidentId, setReportedIncidentId] = useState<string | null>(
    () => localStorage.getItem('panicsense_reported_incident_id')
  );
  const [reportedIncident, setReportedIncident] = useState<any>(null);
  const [incidentMission, setIncidentMission] = useState<any>(null);
  const [assignedVolunteer, setAssignedVolunteer] = useState<Volunteer | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);

  const prevAssignedVolId = useRef<string | null>(null);
  const prevMissionStatus = useRef<string | null>(null);
  const toast = useToast();

  const fetchIncidentStatus = useCallback(async (incId: string) => {
    try {
      const incidents = await citizenApi.getAllIncidents();
      const inc = incidents.find((i) => i.id === incId);
      if (inc) {
        setReportedIncident(inc);

        const volunteersList = await citizenApi.getAllVolunteers();
        const assignedVol = volunteersList.find((v) =>
          v.receivedAlerts?.some((a) => a.incidentId === incId)
        );
        setAssignedVolunteer(assignedVol || null);

        const missionsList = await citizenApi.getAllMissions();
        const mission = missionsList.find((m) => m.incidentId === incId);
        setIncidentMission(mission || null);
      } else {
        setReportedIncident(null);
        setAssignedVolunteer(null);
        setIncidentMission(null);
      }
    } catch (err) {
      console.error('Failed to fetch reported incident status:', err);
    }
  }, []);

  useEffect(() => {
    if (reportedIncidentId) {
      fetchIncidentStatus(reportedIncidentId);
    }
  }, [reportedIncidentId, fetchIncidentStatus]);

  useEffect(() => {
    if (!reportedIncidentId) return;

    const socket = io(window.location.origin, { transports: ['websocket', 'polling'] });

    socket.on('connect', () => {
      setSocketConnected(true);
      socket.emit('join_room', 'incidents_feed');
      socket.emit('join_room', 'stats_update');
      socket.emit('join_room', 'mission_update');
    });

    socket.on('disconnect', () => setSocketConnected(false));

    const handleUpdate = () => {
      fetchIncidentStatus(reportedIncidentId);
    };

    socket.on('stats_update', handleUpdate);
    socket.on('incident_updated', handleUpdate);
    socket.on('mission_created', handleUpdate);
    socket.on('mission_updated', handleUpdate);

    return () => {
      socket.disconnect();
    };
  }, [reportedIncidentId, fetchIncidentStatus]);

  useEffect(() => {
    if (assignedVolunteer && assignedVolunteer.id !== prevAssignedVolId.current) {
      toast.success(`✓ Volunteer ${assignedVolunteer.name} has been dispatched to assist you!`);
      prevAssignedVolId.current = assignedVolunteer.id;
    } else if (!assignedVolunteer) {
      prevAssignedVolId.current = null;
    }
  }, [assignedVolunteer, toast]);

  useEffect(() => {
    if (incidentMission && incidentMission.status !== prevMissionStatus.current) {
      toast.success(`✓ Emergency Alert: Professional assistance [${incidentMission.assignedTeam}] is ${incidentMission.status.toLowerCase()}!`);
      prevMissionStatus.current = incidentMission.status;
    } else if (!incidentMission) {
      prevMissionStatus.current = null;
    }
  }, [incidentMission, toast]);

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
    if (activeTab === 'chat') {
      scrollToBottom();
    }
  }, [messages, isLoading, activeTab, scrollToBottom]);

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

  useEffect(() => {
    const initMsg = localStorage.getItem('citizen_chat_init_message');
    if (initMsg) {
      localStorage.removeItem('citizen_chat_init_message');
      setActiveTab('chat');
      sendMessage(initMsg);
    }
  }, [sendMessage]);

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

  // ── Citation click handler ───────────────────────────────────────────────
  const handleSelectCitation = (sourceStr: string) => {
    const match = sourceStr.match(/KB-\d+/);
    if (match) {
      const articleId = match[0];
      const found = knowledgeBase.find((a) => a.id === articleId);
      if (found) {
        setActiveInspectorArticle(found);
      }
    }
  };

  // ── Filter and Search Knowledge Base ─────────────────────────────────────
  const filteredArticles = useMemo(() => {
    return knowledgeBase.map(article => {
      let score = 0;
      const q = searchQuery.toLowerCase().trim();
      
      if (q) {
        // Tag matches provide highest score weight
        const tagMatches = article.tags.filter(tag => tag.toLowerCase().includes(q)).length;
        // Text matches in content and title
        const titleMatches = (article.title.toLowerCase().match(new RegExp(q, 'g')) || []).length;
        const contentMatches = (article.content.toLowerCase().match(new RegExp(q, 'g')) || []).length;
        
        score = tagMatches * 25 + titleMatches * 15 + contentMatches * 2;
        score = Math.min(Math.round(score), 99);
      } else {
        // Default similarity score simulation for unsearched view
        score = Math.floor(Math.random() * 15) + 5;
      }

      return { article, score };
    }).filter(({ article }) => {
      const catMatch = selectedCategory === 'All' || article.category === selectedCategory;
      const textMatch = !searchQuery || 
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      return catMatch && textMatch;
    }).sort((a, b) => b.score - a.score);
  }, [searchQuery, selectedCategory]);

  const categories = useMemo(() => {
    const cats = new Set(knowledgeBase.map((a) => a.category));
    return ['All', ...Array.from(cats)];
  }, []);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto pb-4 flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
      {/* Page Header & Navigation Tabs */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 shrink-0"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-green-500/10 border border-green-500/30 flex items-center justify-center">
              <Bot className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <h2 className="text-base font-mono font-bold text-white tracking-widest uppercase leading-tight">
                Emergency AI Assistant
              </h2>
              <p className="text-[10px] text-gray-500 font-mono">
                Powered by PanicSense · RAG-Grounded Intelligence
              </p>
            </div>
          </div>

          {/* Premium Glass Tabs */}
          <div className="flex bg-[#111827] border border-gray-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-green-950/60 border border-green-800 text-green-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              AI CHAT
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('knowledge')}
              className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                activeTab === 'knowledge'
                  ? 'bg-green-950/60 border border-green-800 text-green-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              RAG CORPUS ({knowledgeBase.length})
            </button>
          </div>
        </div>
      </motion.div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 bg-[#040a06] border border-green-900/30 rounded-2xl overflow-hidden relative">
        {activeTab === 'chat' && reportedIncident && (
          <div className="bg-[#0c1811] border-b border-green-950 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 font-mono text-[11px] z-10 shrink-0">
            <div className="flex items-center gap-2 text-white">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span>
                REPORT STATUS: <span className="font-bold text-green-400">{reportedIncident.id}</span>
                <span className="text-gray-500 mx-2">·</span>
                TYPE: <span className="font-bold">{reportedIncident.type}</span>
                <span className="text-gray-500 mx-2">·</span>
                SEVERITY: <span className={`font-bold ${
                  reportedIncident.severity === 'Critical' ? 'text-red-400'
                    : reportedIncident.severity === 'High' ? 'text-orange-400'
                    : reportedIncident.severity === 'Medium' ? 'text-yellow-400'
                    : 'text-green-400'
                }`}>{reportedIncident.severity}</span>
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {assignedVolunteer ? (
                <span className="bg-blue-950/40 border border-blue-900/40 text-blue-400 px-2 py-0.5 rounded text-[10px] flex items-center gap-1.5 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  VOLUNTEER: {assignedVolunteer.name} ({assignedVolunteer.status === 'On Mission' ? 'En Route' : 'Assigned'})
                </span>
              ) : incidentMission ? (
                <span className="bg-orange-950/40 border border-orange-900/40 text-orange-400 px-2 py-0.5 rounded text-[10px] flex items-center gap-1.5 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                  DISPATCHED: {incidentMission.assignedTeam} ({incidentMission.status})
                </span>
              ) : (
                <span className="bg-yellow-950/40 border border-yellow-900/40 text-yellow-400 px-2 py-0.5 rounded text-[10px] flex items-center gap-1.5 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                  AWAITING RESPONDERS
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem('panicsense_reported_incident_id');
                  setReportedIncidentId(null);
                  setReportedIncident(null);
                  setAssignedVolunteer(null);
                  setIncidentMission(null);
                }}
                className="text-[9px] text-gray-500 hover:text-gray-300 transition-colors uppercase font-bold border border-gray-800 rounded px-1.5 py-0.5 cursor-pointer ml-1"
              >
                DISMISS
              </button>
            </div>
          </div>
        )}

        {activeTab === 'chat' ? (
          /* ─────────────────── CHAT TAB ─────────────────── */
          <>
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
                    <Sparkles className="w-7 h-7 text-green-400 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-base font-mono font-bold text-white mb-1">
                      RAG-Grounded AI Support
                    </h3>
                    <p className="text-xs text-gray-500 max-w-sm leading-relaxed font-mono">
                      Ask any questions regarding emergency safety. Responses are automatically retrieved from the system's verified emergency RAG database.
                    </p>
                  </div>

                  {/* Starter Prompts */}
                  <div className="grid grid-cols-2 gap-2.5 w-full max-w-md">
                    {STARTER_PROMPTS.map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => sendMessage(p.text)}
                        disabled={isLoading}
                        className="text-left text-xs font-mono bg-[#07100b] border border-green-950 hover:border-green-500/40 hover:bg-green-950/20 text-gray-400 hover:text-gray-200 rounded-xl px-3.5 py-3 transition disabled:opacity-40 cursor-pointer"
                      >
                        <span className="block text-green-400 font-bold mb-0.5">{p.label}</span>
                        <span className="text-[10px] text-gray-600 line-clamp-2">{p.text}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Message List */}
              {messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} onSelectCitation={handleSelectCitation} />
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
                  className="absolute bottom-24 right-6 w-8 h-8 bg-green-700 hover:bg-green-600 rounded-full flex items-center justify-center shadow-lg transition z-10 cursor-pointer"
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
                  className="mx-4 mb-2 flex items-center gap-2 bg-red-950/30 border border-red-800/40 rounded-xl px-3 py-2"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <p className="text-xs text-red-300 font-mono flex-1">{error}</p>
                  <button type="button" onClick={() => setError('')} className="cursor-pointer">
                    <X className="w-3.5 h-3.5 text-red-400 hover:text-red-200" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input Bar */}
            <div className="border-t border-green-900/20 p-3 bg-[#040a06]/40">
              <div className="flex items-end gap-2">
                {/* Voice Button */}
                <button
                  id="chat-voice-btn"
                  type="button"
                  onClick={toggleVoice}
                  className={`w-9 h-9 flex items-center justify-center rounded-xl border transition shrink-0 cursor-pointer ${
                    isListening
                      ? 'bg-red-950/40 border-red-800 text-red-400 animate-pulse'
                      : 'bg-[#07100b] border-green-950 text-gray-500 hover:border-green-800 hover:text-green-400'
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
                    className="w-full bg-[#07100b] border border-green-950 text-white text-sm rounded-xl px-4 py-2.5 pr-4 placeholder:text-gray-700 focus:outline-none focus:border-green-800 focus:ring-1 focus:ring-green-900/10 transition resize-none leading-relaxed disabled:opacity-50"
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
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-green-700 hover:bg-green-600 disabled:bg-gray-800 disabled:text-gray-600 text-white transition shrink-0 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Status Hints */}
              <div className="flex justify-between items-center mt-2 px-1 text-[9px] text-gray-600 font-mono">
                <div>
                  Press <kbd className="bg-green-950 border border-green-900/40 rounded px-1">Enter</kbd> to send ·{' '}
                  <kbd className="bg-green-950 border border-green-900/40 rounded px-1">Shift+Enter</kbd> for new line
                </div>
                {isListening && (
                  <div className="flex items-center gap-1 text-red-400 animate-pulse font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    LISTENING
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          /* ─────────────────── KNOWLEDGE BASE TAB ─────────────────── */
          <div className="flex-1 flex flex-col min-h-0 bg-[#040905]">
            {/* Search and Filters Bar */}
            <div className="p-4 border-b border-green-900/20 bg-[#050c07] space-y-3 shrink-0">
              <div className="relative">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-green-700" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search articles, tags, or contents (RAG Matching Simulator)..."
                  className="w-full bg-[#07100b] border border-green-950 text-white text-xs rounded-xl pl-10 pr-4 py-2.5 placeholder:text-gray-700 focus:outline-none focus:border-green-800 transition font-mono"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-2.5 text-gray-500 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Categories Scroll */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-green-900">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-full text-[9px] font-mono font-bold tracking-wider uppercase transition cursor-pointer border ${
                      selectedCategory === cat
                        ? 'bg-green-950/60 border-green-700 text-green-400 shadow-[0_0_8px_rgba(34,197,94,0.1)]'
                        : 'bg-transparent border-green-950/50 text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Articles Grid */}
            <div className="flex-1 overflow-y-auto p-4">
              {filteredArticles.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <AlertCircle className="w-8 h-8 text-gray-600 mb-2" />
                  <p className="text-xs font-mono text-gray-500">No articles matched your search filters.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredArticles.map(({ article, score }) => (
                    <motion.div
                      layout
                      key={article.id}
                      onClick={() => setActiveInspectorArticle(article)}
                      className="group border border-green-950 hover:border-green-800/60 bg-[#07100b] hover:bg-[#09150e]/60 rounded-xl p-4 cursor-pointer transition-all duration-300 flex flex-col justify-between shadow-[0_4px_12px_rgba(0,0,0,0.2)]"
                      whileHover={{ y: -2 }}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[9px] text-green-500/50 font-bold">{article.id}</span>
                          <div className="flex items-center gap-1.5">
                            {searchQuery && (
                              <span className="font-mono text-[8px] bg-green-950/60 text-green-400 border border-green-900/50 px-1.5 py-0.5 rounded">
                                MATCH: {score}%
                              </span>
                            )}
                            <span className="font-mono text-[8px] bg-gray-900 text-gray-500 px-2 py-0.5 rounded-full">
                              {article.category}
                            </span>
                          </div>
                        </div>
                        <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider group-hover:text-green-400 transition">
                          {article.title}
                        </h4>
                        <p className="text-[10px] text-gray-500 leading-relaxed line-clamp-3 font-sans">
                          {article.content}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-green-950/40">
                        <div className="flex gap-1 overflow-hidden max-w-[80%]">
                          {article.tags.slice(0, 3).map((t) => (
                            <span key={t} className="text-[8px] font-mono text-gray-600">
                              #{t}
                            </span>
                          ))}
                        </div>
                        <span className="text-[9px] font-mono text-green-500/40 group-hover:text-green-400 transition flex items-center gap-0.5 shrink-0">
                          INSPECT RAG
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* RAG Inspector Modal Overlay */}
      <AnimatePresence>
        {activeInspectorArticle && (
          <RagInspector
            article={activeInspectorArticle}
            onClose={() => setActiveInspectorArticle(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

