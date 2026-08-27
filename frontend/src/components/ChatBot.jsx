import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const API_BASE = import.meta.env.VITE_API_URL || '';

/* ═══════════════════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════════════════ */
const QUICK_ACTIONS = {
  student: [
    { icon: '📋', label: 'My Orders',   text: 'Show me my recent orders and their status' },
    { icon: '🏪', label: 'Canteens',    text: 'What canteens are available right now?' },
    { icon: '🍽️', label: 'View Menus', text: 'Show me all available meals and menus from every canteen' },
    { icon: '💰', label: 'Expenses',    text: 'What is my total spending so far?' },
  ],
  canteen: [
    { icon: '📦', label: 'Orders',    text: 'Show me all pending and active orders' },
    { icon: '🍽️', label: 'My Menu',  text: 'List all my meals and their availability' },
    { icon: '💰', label: 'Revenue',   text: 'What is my total revenue so far?' },
    { icon: '⭐', label: 'Reviews',   text: 'Show my customer ratings and reviews' },
  ],
  admin: [
    { icon: '📊', label: 'Stats',      text: 'Give me a full overview of system statistics' },
    { icon: '⏳', label: 'Approvals',  text: 'Are there any pending canteen approvals?' },
    { icon: '👥', label: 'Users',      text: 'How many users are registered by role?' },
    { icon: '🚨', label: 'Complaints', text: 'How many complaints are pending resolution?' },
  ],
};

const ROLE_BADGE = {
  student: { label: 'Student',       color: '#93c5fd' },
  canteen: { label: 'Canteen Owner', color: '#fdba74' },
  admin:   { label: 'Administrator', color: '#d8b4fe' },
};

/* ═══════════════════════════════════════════════════════════════════════════
   UTILITIES
   ═══════════════════════════════════════════════════════════════════════════ */

/** Strip all markdown so TTS reads cleanly */
function stripMarkdown(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[-•*]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/---+/g, '')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ' ')
    .trim();
}

/** Inline bold / italic parser → React elements */
function parseInline(text, baseKey = '') {
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  const parts = [];
  let last = 0, k = 0, match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    if (match[0].startsWith('**'))
      parts.push(<strong key={`${baseKey}-b${k++}`} style={{ fontWeight: 700 }}>{match[1]}</strong>);
    else
      parts.push(<em key={`${baseKey}-i${k++}`}>{match[2]}</em>);
    last = regex.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : parts;
}

