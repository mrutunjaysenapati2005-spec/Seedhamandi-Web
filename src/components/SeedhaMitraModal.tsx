import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Send, Bot, User as UserIcon, Loader2, Volume2, Lightbulb, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ChatMessage } from '../types';

export const SeedhaMitraModal: React.FC = () => {
  const { isSeedhaMitraOpen, closeSeedhaMitra, user, role } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const initialPrompts: Record<string, string[]> = {
    FARMER: [
      'What is the current Mandi price vs Direct Farm price for red onions?',
      'How does SeedhaMandi eliminate intermediary deductions?',
      'How should I pack plum tomatoes to maintain shelf life during transit?',
      'What are the highest demand crops projected for next month?',
    ],
    FPO_REP: [
      'How can I register produce on behalf of 54 rural farmers without smartphones?',
      'How does direct escrow disbursement work for individual farmer bank accounts?',
      'Can an FPO aggregate orders for collective refrigerated truck dispatch?',
      'What quality certification fetches export-grade pricing?',
    ],
    CONSUMER: [
      'Why is GI-tagged Devgad Alphonso superior to chemical-ripened mangoes?',
      'Explain the difference between Vedic A2 Bilona Ghee and commercial ghee.',
      'Recommend a balanced weekly farm-fresh basket for a family of 4.',
      'How can I track the exact farm provenance of my order?',
    ],
    LOGISTICS: [
      'What temperature should refrigerated vans maintain for fragile fruits?',
      'How does the 6-stage OTP delivery handoff guarantee instant payout release?',
      'How do I consolidate multi-farm pickups in the Pune-Nashik belt?',
      'What are the penalty rules for transit delays on perishable lots?',
    ],
  };

  const currentPrompts = initialPrompts[role] || initialPrompts.CONSUMER;

  useEffect(() => {
    if (isSeedhaMitraOpen && messages.length === 0) {
      const welcome: ChatMessage = {
        id: 'msg_welcome',
        sender: 'bot',
        text: `Namaste ${user?.name || 'Friend'}! I am **SeedhaMitra** (सीधा मित्र), your AI agricultural advisor powered by real-time farm intelligence.\n\nWhether you need market price discovery, crop demand trends, FPO cooperative guidance, or produce quality insights, ask me anything!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([welcome]);
    }
  }, [isSeedhaMitraOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (!isSeedhaMitraOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.askAI(query);
      const botMsg: ChatMessage = {
        id: 'msg_bot_' + Date.now(),
        sender: 'bot',
        text: res.reply || 'Apologies, I could not generate a response. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: 'msg_err_' + Date.now(),
        sender: 'bot',
        text: 'Network anomaly while contacting SeedhaMitra intelligence server. Please retry in a moment.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const formatText = (text: string) => {
    // Simple inline parser for bold and lists
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      let styled = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      if (line.startsWith('• ') || line.startsWith('- ')) {
        return (
          <li
            key={idx}
            className="ml-4 list-disc text-sm my-0.5 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: styled.replace(/^[•-]\s*/, '') }}
          />
        );
      }
      return (
        <p
          key={idx}
          className="text-sm leading-relaxed mb-2"
          dangerouslySetInnerHTML={{ __html: styled }}
        />
      );
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-stone-900 transition-colors dark:bg-stone-950 w-full max-w-2xl rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-700 dark:border-stone-800 overflow-hidden flex flex-col h-[85vh] max-h-[700px] transition-colors">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white p-4 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-emerald-950 flex items-center justify-center shadow-inner font-black text-lg">
              <Sparkles className="w-6 h-6 text-emerald-950 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base tracking-tight">SeedhaMitra AI Agent</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-700/80 text-[10px] font-bold tracking-wider text-amber-300 border border-emerald-600">
                  Agri-Intelligence Live
                </span>
              </div>
              <p className="text-xs text-emerald-200">Real-time Mandi Discovery & Farm Advisory</p>
            </div>
          </div>

          <button
            onClick={closeSeedhaMitra}
            className="p-1.5 text-emerald-200 hover:text-white hover:bg-emerald-700/50 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Suggestion Chips */}
        <div className="bg-stone-50 dark:bg-stone-950 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-700 dark:border-stone-800 p-3 overflow-x-auto scrollbar-none flex items-center gap-2 transition-colors">
          <div className="flex items-center gap-1 text-xs font-bold text-stone-500 dark:text-stone-400 dark:text-stone-400 whitespace-nowrap pl-1">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span>Suggested:</span>
          </div>
          {currentPrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSend(prompt)}
              className="text-xs font-medium bg-white dark:bg-stone-900 dark:bg-stone-800 hover:bg-emerald-50 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 dark:text-stone-300 hover:text-emerald-800 dark:hover:text-emerald-400 px-3 py-1.5 rounded-full border border-stone-200 dark:border-stone-700 dark:border-stone-700 shadow-xs whitespace-nowrap transition"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Chat Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50/50 dark:bg-stone-900/50 transition-colors">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'bot' && (
                <div className="w-8 h-8 rounded-lg bg-emerald-800 text-amber-300 flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[82%] rounded-2xl px-4 py-3 shadow-xs transition-colors ${
                  msg.sender === 'user'
                    ? 'bg-emerald-700 text-white rounded-tr-xs'
                    : 'bg-white dark:bg-stone-900 dark:bg-stone-800 text-stone-800 dark:text-stone-200 dark:text-stone-200 border border-stone-200/80 dark:border-stone-700 rounded-tl-xs'
                }`}
              >
                <div className="text-xs opacity-75 mb-1 flex items-center justify-between gap-4">
                  <span className="font-bold">{msg.sender === 'user' ? 'You' : 'SeedhaMitra Advisor'}</span>
                  <span>{msg.timestamp}</span>
                </div>
                <div>{formatText(msg.text)}</div>
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-stone-300 dark:bg-stone-700 text-stone-700 dark:text-stone-300 dark:text-stone-300 flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                  <UserIcon className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 items-center text-stone-500 dark:text-stone-400 dark:text-stone-400 text-xs">
              <div className="w-8 h-8 rounded-lg bg-emerald-800 text-amber-300 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 animate-bounce" />
              </div>
              <div className="bg-white dark:bg-stone-900 transition-colors dark:bg-stone-800 border border-stone-200 dark:border-stone-700 dark:border-stone-700 rounded-2xl px-4 py-3 flex items-center gap-2 transition-colors">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-700 dark:text-emerald-500" />
                <span>SeedhaMitra is analyzing agricultural rates & crop telemetry...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white dark:bg-stone-900 dark:bg-stone-950 border-t border-stone-200 dark:border-stone-700 dark:border-stone-800 transition-colors">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={`Ask SeedhaMitra about prices, demand, FPO model, or produce...`}
              className="flex-1 bg-stone-100 dark:bg-stone-800 dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 dark:text-stone-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 focus:bg-white dark:bg-stone-900 dark:focus:bg-stone-950 transition"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl font-bold flex items-center gap-1.5 transition shadow-sm active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Ask</span>
            </button>
          </form>
          <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 dark:text-stone-400 px-1 mt-2">
            <span>Powered by Gemini Server-Side AI & SeedhaMandi Knowledge Graph</span>
            <span className="text-emerald-700 dark:text-emerald-500 font-medium">Bilingual Support (English & Hindi)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
