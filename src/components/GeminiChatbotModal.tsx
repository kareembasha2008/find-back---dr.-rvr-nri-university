import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  MapPin,
  ExternalLink,
  Bot,
  User as UserIcon,
  Compass,
  Zap,
  BrainCircuit,
  Info,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  mapLinks?: Array<{ title: string; uri: string }>;
}

interface GeminiChatbotModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName?: string;
}

export const GeminiChatbotModal: React.FC<GeminiChatbotModalProps> = ({
  isOpen,
  onClose,
  studentName,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome_1',
      role: 'model',
      content: `Hello${
        studentName ? ` ${studentName}` : ''
      }! I am the FIND BACK Campus Assistant for Dr. RVR NRI University, Agiripalli.\n\nI can help you locate lost items, guide you through verification, explain safe handovers, or check campus locations with Google Maps data. What can I do for you today?`,
      timestamp: 'Just now',
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'chat' | 'maps'>('chat');
  const [taskComplexity, setTaskComplexity] = useState<'standard' | 'fast' | 'complex'>('standard');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || input.trim();
    if (!textToSend || loading) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInput('');
    setLoading(true);

    try {
      if (mode === 'maps') {
        // Call Google Maps Grounding API with gemini-3.5-flash
        const res = await fetch('/api/gemini/maps', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: textToSend,
            userLocation: { latitude: 16.6534, longitude: 80.8122 }, // Dr. RVR NRI University coords
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to query Google Maps');

        const modelMsg: ChatMessage = {
          id: `model_${Date.now()}`,
          role: 'model',
          content: data.text || 'Here is the location information:',
          mapLinks: data.mapLinks || [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages((prev) => [...prev, modelMsg]);
      } else {
        // Multi-turn conversational chat
        const conversationHistory = [...messages, userMsg].map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const res = await fetch('/api/gemini/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: conversationHistory,
            taskComplexity,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to get answer from assistant');

        const modelMsg: ChatMessage = {
          id: `model_${Date.now()}`,
          role: 'model',
          content: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages((prev) => [...prev, modelMsg]);
      }
    } catch (err: any) {
      const errMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'model',
        content: `Error: ${err?.message || 'Could not connect to the campus AI server. Please check connection.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex sm:items-center items-end justify-center bg-black/80 p-0 sm:p-4 backdrop-blur-md animate-fade-in">
      <div className="flex flex-col h-[85vh] sm:h-[90vh] max-h-[680px] w-full max-w-xl bg-[#0c101d] rounded-t-3xl sm:rounded-3xl border-t sm:border border-slate-800 shadow-2xl overflow-hidden animate-slide-up sm:animate-in sm:zoom-in-95 duration-150 text-white">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-sm tracking-tight text-white">
                  FIND BACK Campus AI
                </h3>
                <span className="px-1.5 py-0.2 rounded-md bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">
                  Gemini
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Dr. RVR NRI University · Agiripalli
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector & Model Settings */}
        <div className="px-4 py-2 bg-[#080b14] border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setMode('chat')}
              className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                mode === 'chat'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Campus Chat</span>
            </button>
            <button
              onClick={() => setMode('maps')}
              className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                mode === 'maps'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Google Maps Data</span>
            </button>
          </div>

          {mode === 'chat' ? (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <span className="font-medium text-slate-500">Model:</span>
              <select
                value={taskComplexity}
                onChange={(e) => setTaskComplexity(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-0.5 text-slate-300 font-semibold focus:outline-none focus:border-indigo-500"
              >
                <option value="standard">gemini-3.5-flash (General)</option>
                <option value="fast">gemini-3.1-flash-lite (Fast)</option>
                <option value="complex">gemini-3.1-pro-preview (Complex)</option>
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[11px] text-indigo-300 font-medium bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20">
              <MapPin className="w-3 h-3 text-indigo-400 shrink-0" />
              <span>Grounded to Agiripalli Campus</span>
            </div>
          )}
        </div>

        {/* Message Thread (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-[#07090e]">
          {messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={m.id}
                className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                    isUser
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-900 text-indigo-400 border border-slate-800'
                  }`}
                >
                  {isUser ? <UserIcon className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                </div>

                <div
                  className={`max-w-[85%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                    isUser
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-xs shadow-md'
                      : 'bg-[#0f1424] text-slate-200 rounded-tl-xs border border-slate-800/80'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>

                  {/* Render Grounded Google Maps Links if available */}
                  {m.mapLinks && m.mapLinks.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-800 space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Campus Map Sources
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {m.mapLinks.map((link, idx) => (
                          <a
                            key={idx}
                            href={link.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-indigo-300 hover:text-white hover:border-indigo-500/50 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>{link.title}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <span className="text-[10px] text-slate-500 mt-2 block text-right tabular-nums">
                    {m.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-indigo-400 animate-pulse">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="bg-[#0f1424] border border-slate-800/80 rounded-2xl px-4 py-3 text-xs text-slate-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
                <span>Thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        {messages.length <= 3 && (
          <div className="px-4 py-2 border-t border-slate-800 bg-[#080b14] flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[11px]">
            {mode === 'chat' ? (
              <>
                <button
                  onClick={() =>
                    handleSendMessage('Where are the 4 official campus safe handover desks?')
                  }
                  className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 whitespace-nowrap cursor-pointer"
                >
                  Safe Handover Desks
                </button>
                <button
                  onClick={() =>
                    handleSendMessage('How does ownership verification protect my student privacy?')
                  }
                  className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 whitespace-nowrap cursor-pointer"
                >
                  Privacy & Verification
                </button>
                <button
                  onClick={() =>
                    handleSendMessage('How is the matching score calculated for lost items?')
                  }
                  className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 whitespace-nowrap cursor-pointer"
                >
                  Matching Algorithm
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() =>
                    handleSendMessage('Find Central Library and C Block at Dr. RVR NRI University Agiripalli')
                  }
                  className="px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-300 hover:bg-indigo-500/20 whitespace-nowrap cursor-pointer"
                >
                  Library & C Block
                </button>
                <button
                  onClick={() =>
                    handleSendMessage('Find bus stops and xerox printing centers near Agiripalli campus')
                  }
                  className="px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-300 hover:bg-indigo-500/20 whitespace-nowrap cursor-pointer"
                >
                  Bus Stop & Xerox
                </button>
              </>
            )}
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-[#080b14]">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                mode === 'maps'
                  ? 'Ask for locations or directions around Agiripalli campus...'
                  : 'Ask FIND BACK AI anything about lost items or campus procedures...'
              }
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950/90 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!input.trim() || loading}
              className="px-4 py-2.5 rounded-xl lovable-glow-btn disabled:opacity-40 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