/** Full block markdown renderer */
function renderMarkdown(text, dark, isUser) {
  const tc  = isUser ? 'white' : dark ? '#e2e8f0' : '#1e293b';
  const dot = isUser ? 'rgba(255,255,255,0.9)' : '#16a34a';

  const lines = text.split('\n');
  const blocks = [];
  let i = 0, key = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    if (line === '') { blocks.push(<div key={key++} style={{ height: '5px' }} />); i++; continue; }

    if (/^---+$/.test(line)) {
      blocks.push(<hr key={key++} style={{ border: 'none', borderTop: `1px solid ${isUser ? 'rgba(255,255,255,0.25)' : dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, margin: '6px 0' }} />);
      i++; continue;
    }

    const hm = line.match(/^(#{1,3})\s+(.+)/);
    if (hm) {
      const fs = hm[1].length === 1 ? '15px' : hm[1].length === 2 ? '14px' : '13px';
      blocks.push(<p key={key++} style={{ margin: '5px 0 2px', fontSize: fs, fontWeight: 700, color: tc, lineHeight: 1.3 }}>{parseInline(hm[2], `h${key}`)}</p>);
      i++; continue;
    }

    if (/^[-•*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-•*]\s+/.test(lines[i].trim())) { items.push(lines[i].trim().replace(/^[-•*]\s+/, '')); i++; }
      blocks.push(
        <ul key={key++} style={{ margin: '3px 0', paddingLeft: '4px', listStyle: 'none' }}>
          {items.map((it, idx) => (
            <li key={idx} style={{ display: 'flex', gap: '7px', marginBottom: '3px', color: tc, fontSize: '13px', lineHeight: 1.5, alignItems: 'flex-start' }}>
              <span style={{ color: dot, fontWeight: 700, flexShrink: 0 }}>•</span>
              <span>{parseInline(it, `bl${key}-${idx}`)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) { items.push(lines[i].trim().replace(/^\d+\.\s+/, '')); i++; }
      blocks.push(
        <ol key={key++} style={{ margin: '3px 0', paddingLeft: '18px' }}>
          {items.map((it, idx) => (
            <li key={idx} style={{ marginBottom: '3px', color: tc, fontSize: '13px', lineHeight: 1.5 }}>{parseInline(it, `nl${key}-${idx}`)}</li>
          ))}
        </ol>
      );
      continue;
    }

    blocks.push(<p key={key++} style={{ margin: '2px 0', fontSize: '13px', lineHeight: 1.55, color: tc, wordBreak: 'break-word' }}>{parseInline(line, `p${key}`)}</p>);
    i++;
  }
  return blocks;
}

/** Extract trailing numbered list as suggestion buttons */
function extractSuggestions(content) {
  const lines = content.split('\n');
  const suggestions = [];
  let cutIndex = lines.length;

  for (let i = lines.length - 1; i >= Math.max(0, lines.length - 7); i--) {
    if (/^\d+\.\s+.{4,}/.test(lines[i].trim())) {
      suggestions.unshift(lines[i].trim().replace(/^\d+\.\s+/, ''));
      cutIndex = i;
    } else if (suggestions.length > 0) {
      if (lines[i].trim() === '') { cutIndex = i; continue; }
      break;
    }
  }

  if (suggestions.length >= 2 && suggestions.length <= 5)
    return { mainContent: lines.slice(0, cutIndex).join('\n').trimEnd(), suggestions };
  return { mainContent: content, suggestions: [] };
}

function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export default function ChatBot() {
  const { token, user } = useAuth();
  const { theme }       = useTheme();
  const dark      = theme === 'dark';
  const role      = user?.role || 'student';
  const firstName = user?.name?.split(' ')[0] || 'there';

  /* ── UI state ──────────────────────────────────────────────────────────── */
  const [open,      setOpen]      = useState(false);
  const [unread,    setUnread]    = useState(0);
  const [showQuick, setShowQuick] = useState(true);
  const [input,     setInput]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [messages,  setMessages]  = useState([{
    role: 'assistant',
    content: `Hi **${firstName}**! I'm your **SmartMess Assistant**.\n\nAsk me about canteens, meals, orders, queue tokens, complaints, expenses, or anything else in SmartMess. I'll keep it simple and help you step by step.\n\nWhat would you like to do?`,
    ts: Date.now(),
  }]);

  /* ── Voice state ───────────────────────────────────────────────────────── */
  // Synchronous lazy init — avoids the first-render false negative from useEffect
  const [voiceSupported] = useState(() =>
    typeof window !== 'undefined' &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition) &&
    !!window.speechSynthesis
  );
  const [voiceError,      setVoiceError]      = useState('');
  const [isListening,     setIsListening]     = useState(false);
  const [isSpeaking,      setIsSpeaking]      = useState(false);
  const [ttsEnabled,      setTtsEnabled]      = useState(true);
  const [voiceChatMode,   setVoiceChatMode]   = useState(false);
  const [vcState,         setVcState]         = useState('idle'); // idle | listening | processing | speaking
  const [interimText,     setInterimText]     = useState('');
  const [speakingIdx,     setSpeakingIdx]     = useState(null);

  /* ── Refs ──────────────────────────────────────────────────────────────── */
  const bottomRef       = useRef(null);
  const inputRef        = useRef(null);
  const messagesRef     = useRef(null);
  const recognitionRef  = useRef(null);
  const vcAutoLoopRef   = useRef(false);   // controls auto-loop in voice chat mode
  const ttsEnabledRef   = useRef(true);
  const voiceChatRef    = useRef(false);

  // Keep refs in sync
  useEffect(() => { ttsEnabledRef.current = ttsEnabled; }, [ttsEnabled]);
  useEffect(() => { voiceChatRef.current = voiceChatMode; }, [voiceChatMode]);


  /* ── Scroll to bottom ──────────────────────────────────────────────────── */
  useEffect(() => {
    if (open) setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
  }, [messages, open]);

  useEffect(() => {
    if (open) { setUnread(0); setTimeout(() => inputRef.current?.focus(), 100); }
  }, [open]);

  /* ══════════════════════════════════════════════════════════════════════════
     TTS — Text-to-Speech
     ══════════════════════════════════════════════════════════════════════════ */
  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    setSpeakingIdx(null);
    if (voiceChatRef.current && vcAutoLoopRef.current) {
      setVcState('listening');
      startListeningVC();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const speakText = useCallback((text, msgIdx) => {
    if (!ttsEnabledRef.current || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const clean = stripMarkdown(text);
    if (!clean.trim()) return;

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate   = 1.05;
    utterance.pitch  = 1.0;
    utterance.volume = 1.0;

    // Pick best English voice
    const voices = window.speechSynthesis.getVoices();
    const best = voices.find(v => v.name.includes('Google') && v.lang.startsWith('en'))
              || voices.find(v => v.lang === 'en-US')
              || voices.find(v => v.lang.startsWith('en'));
    if (best) utterance.voice = best;

    utterance.onstart = () => { setIsSpeaking(true); setSpeakingIdx(msgIdx); if (voiceChatRef.current) setVcState('speaking'); };
    utterance.onend   = () => {
      setIsSpeaking(false);
      setSpeakingIdx(null);
      if (voiceChatRef.current && vcAutoLoopRef.current) {
        setVcState('listening');
        startListeningVC();
      }
    };
    utterance.onerror = () => { setIsSpeaking(false); setSpeakingIdx(null); };

    window.speechSynthesis.speak(utterance);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Graceful voice-not-supported notice ─────────────────────────────── */
  const showVoiceError = useCallback((msg = 'Voice not supported in this browser. Try Chrome.') => {
    setVoiceError(msg);
    setTimeout(() => setVoiceError(''), 3500);
  }, []);

  /* ══════════════════════════════════════════════════════════════════════════
     STT — Speech-to-Text (normal input mode)
     ══════════════════════════════════════════════════════════════════════════ */
  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { showVoiceError(); return; }
    if (isListening) return;

    window.speechSynthesis?.cancel();
    setIsSpeaking(false);

    const rec = new SR();
    rec.continuous      = false;
    rec.interimResults  = true;
    rec.lang            = 'en-US';

    rec.onstart  = () => { setIsListening(true); setInterimText(''); };
    rec.onerror  = ()  => { setIsListening(false); setInterimText(''); };
    rec.onend    = ()  => { setIsListening(false); setInterimText(''); };

    rec.onresult = (e) => {
      let interim = '', final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      setInterimText(interim);
      if (final.trim()) {
        setInput(prev => (prev ? prev + ' ' : '') + final.trim());
        setInterimText('');
        // Focus input so user can review / edit before sending
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    };

    recognitionRef.current = rec;
    try { rec.start(); } catch { setIsListening(false); }
  }, [isListening]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
    setInterimText('');
  }, []);

  /* ══════════════════════════════════════════════════════════════════════════
     STT — for Voice Chat Mode (auto-send when speech ends)
     ══════════════════════════════════════════════════════════════════════════ */
  const startListeningVC = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const rec = new SR();
    rec.continuous     = false;
    rec.interimResults = true;
    rec.lang           = 'en-US';

    rec.onstart  = () => { setVcState('listening'); setInterimText(''); };
    rec.onerror  = (e) => {
      if (e.error !== 'aborted') { setInterimText(''); setVcState('idle'); }
    };
    rec.onend = () => {
      setInterimText('');
      if (!vcAutoLoopRef.current) setVcState('idle');
    };
    rec.onresult = (e) => {
      let interim = '', final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      setInterimText(interim || final);
      if (final.trim()) {
        setInterimText('');
        sendMessageVC(final.trim());
      }
    };

    recognitionRef.current = rec;
    try { rec.start(); } catch { setVcState('idle'); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ══════════════════════════════════════════════════════════════════════════
     Send Message — normal mode
     ══════════════════════════════════════════════════════════════════════════ */
  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    setShowQuick(false);
    stopListening();
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);

    const userMsg = { role: 'user', content: msg, ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/chatbot/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: msg, history: messages.map(m => ({ role: m.role, content: m.content })) }),
      });
      const data = await res.json();
      const reply = data.success ? data.reply : 'Sorry, something went wrong. Please try again.';
      const newIdx = messages.length + 1;

      setMessages(prev => {
        const updated = [...prev, { role: 'assistant', content: reply, ts: Date.now() }];
        // Speak after state update
        if (ttsEnabledRef.current) {
          setTimeout(() => speakText(reply, updated.length - 1), 100);
        }
        return updated;
      });
      if (!open) setUnread(u => u + 1);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Unable to connect. Please check your connection.', ts: Date.now() }]);
    } finally {
      setLoading(false);
    }
  };

  /* ══════════════════════════════════════════════════════════════════════════
     Send Message — voice chat mode
     ══════════════════════════════════════════════════════════════════════════ */
  const sendMessageVC = useCallback(async (msg) => {
    if (!msg || !voiceChatRef.current) return;

    setVcState('processing');
    const userMsg = { role: 'user', content: msg, ts: Date.now() };

    setMessages(prev => {
      const updated = [...prev, userMsg];
      // Fire API call from within updater callback is bad — use effect instead
      return updated;
    });

    // Store the message for API call
    const currentHistory = messages;

    try {
      const res = await fetch(`${API_BASE}/api/chatbot/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: msg, history: currentHistory.map(m => ({ role: m.role, content: m.content })) }),
      });
      const data = await res.json();
      const reply = data.success ? data.reply : 'Sorry, something went wrong.';

      setMessages(prev => [...prev, { role: 'assistant', content: reply, ts: Date.now() }]);
      setVcState('speaking');
      if (vcAutoLoopRef.current) speakText(reply, null);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Please try again.', ts: Date.now() }]);
      setVcState('idle');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, token]);

  /* ── Toggle voice chat mode ────────────────────────────────────────────── */
  const enterVoiceChat = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { showVoiceError('Voice Chat needs a browser with microphone support (e.g. Chrome).'); return; }
    setVoiceChatMode(true);
    voiceChatRef.current = true;
    vcAutoLoopRef.current = true;
    window.speechSynthesis?.cancel();
    setVcState('listening');
    setTimeout(() => startListeningVC(), 300);
  };

  const exitVoiceChat = () => {
    vcAutoLoopRef.current = false;
    recognitionRef.current?.stop();
    window.speechSynthesis?.cancel();
    setVoiceChatMode(false);
    voiceChatRef.current = false;
    setVcState('idle');
    setInterimText('');
    setIsSpeaking(false);
  };

  /* ── Keyboard handler ──────────────────────────────────────────────────── */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  /* ── Clear chat ────────────────────────────────────────────────────────── */
  const clearChat = () => {
    exitVoiceChat();
    setMessages([{
      role: 'assistant',
      content: `Hi **${firstName}**! I'm your **SmartMess Assistant**.\n\nAsk me about canteens, meals, orders, queue tokens, complaints, expenses, or anything else in SmartMess. I'll keep it simple and help you step by step.\n\nWhat would you like to do?`,
      ts: Date.now(),
    }]);
    setShowQuick(true);
    setUnread(0);
  };

  /* ── Cleanup on unmount ────────────────────────────────────────────────── */
  useEffect(() => {
    return () => { recognitionRef.current?.stop(); window.speechSynthesis?.cancel(); };
  }, []);

  /* ── VC state colors ───────────────────────────────────────────────────── */
  const vcColors = {
    idle:       { orb: '#374151', ring: 'transparent',     label: 'Tap mic to speak',      icon: '#9ca3af' },
    listening:  { orb: '#16a34a', ring: 'rgba(22,163,74,0.3)', label: 'Listening…',        icon: 'white' },
    processing: { orb: '#d97706', ring: 'rgba(217,119,6,0.3)', label: 'Thinking…',         icon: 'white' },
    speaking:   { orb: '#2563eb', ring: 'rgba(37,99,235,0.3)', label: 'Speaking…',         icon: 'white' },
  };
  const vc = vcColors[vcState] || vcColors.idle;

  /* ════════════════════════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════════════════════════ */
  return (
    <>
      {/* ─── Floating button ─────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen(o => !o)}
        title="SmartMess Assistant"
        style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
          width: '58px', height: '58px', borderRadius: '50%',
          background: open
            ? (dark ? '#374151' : '#f3f4f6')
            : 'linear-gradient(135deg, #15803d 0%, #4ade80 100%)',
          border: 'none', cursor: 'pointer',
          boxShadow: open ? 'none' : '0 4px 24px rgba(22,163,74,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
          animation: open ? 'none' : 'chatPulse 2.8s ease-in-out infinite',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        {open
          ? <svg width="22" height="22" fill="none" stroke={dark ? '#9ca3af' : '#6b7280'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          : <svg width="26" height="26" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        }
        {!open && unread > 0 && (
          <span style={{
            position: 'absolute', top: '2px', right: '2px',
            width: '20px', height: '20px', borderRadius: '50%',
            background: '#ef4444', color: 'white', fontSize: '11px', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid white',
          }}>{unread > 9 ? '9+' : unread}</span>
        )}
      </button>

      {/* ─── Chat window ─────────────────────────────────────────────────── */}
      {open && (
        <div style={{
          position: 'fixed',
          bottom: '96px',
          right: '24px',
          top: '12px',           /* never go above 12px from top of viewport */
          zIndex: 9998,
          width: '390px',
          maxHeight: 'calc(100vh - 120px)',   /* 96px bottom offset + 24px breathing room */
          minHeight: '0',
          borderRadius: '22px',
          boxShadow: dark ? '0 24px 64px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.06)' : '0 24px 64px rgba(0,0,0,0.16), 0 0 0 1px rgba(0,0,0,0.06)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          background: dark ? '#0f172a' : '#ffffff',
          animation: 'chatSlideUp 0.3s cubic-bezier(0.34,1.4,0.64,1)',
        }}>

          {/* ── Header ────────────────────────────────────────────────────── */}
          <div style={{
            padding: '16px 18px 14px',
            background: 'linear-gradient(135deg, #14532d 0%, #16a34a 55%, #4ade80 100%)',
            flexShrink: 0, position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: '-18px', right: '-18px', width: '90px', height: '90px', borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: '-28px', left: '32%', width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
              {/* Left: avatar + name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '13px', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.15)', flexShrink: 0 }}>
                  <svg width="21" height="21" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </div>
                <div>
                  <p style={{ color: 'white', fontWeight: 700, fontSize: '15px', margin: 0, letterSpacing: '-0.2px' }}>SmartMess Assistant</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '3px' }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: isSpeaking ? '#60a5fa' : '#86efac', boxShadow: `0 0 7px ${isSpeaking ? '#60a5fa' : '#86efac'}`, display: 'inline-block', animation: (isListening || isSpeaking) ? 'statusBlink 1s ease-in-out infinite' : 'none' }} />
                    <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '11px', fontWeight: 500 }}>
                      {isListening ? 'Listening…' : isSpeaking ? 'Speaking…' : 'Online · AI-powered'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                {/* Role badge */}
                <span style={{ padding: '3px 9px', borderRadius: '20px', background: 'rgba(255,255,255,0.2)', color: 'white', fontSize: '10px', fontWeight: 600, letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                  {ROLE_BADGE[role]?.label || role}
                </span>

                {/* TTS toggle — always visible */}
                <button
                  onClick={() => {
                    if (!window.speechSynthesis) { showVoiceError(); return; }
                    setTtsEnabled(v => !v);
                    if (isSpeaking) { window.speechSynthesis?.cancel(); setIsSpeaking(false); }
                  }}
                  title={ttsEnabled ? 'Mute AI voice' : 'Unmute AI voice'}
                  style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.28)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                >
                  {ttsEnabled
                    ? <svg width="15" height="15" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
                    : <svg width="15" height="15" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
                  }
                </button>

                {/* Clear */}
                <button
                  onClick={clearChat}
                  title="Clear conversation"
                  style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.28)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                >
                  <svg width="14" height="14" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>
                </button>
              </div>
            </div>
          </div>

          {/* ── Messages ──────────────────────────────────────────────────── */}
          <div ref={messagesRef} style={{ flex: 1, overflowY: 'auto', padding: '16px 14px 8px', display: 'flex', flexDirection: 'column', gap: '4px', minHeight: 0, scrollbarWidth: 'thin', scrollbarColor: dark ? 'rgba(255,255,255,0.1) transparent' : 'rgba(0,0,0,0.08) transparent' }}>
            {messages.map((msg, i) => {
              const isUser = msg.role === 'user';
              const showAvatar = !isUser && (i === 0 || messages[i - 1].role === 'user');
              const { mainContent, suggestions } = isUser ? { mainContent: msg.content, suggestions: [] } : extractSuggestions(msg.content);
              const isThisSpeaking = speakingIdx === i;

              return (
                <div key={i} style={{ marginBottom: '2px' }}>
                  <div style={{ display: 'flex', flexDirection: isUser ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: '8px' }}>
                    {/* Bot avatar */}
                    {!isUser && (
                      <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: showAvatar ? 'linear-gradient(135deg, #15803d, #22c55e)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: showAvatar ? '0 2px 8px rgba(22,163,74,0.35)' : 'none' }}>
                        {showAvatar && <svg width="14" height="14" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>}
                      </div>
                    )}

                    <div style={{ maxWidth: '84%' }}>
                      {/* Bubble */}
                      <div
                        style={{
                          padding: '10px 13px',
                          borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                          background: isUser ? 'linear-gradient(135deg, #15803d, #22c55e)' : dark ? '#1e293b' : '#f1f5f9',
                          boxShadow: isUser ? '0 3px 14px rgba(22,163,74,0.3)' : dark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 1px 4px rgba(0,0,0,0.06)',
                          border: isThisSpeaking ? `2px solid ${dark ? '#3b82f6' : '#93c5fd'}` : (!isUser && !dark ? '1px solid rgba(0,0,0,0.05)' : 'none'),
                          cursor: !isUser ? 'pointer' : 'default',
                          transition: 'border 0.2s',
                          position: 'relative',
                        }}
                        onClick={() => {
                          if (!isUser) {
                            if (isThisSpeaking) stopSpeaking();
                            else speakText(msg.content, i);
                          }
                        }}
                        title={!isUser ? (isThisSpeaking ? 'Click to stop' : 'Click to hear') : ''}
                      >
                        {renderMarkdown(mainContent, dark, isUser)}
                        {/* Speaking wave indicator */}
                        {isThisSpeaking && (
                          <div style={{ display: 'flex', gap: '3px', marginTop: '6px', alignItems: 'center' }}>
                            {[0,1,2,3,4].map(d => (
                              <span key={d} style={{ width: '3px', height: '12px', background: dark ? '#60a5fa' : '#3b82f6', borderRadius: '2px', display: 'inline-block', animation: `vcWave 0.7s ease-in-out ${d * 0.1}s infinite alternate` }} />
                            ))}
                            <span style={{ fontSize: '10px', color: dark ? '#60a5fa' : '#3b82f6', marginLeft: '4px', fontWeight: 600 }}>Speaking</span>
                          </div>
                        )}
                      </div>

                      {/* Timestamp + speak icon */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '3px 4px 0', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
                        <span style={{ fontSize: '10px', color: dark ? '#4b5563' : '#9ca3af' }}>{fmtTime(msg.ts)}</span>
                        {!isUser && !isThisSpeaking && (
                          <button
                            onClick={() => speakText(msg.content, i)}
                            title="Read aloud"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0', display: 'flex', alignItems: 'center', opacity: 0.4, transition: 'opacity 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                            onMouseLeave={e => e.currentTarget.style.opacity = '0.4'}
                          >
                            <svg width="11" height="11" fill="none" stroke={dark ? '#9ca3af' : '#6b7280'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Suggestion buttons */}
                  {!isUser && suggestions.length > 0 && (
                    <div style={{ marginLeft: '36px', marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {suggestions.map((s, si) => (
                        <button
                          key={si}
                          onClick={() => sendMessage(s)}
                          style={{ padding: '6px 12px', borderRadius: '20px', border: dark ? '1px solid rgba(22,163,74,0.4)' : '1px solid rgba(22,163,74,0.35)', background: dark ? 'rgba(22,163,74,0.12)' : 'rgba(22,163,74,0.07)', color: dark ? '#4ade80' : '#15803d', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', lineHeight: 1.3 }}
                          onMouseEnter={e => { e.currentTarget.style.background = dark ? 'rgba(22,163,74,0.25)' : 'rgba(22,163,74,0.15)'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 3px 10px rgba(22,163,74,0.2)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = dark ? 'rgba(22,163,74,0.12)' : 'rgba(22,163,74,0.07)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                        >{s}</button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Typing indicator */}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg, #15803d, #22c55e)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="14" height="14" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </div>
                <div style={{ padding: '11px 14px', borderRadius: '16px 16px 16px 4px', background: dark ? '#1e293b' : '#f1f5f9', border: !dark ? '1px solid rgba(0,0,0,0.05)' : 'none', display: 'flex', gap: '5px', alignItems: 'center' }}>
                  {[0,1,2].map(d => <span key={d} style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#16a34a', display: 'inline-block', animation: `chatDot 1.3s ease-in-out ${d * 0.18}s infinite` }} />)}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* ── Quick action chips ─────────────────────────────────────────── */}
          {showQuick && messages.length <= 1 && !voiceChatMode && (
            <div style={{ padding: '0 14px 10px', flexShrink: 0 }}>
              <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.6px', color: dark ? '#6b7280' : '#9ca3af', margin: '0 0 7px', textTransform: 'uppercase' }}>Quick actions</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {(QUICK_ACTIONS[role] || QUICK_ACTIONS.student).map((qa, qi) => (
                  <button
                    key={qi}
                    onClick={() => sendMessage(qa.text)}
                    style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 11px', borderRadius: '10px', border: dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)', background: dark ? '#1e293b' : '#f8fafc', color: dark ? '#d1d5db' : '#374151', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
                    onMouseEnter={e => { e.currentTarget.style.background = dark ? '#273549' : '#f0fdf4'; e.currentTarget.style.borderColor = '#16a34a'; e.currentTarget.style.color = '#16a34a'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = dark ? '#1e293b' : '#f8fafc'; e.currentTarget.style.borderColor = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'; e.currentTarget.style.color = dark ? '#d1d5db' : '#374151'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <span style={{ fontSize: '14px' }}>{qa.icon}</span>{qa.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ height: '1px', background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', flexShrink: 0 }} />

          {/* ── Voice error toast ─────────────────────────────────────────── */}
          {voiceError && (
            <div style={{ padding: '7px 14px', background: dark ? 'rgba(239,68,68,0.12)' : '#fef2f2', borderBottom: dark ? '1px solid rgba(239,68,68,0.25)' : '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: '7px', flexShrink: 0, animation: 'chatSlideUp 0.2s ease-out' }}>
              <svg width="14" height="14" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span style={{ fontSize: '11px', color: dark ? '#fca5a5' : '#b91c1c', flex: 1 }}>{voiceError}</span>
              <button onClick={() => setVoiceError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0', color: dark ? '#fca5a5' : '#b91c1c', fontSize: '14px', lineHeight: 1 }}>×</button>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              VOICE CHAT MODE PANEL
              ═══════════════════════════════════════════════════════════════ */}
          {voiceChatMode ? (
            <div style={{ padding: '20px 18px 18px', background: dark ? '#0f172a' : '#f8fafc', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
              {/* State label */}
              <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: vcState === 'listening' ? '#22c55e' : vcState === 'processing' ? '#f59e0b' : vcState === 'speaking' ? '#60a5fa' : dark ? '#6b7280' : '#9ca3af' }}>
                {vc.label}
              </p>

              {/* Orb + waveform */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px' }}>
                {/* Pulse ring */}
                {vcState !== 'idle' && (
                  <div style={{ position: 'absolute', width: '80px', height: '80px', borderRadius: '50%', background: vc.ring, animation: 'orbRing 1.4s ease-out infinite' }} />
                )}
                <div style={{ position: 'absolute', width: '68px', height: '68px', borderRadius: '50%', background: vc.ring, animation: vcState !== 'idle' ? 'orbRing 1.4s ease-out 0.3s infinite' : 'none' }} />

                {/* Main orb */}
                <button
                  onClick={() => {
                    if (vcState === 'listening') {
                      recognitionRef.current?.stop();
                      setVcState('idle');
                      vcAutoLoopRef.current = false;
                    } else if (vcState === 'speaking') {
                      window.speechSynthesis?.cancel();
                      setIsSpeaking(false);
                      setVcState('idle');
                    } else if (vcState === 'idle') {
                      vcAutoLoopRef.current = true;
                      setVcState('listening');
                      startListeningVC();
                    }
                  }}
                  style={{ width: '56px', height: '56px', borderRadius: '50%', background: `radial-gradient(circle at 35% 35%, ${vcState === 'idle' ? (dark ? '#374151' : '#e2e8f0') : vc.orb}, ${vcState === 'idle' ? (dark ? '#1f2937' : '#cbd5e1') : vc.orb + 'cc'})`, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1, boxShadow: vcState !== 'idle' ? `0 0 24px ${vc.orb}66` : 'none', transition: 'all 0.3s' }}
                >
                  {vcState === 'processing' ? (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  ) : vcState === 'speaking' ? (
                    <svg width="22" height="22" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
                  ) : (
                    <svg width="22" height="22" fill="none" stroke={vcState === 'listening' ? 'white' : (dark ? '#9ca3af' : '#6b7280')} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10a7 7 0 0 1-14 0"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                  )}
                </button>
              </div>

              {/* Waveform bars */}
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center', height: '22px' }}>
                {[0,1,2,3,4,5,6].map(d => (
                  <span key={d} style={{ width: '4px', borderRadius: '2px', background: vcState === 'listening' ? '#22c55e' : vcState === 'speaking' ? '#60a5fa' : vcState === 'processing' ? '#f59e0b' : (dark ? '#374151' : '#d1d5db'), display: 'inline-block', height: vcState !== 'idle' ? '100%' : '6px', animation: vcState !== 'idle' ? `vcWave 0.6s ease-in-out ${d * 0.08}s infinite alternate` : 'none', transition: 'height 0.3s, background 0.3s' }} />
                ))}
              </div>

              {/* Interim transcript */}
              {interimText && (
                <p style={{ margin: 0, fontSize: '12px', color: dark ? '#9ca3af' : '#6b7280', fontStyle: 'italic', textAlign: 'center', maxWidth: '300px' }}>
                  "{interimText}"
                </p>
              )}

              {/* Exit voice chat */}
              <button
                onClick={exitVoiceChat}
                style={{ padding: '7px 18px', borderRadius: '20px', background: dark ? '#1e293b' : '#f1f5f9', border: dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)', color: dark ? '#9ca3af' : '#6b7280', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'; e.currentTarget.style.color = dark ? '#9ca3af' : '#6b7280'; }}
              >
                ✕ Exit Voice Chat
              </button>
            </div>

          ) : (
            /* ─── Normal input area ─────────────────────────────────────── */
            <div style={{ padding: '12px 14px 10px', background: dark ? '#0f172a' : '#ffffff', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', border: dark ? '1.5px solid rgba(255,255,255,0.1)' : '1.5px solid #e2e8f0', borderRadius: '14px', padding: '8px 10px 8px 14px', background: dark ? '#1e293b' : '#f8fafc' }}>
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={interimText ? `${input}${interimText}` : input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isListening ? 'Listening…' : 'Ask anything about SmartMess…'}
                  disabled={loading}
                  maxLength={500}
                  style={{ flex: 1, resize: 'none', border: 'none', padding: '0', fontSize: '13px', lineHeight: 1.5, background: 'transparent', color: interimText ? (dark ? '#6b7280' : '#9ca3af') : (dark ? '#e2e8f0' : '#1e293b'), outline: 'none', fontFamily: 'inherit', maxHeight: '88px', overflowY: 'auto', caretColor: '#16a34a', fontStyle: interimText ? 'italic' : 'normal' }}
                  onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 88) + 'px'; }}
                />
                <div style={{ display: 'flex', gap: '5px', alignItems: 'center', flexShrink: 0 }}>
                  {/* Mic button — always visible */}
                  <button
                    onClick={isListening ? stopListening : startListening}
                    title={isListening ? 'Stop listening' : 'Click to speak'}
                    style={{ width: '34px', height: '34px', borderRadius: '10px', background: isListening ? 'linear-gradient(135deg, #ef4444, #f87171)' : dark ? '#334155' : '#e2e8f0', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.18s', boxShadow: isListening ? '0 3px 12px rgba(239,68,68,0.4)' : 'none', animation: isListening ? 'micPulse 1.2s ease-in-out infinite' : 'none' }}
                    onMouseEnter={e => { if (!isListening) e.currentTarget.style.background = dark ? '#475569' : '#cbd5e1'; }}
                    onMouseLeave={e => { if (!isListening) e.currentTarget.style.background = dark ? '#334155' : '#e2e8f0'; }}
                  >
                    {isListening
                      ? <svg width="14" height="14" fill="white" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
                      : <svg width="15" height="15" fill="none" stroke={dark ? '#94a3b8' : '#64748b'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10a7 7 0 0 1-14 0"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                    }
                  </button>

                  {/* Send button */}
                  <button
                    onClick={() => sendMessage()}
                    disabled={loading || !input.trim()}
                    style={{ width: '34px', height: '34px', borderRadius: '10px', background: loading || !input.trim() ? (dark ? '#334155' : '#e2e8f0') : 'linear-gradient(135deg, #15803d, #22c55e)', border: 'none', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.18s', boxShadow: loading || !input.trim() ? 'none' : '0 3px 12px rgba(22,163,74,0.4)' }}
                    onMouseEnter={e => { if (!loading && input.trim()) e.currentTarget.style.transform = 'scale(1.07)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    <svg width="15" height="15" fill="none" stroke={loading || !input.trim() ? (dark ? '#4b5563' : '#94a3b8') : 'white'} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  </button>
                </div>
              </div>

              {/* Footer row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '7px', paddingLeft: '2px' }}>
                <p style={{ margin: 0, fontSize: '10px', color: dark ? '#374151' : '#cbd5e1' }}>
                  <kbd style={{ padding: '0 3px', borderRadius: '3px', border: dark ? '1px solid #374151' : '1px solid #e2e8f0', fontSize: '9px', fontFamily: 'monospace' }}>Enter</kbd> to send · SmartMess AI
                </p>
                {/* Voice Chat button — always visible */}
                <button
                  onClick={enterVoiceChat}
                  title="Start hands-free voice conversation"
                  style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '8px', border: dark ? '1px solid rgba(22,163,74,0.35)' : '1px solid rgba(22,163,74,0.3)', background: dark ? 'rgba(22,163,74,0.1)' : 'rgba(22,163,74,0.06)', color: dark ? '#4ade80' : '#15803d', fontSize: '11px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = dark ? 'rgba(22,163,74,0.22)' : 'rgba(22,163,74,0.14)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = dark ? 'rgba(22,163,74,0.1)' : 'rgba(22,163,74,0.06)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10a7 7 0 0 1-14 0"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                  🎙 Voice Chat
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Animations ──────────────────────────────────────────────────── */}
      <style>{`
        @keyframes chatSlideUp  { from{opacity:0;transform:translateY(22px) scale(0.95)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes chatDot      { 0%,80%,100%{transform:scale(0.6);opacity:0.35} 40%{transform:scale(1.15);opacity:1} }
        @keyframes chatPulse    { 0%,100%{box-shadow:0 4px 24px rgba(22,163,74,.5),0 0 0 0 rgba(22,163,74,.25)} 50%{box-shadow:0 4px 24px rgba(22,163,74,.5),0 0 0 10px rgba(22,163,74,0)} }
        @keyframes vcWave       { from{transform:scaleY(0.35)} to{transform:scaleY(1)} }
        @keyframes orbRing      { 0%{transform:scale(1);opacity:0.7} 100%{transform:scale(1.7);opacity:0} }
        @keyframes micPulse     { 0%,100%{box-shadow:0 3px 12px rgba(239,68,68,.4)} 50%{box-shadow:0 3px 18px rgba(239,68,68,.7)} }
        @keyframes spin         { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes statusBlink  { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </>
  );
}

