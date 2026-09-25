import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, X, Send, Bot, User as UserIcon, Loader2, Lightbulb, Mic, MicOff, AlertCircle, Check, Volume2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ChatMessage } from '../types';

export const SeedhaMitraModal: React.FC = () => {
  const { isSeedhaMitraOpen, closeSeedhaMitra, role } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Web Speech API Voice Dictation
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [voiceLang, setVoiceLang] = useState<'hi-IN' | 'en-IN'>('en-IN');
  const recognitionRef = useRef<any>(null);

  // Check browser compatibility on mount
  useEffect(() => {
    const SpeechRecognition =
      typeof window !== 'undefined' &&
      ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
    setSpeechSupported(!!SpeechRecognition);
  }, []);

  // Cleanup speech recognition when modal closes or unmounts
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        // ignore
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  useEffect(() => {
    if (!isSeedhaMitraOpen) {
      stopListening();
    }
  }, [isSeedhaMitraOpen, stopListening]);

  const toggleSpeechRecognition = () => {
    setSpeechError(null);
    const SpeechRecognition =
      typeof window !== 'undefined' &&
      ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      setSpeechError('Voice dictation (Web Speech API) is not supported in this browser. Please use Google Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      stopListening();
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = voiceLang;

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
        setInterimTranscript('');
      };

      recognition.onresult = (event: any) => {
        let currentInterim = '';
        let currentFinal = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            currentFinal += item[0].transcript;
          } else {
            currentInterim += item[0].transcript;
          }
        }

        if (currentInterim) {
          setInterimTranscript(currentInterim);
        }

        if (currentFinal) {
          setInput(prev => {
            const trimmed = prev.trim();
            const addition = currentFinal.trim();
            return trimmed ? `${trimmed} ${addition}` : addition;
          });
          setInterimTranscript('');
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition event error:', event.error);
        setIsListening(false);
        setInterimTranscript('');

        switch (event.error) {
          case 'not-allowed':
          case 'permission-denied':
            setSpeechError('Microphone permission was denied. Please allow microphone access in your browser settings.');
            break;
          case 'no-speech':
            setSpeechError('No speech was detected. Please click the mic icon and speak again.');
            break;
          case 'audio-capture':
            setSpeechError('No microphone detected. Please verify your audio recording device.');
            break;
          case 'network':
            setSpeechError('Network communication error during voice transcription.');
            break;
          case 'aborted':
            // user stopped speech recognition intentionally
            break;
          default:
            setSpeechError(`Voice dictation issue: ${event.error || 'Unknown'}. Please try typing.`);
            break;
        }
      };

      recognition.onspeechend = () => {
        // User stopped speaking
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.warn('Error starting voice recognition:', err);
      setIsListening(false);
      setSpeechError('Could not activate microphone. Please verify device permissions and try again.');
    }
  };

  const initialPrompts: Record<string, string[]> = {
    FARMER: [
      'How do Farmers earn 25-45% higher margin via SeedhaMandi?',
      'How does AI Demand Forecasting & 7-Day Price Prediction work?',
      'How does AI Route Optimization save 42% transit cost?',
      'How does IoT Cold Chain (ESP32/DHT22) prevent transit spoilage?',
      'How does Aadhaar DBT direct bank payout escrow work?',
      'What is the current Mandi price vs Direct Farm price for red onions?',
    ],
    FPO_REP: [
      'How does AI Route Optimization cluster village farmgate pickups?',
      'How to aggregate produce for rural farmers without smartphones?',
      'How does direct escrow disbursement work for individual farmers?',
      'How does AI Demand Forecasting prevent post-harvest market gluts?',
      'What is the technical architecture of this prototype?',
    ],
    CONSUMER: [
      'Why is direct farm-to-door produce fresher and pesticide-free?',
      'How does the 6-digit OTP escrow protect my purchase?',
      'How does IoT Cold Chain tracking maintain 4-8°C during delivery?',
      'How do Farmers earn 25-45% higher margin on SeedhaMandi?',
      'How can I trace my lot back to the verified farmer?',
    ],
    LOGISTICS: [
      'How does AI Route Optimization calculate CVRP and save 38% fuel?',
      'How do Logistics Partners earn higher income with Reverse-Load Matching?',
      'How does IoT Cold Chain telemetry (ESP32 + DHT22) trigger re-routing?',
      'How does the 6-digit OTP delivery handoff guarantee instant freight payout?',
      'Explain the prototype technical architecture & offline PWA cache',
    ],
  };

  const currentPrompts = initialPrompts[role] || initialPrompts.CONSUMER;

  useEffect(() => {
    if (isSeedhaMitraOpen && messages.length === 0) {
      const welcome: ChatMessage = {
        id: 'msg_welcome',
        sender: 'bot',
        text: `Namaste! I am **SeedhaMitra** (सीधा मित्र), your direct mandi intelligence advisor.\n\nAsk me about real-time crop market prices, crop protection, post-harvest cold storage, or SeedhaMandi direct escrow settlements. How can I assist your farm or harvest today?`,
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

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput('');
    setLoading(true);

    try {
      const res = await api.askAI(query, messages.map(m => ({ sender: m.sender, text: m.text })));
      const botMsg: ChatMessage = {
        id: 'msg_bot_' + Date.now(),
        sender: 'bot',
        text: res.reply || 'Apologies, I could not generate a response. Please ask me again!',
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
    // Simple inline parser for code, bold, and lists
    const lines = text.split('\n');
    let inCodeBlock = false;
    let codeLines: string[] = [];
    const elements: React.ReactNode[] = [];

    lines.forEach((line, idx) => {
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          elements.push(
            <pre key={`code_${idx}`} className="bg-stone-800 text-stone-100 p-3 rounded-xl text-xs font-mono overflow-x-auto my-2 border border-stone-700">
              <code>{codeLines.join('\n')}</code>
            </pre>
          );
          codeLines = [];
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
          codeLines = [];
        }
        return;
      }

      if (inCodeBlock) {
        codeLines.push(line);
        return;
      }

      let styled = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      styled = styled.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-stone-200 dark:bg-stone-700 font-mono text-xs text-emerald-800 dark:text-emerald-300">$1</code>');

      if (line.startsWith('• ') || line.startsWith('- ')) {
        elements.push(
          <li
            key={idx}
            className="ml-4 list-disc text-sm my-0.5 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: styled.replace(/^[•-]\s*/, '') }}
          />
        );
      } else if (line.trim().length === 0) {
        elements.push(<div key={idx} className="h-1.5" />);
      } else {
        elements.push(
          <p
            key={idx}
            className="text-sm leading-relaxed mb-1.5"
            dangerouslySetInnerHTML={{ __html: styled }}
          />
        );
      }
    });

    if (inCodeBlock && codeLines.length > 0) {
      elements.push(
        <pre key="code_end" className="bg-stone-800 text-stone-100 p-3 rounded-xl text-xs font-mono overflow-x-auto my-2 border border-stone-700">
          <code>{codeLines.join('\n')}</code>
        </pre>
      );
    }

    return elements;
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
                <h3 className="font-extrabold text-base tracking-tight">SeedhaMitra AI</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-700/80 text-[10px] font-bold tracking-wider text-emerald-100 border border-emerald-600/60">
                  Online
                </span>
              </div>
              <p className="text-xs text-emerald-200">Direct Agricultural & Mandi Intelligence Advisor</p>
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
                  <span className="font-bold">{msg.sender === 'user' ? 'You' : 'SeedhaMitra AI'}</span>
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
                <span>SeedhaMitra is thinking & reasoning...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 transition-colors">
          {/* Active Speech Recognition Visual Feedback Banner */}
          {isListening && (
            <div className="mb-2.5 p-3 bg-emerald-950 text-white rounded-xl border border-emerald-700 shadow-md animate-in fade-in slide-in-from-bottom-2 duration-150 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="relative flex items-center justify-center">
                    <span className="w-3.5 h-3.5 rounded-full bg-red-500 animate-ping absolute"></span>
                    <span className="w-3 h-3 rounded-full bg-red-500 relative"></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-amber-300 uppercase tracking-wider">
                      Listening...
                    </span>
                    <span className="text-[11px] text-emerald-200 font-medium">
                      ({voiceLang === 'hi-IN' ? 'Hindi / हिंदी' : 'Indian English'})
                    </span>
                  </div>
                </div>

                {/* Animated Sound Waves */}
                <div className="flex items-center gap-1 px-2 py-1 bg-emerald-900/80 rounded-md border border-emerald-700/60">
                  <span className="w-1 h-3 bg-amber-400 rounded-full animate-bounce"></span>
                  <span className="w-1 h-5 bg-amber-300 rounded-full animate-bounce [animation-delay:150ms]"></span>
                  <span className="w-1 h-2.5 bg-amber-400 rounded-full animate-bounce [animation-delay:300ms]"></span>
                  <span className="w-1 h-4 bg-amber-300 rounded-full animate-bounce [animation-delay:75ms]"></span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={stopListening}
                    className="px-2.5 py-1 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-[11px] font-bold text-white transition flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5 text-amber-300" />
                    <span>Done Speaking</span>
                  </button>
                  <button
                    type="button"
                    onClick={stopListening}
                    className="p-1 text-stone-300 hover:text-white rounded-md transition"
                    title="Cancel voice input"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Interim Real-time Transcription Stream */}
              <div className="text-xs bg-emerald-900/60 rounded-lg p-2 border border-emerald-800 text-stone-100 font-mono">
                <span className="text-emerald-300 font-semibold mr-1.5">Live Voice:</span>
                {interimTranscript ? (
                  <span className="text-amber-200 italic font-medium">{interimTranscript}</span>
                ) : (
                  <span className="text-emerald-300/70 italic">Speak now into your microphone...</span>
                )}
              </div>
            </div>
          )}

          {/* Speech Error Banner */}
          {speechError && (
            <div className="mb-2 p-2.5 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 rounded-xl flex items-start justify-between gap-2 text-xs text-amber-900 dark:text-amber-200 animate-in fade-in duration-150">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{speechError}</span>
              </div>
              <button
                type="button"
                onClick={() => setSpeechError(null)}
                className="p-0.5 text-amber-700 dark:text-amber-300 hover:opacity-75 transition cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

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
              placeholder={isListening ? 'Listening to your voice...' : 'Ask SeedhaMitra about mandi rates, crops, or logistics...'}
              className="flex-1 min-h-[48px] h-12 bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 focus:bg-white dark:focus:bg-stone-900 transition"
            />

            {/* Voice Dictation Button (Web Speech API) */}
            <button
              type="button"
              onClick={toggleSpeechRecognition}
              className={`min-w-[48px] min-h-[48px] w-12 h-12 rounded-xl flex items-center justify-center transition shadow-xs cursor-pointer relative ${
                isListening
                  ? 'bg-red-600 text-white animate-pulse ring-4 ring-red-400/50'
                  : 'bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300'
              }`}
              title={isListening ? 'Stop Voice Recording' : `Speak in ${voiceLang === 'hi-IN' ? 'Hindi' : 'English'}`}
              aria-label="Voice Input"
            >
              {isListening ? (
                <>
                  <MicOff className="w-5 h-5 text-white" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-white dark:border-stone-900 animate-ping"></span>
                </>
              ) : (
                <Mic className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
              )}
            </button>

            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="min-h-[48px] h-12 px-5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl font-bold flex items-center gap-1.5 transition shadow-sm active:scale-95 cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Ask</span>
            </button>
          </form>

          <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 px-1 mt-2.5">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Universal AI Agent
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setVoiceLang(prev => (prev === 'en-IN' ? 'hi-IN' : 'en-IN'))}
                className="px-2 py-0.5 rounded-md bg-stone-200/70 dark:bg-stone-800 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 hover:opacity-80 transition cursor-pointer"
                title="Click to switch voice language"
              >
                Voice: {voiceLang === 'hi-IN' ? 'हिंदी (Hindi)' : 'English (India)'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
