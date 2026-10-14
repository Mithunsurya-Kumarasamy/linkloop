import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { Send, Users, LogOut, Hash, Key, ArrowLeft, Copy, Check, ChevronDown, ChevronUp, AlertCircle, Scissors } from 'lucide-react';

const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL || 'ws://127.0.0.1:8080';
const MAX_MSG_LENGTH = 60000;

const formatTime = (ts: string) => {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const MessageContent = ({ content, isMe }: { content: string; isMe?: boolean }) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const isLong = content.length > 400 || (content.match(/\n/g) || []).length > 6;

  const displayContent = isLong && !expanded ? content.slice(0, 300) + '...' : content;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = displayContent.split(urlRegex);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group/msg min-w-0 max-w-full">
      <div className={`whitespace-pre-wrap select-text break-all [word-break:break-all] [overflow-wrap:anywhere] text-[13.5px] md:text-[14px] leading-relaxed ${expanded ? 'max-h-80 overflow-y-auto pr-1' : ''}`}>
        {parts.map((part, i) => {
          if (part.match(urlRegex)) {
            return (
              <a
                key={i}
                href={part}
                target="_blank"
                rel="noopener noreferrer"
                className={`${isMe ? 'text-blue-100 underline hover:text-white' : 'text-blue-400 underline hover:text-blue-300'} break-all`}
              >
                {part}
              </a>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </div>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className={`mt-2 text-xs font-semibold flex items-center gap-1 transition-colors underline cursor-pointer ${
            isMe ? 'text-blue-100 hover:text-white' : 'text-blue-400 hover:text-blue-300'
          }`}
        >
          {expanded ? (
            <>
              <ChevronUp size={12} /> Show less
            </>
          ) : (
            <>
              <ChevronDown size={12} /> Show full message ({content.length.toLocaleString()} chars)
            </>
          )}
        </button>
      )}
      {content.length > 60 && (
        <button
          type="button"
          onClick={copyToClipboard}
          className="opacity-0 group-hover/msg:opacity-100 transition-opacity absolute -top-2.5 -right-2 bg-[#222222] text-slate-400 hover:text-white p-1 rounded text-[10px] flex items-center gap-1 border border-[#333333] shadow-md z-10 cursor-pointer"
          title="Copy full text"
        >
          {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      )}
    </div>
  );
};

const LinkLogo = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
  </svg>
);

function App() {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [status, setStatus] = useState('DISCONNECTED');
  const [user, setUser] = useState<string | null>(null);
  
  useEffect(() => {
    let reconnectTimeout: ReturnType<typeof setTimeout>;
    let activeSocket: WebSocket | null = null;

    const connect = () => {
      setStatus('CONNECTING');
      const socket = new WebSocket(GATEWAY_URL);
      activeSocket = socket;
      setWs(socket);
      
      socket.onopen = () => setStatus('CONNECTED');
      socket.onclose = () => {
        setStatus('DISCONNECTED');
        setUser(null);
        reconnectTimeout = setTimeout(connect, 3000);
      };
      socket.onerror = () => setStatus('ERROR');
    };

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      if (activeSocket) activeSocket.close();
    };
  }, []);

  // Ping interval to keep TCP and WebSocket connections hot and avoid sleep drops
  useEffect(() => {
    if (!ws || status !== 'CONNECTED') return;
    const interval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'PING' }));
      }
    }, 25000);
    return () => clearInterval(interval);
  }, [ws, status]);

  return (
    <Router>
      <div className="h-screen h-[100dvh] w-full bg-black font-sans flex flex-col text-slate-200 overflow-hidden">
        <header className="bg-[#111111] border-b border-[#262626] px-3 md:px-6 py-2.5 md:py-3 flex justify-between items-center z-50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="bg-[#0f62fe] p-1.5 rounded">
              <LinkLogo className="text-white w-4 h-4" />
            </div>
            <h1 className="text-base md:text-lg font-bold text-white tracking-tight">
              LinkLoop
            </h1>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <div className="flex items-center gap-1.5 md:gap-2 bg-[#1a1a1a] px-2 py-0.5 md:px-2.5 md:py-1 rounded-md border border-[#262626]">
              <div className={`w-2 h-2 rounded-full ${status === 'CONNECTED' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
              <span className="text-[10px] md:text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                {status}
              </span>
            </div>
            {user && (
              <>
                <div className="w-px h-4 md:h-5 bg-[#333333]"></div>
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-[#1a1a1a] border border-[#333333] flex items-center justify-center text-[11px] md:text-xs font-bold text-slate-300 uppercase">
                    {user.charAt(0)}
                  </div>
                  <span className="text-xs md:text-sm font-medium text-slate-300 max-w-[70px] sm:max-w-none truncate">{user}</span>
                  <button onClick={() => { setUser(null); ws?.send(JSON.stringify({type: 'DISCONNECT'})); }} className="text-slate-500 hover:text-red-500 transition-colors p-1" title="Log Out">
                    <LogOut size={15} />
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        <main className="flex-1 min-h-0 flex flex-col overflow-hidden w-full h-full relative">
          <Routes>
            <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Login ws={ws} setUser={setUser} />} />
            <Route path="/dashboard" element={user ? <Dashboard ws={ws} username={user} /> : <Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

function Login({ ws, setUser }: { ws: WebSocket | null, setUser: (u: string) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!ws) return;
    const handler = (ev: MessageEvent) => {
      const data = JSON.parse(ev.data);
      if (data.type === 'AUTH_OK' || data.type === 'REGISTER_OK') {
        setUser(username);
        navigate('/dashboard');
      } else if (data.type === 'ERROR') {
        setError(data.message);
      }
    };
    ws.addEventListener('message', handler);
    return () => ws.removeEventListener('message', handler);
  }, [ws, username, setUser, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ws && ws.readyState === WebSocket.OPEN) {
      setError('');
      ws.send(JSON.stringify({
        type: isRegister ? 'REGISTER' : 'AUTH',
        username,
        password
      }));
    }
  };

  return (
    <div className="m-auto w-full max-w-[400px]">
      <div className="panel p-8 rounded-lg">
        <div className="flex justify-center mb-6">
           <div className="bg-[#0f62fe] p-3 rounded-lg shadow-sm">
            <LinkLogo className="text-white w-6 h-6" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center mb-2 text-white">{isRegister ? 'Create an account' : 'Sign in to LinkLoop'}</h2>
        <p className="text-center text-sm text-slate-400 mb-6">Enterprise-grade multiroom communication</p>
        
        {error && (
          <div className="mb-6 p-3 bg-red-900/30 border border-red-800 text-red-400 rounded text-sm font-medium flex items-center justify-center">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Username</label>
            <input type="text" required value={username} onChange={e => setUsername(e.target.value)} 
              className="input-field w-full px-3 py-2 rounded-md text-sm placeholder:text-slate-600" 
              placeholder="Enter your username" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Password</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} 
              className="input-field w-full px-3 py-2 rounded-md text-sm placeholder:text-slate-600" 
              placeholder="Enter your password" />
          </div>
          <button type="submit" 
            className="w-full bg-[#0f62fe] hover:bg-blue-600 text-white font-medium py-2.5 rounded-md transition-colors mt-2 text-sm shadow-sm">
            {isRegister ? 'Register Account' : 'Sign In'}
          </button>
        </form>
        
        <div className="mt-6 text-center border-t border-[#262626] pt-6">
          <button onClick={() => setIsRegister(!isRegister)} className="text-[#0f62fe] font-medium text-sm hover:underline transition-colors">
            {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ ws, username }: { ws: WebSocket | null, username: string }) {
  const [rooms, setRooms] = useState<string[]>([]);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [currentCode, setCurrentCode] = useState<string | null>(null);
  const [newRoom, setNewRoom] = useState('');
  const [joinCode, setJoinCode] = useState('');

  useEffect(() => {
    if (!ws) return;
    ws.send(JSON.stringify({ type: 'LIST_ROOMS' }));
    
    const handler = (ev: MessageEvent) => {
      const data = JSON.parse(ev.data);
      if (data.type === 'ROOM_LIST') {
        setRooms(data.rooms || []);
      } else if (data.type === 'CREATE_OK' || data.type === 'JOIN_OK') {
        setCurrentRoom(data.room);
        setCurrentCode(data.code || null);
        ws.send(JSON.stringify({ type: 'LIST_ROOMS' }));
      } else if (data.type === 'LEAVE_OK') {
        if (currentRoom === data.room) {
          setCurrentRoom(null);
          setCurrentCode(null);
        }
        ws.send(JSON.stringify({ type: 'LIST_ROOMS' }));
      }
    };
    ws.addEventListener('message', handler);
    return () => ws.removeEventListener('message', handler);
  }, [ws, currentRoom]);

  const joinRoom = (room: string) => {
    if (room === currentRoom) return;
    ws?.send(JSON.stringify({ type: 'JOIN_ROOM', room }));
  };

  const leaveRoom = (room: string) => {
    ws?.send(JSON.stringify({ type: 'LEAVE_ROOM', room }));
    if (currentRoom === room) {
      setCurrentRoom(null);
      setCurrentCode(null);
    }
  };

  const createRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (newRoom.trim()) {
      ws?.send(JSON.stringify({ type: 'CREATE_ROOM', room: newRoom.trim() }));
      setNewRoom('');
    }
  };

  const joinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.trim()) {
      ws?.send(JSON.stringify({ type: 'JOIN_BY_CODE', code: joinCode.trim().toUpperCase() }));
      setJoinCode('');
    }
  };

  return (
    <div className="flex w-full h-full min-h-0 flex-1 overflow-hidden">
      {/* Sidebar */}
      <div className={`${currentRoom ? 'hidden md:flex' : 'flex'} w-full md:w-[280px] bg-black border-r border-[#262626] flex-col shrink-0 h-full min-h-0`}>
        <div className="p-4 shrink-0">
          <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">Workspaces</h2>
          
          <form onSubmit={createRoom} className="mb-2">
            <div className="flex gap-2">
              <input type="text" placeholder="Create new channel" value={newRoom} onChange={e => setNewRoom(e.target.value)} 
                className="input-field w-full px-2.5 py-1.5 rounded-md text-xs placeholder:text-slate-600" />
              <button type="submit" className="bg-[#262626] text-slate-300 px-2.5 py-1.5 rounded-md text-xs font-medium hover:bg-[#333333] transition-colors">+</button>
            </div>
          </form>
          
          <form onSubmit={joinByCode}>
            <div className="flex gap-2">
              <input type="text" placeholder="Enter channel code" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} 
                className="input-field w-full px-2.5 py-1.5 rounded-md text-xs uppercase placeholder:normal-case placeholder:text-slate-600" />
              <button type="submit" className="bg-[#0f62fe] text-white px-2.5 py-1.5 rounded-md text-xs font-medium hover:bg-blue-600 transition-colors">Join</button>
            </div>
          </form>
        </div>
        
        <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2 space-y-0.5">
          {rooms.map(r => (
            <button key={r} onClick={() => joinRoom(r)} 
              className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2.5
                ${currentRoom === r 
                  ? 'bg-[#0f62fe]/10 text-[#0f62fe] font-semibold' 
                  : 'text-slate-400 hover:bg-[#111111] hover:text-slate-200'}`}>
              <Hash size={14} className={currentRoom === r ? 'text-[#0f62fe]' : 'text-slate-500'} />
              <span className="truncate">{r}</span>
            </button>
          ))}
          {rooms.length === 0 && (
            <div className="text-center text-slate-500 text-xs p-4 font-medium">No active channels.</div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`${!currentRoom ? 'hidden md:flex' : 'flex'} flex-1 h-full min-h-0 bg-[#111111] flex flex-col relative overflow-hidden`}>
        {currentRoom ? (
          <ChatRoom 
            ws={ws} 
            room={currentRoom} 
            code={currentCode} 
            username={username} 
            onBack={() => setCurrentRoom(null)} 
            onLeave={leaveRoom}
          />
        ) : (
          <div className="m-auto text-center max-w-md p-6">
            <div className="bg-black w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#262626]">
              <LinkLogo className="text-slate-600 w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Select a channel</h3>
            <p className="text-slate-500 text-sm">Choose an existing channel from the sidebar or create a new one to start collaborating.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ChatRoom({ 
  ws, 
  room, 
  code, 
  username, 
  onBack, 
  onLeave 
}: { 
  ws: WebSocket | null, 
  room: string, 
  code: string | null, 
  username: string, 
  onBack: () => void,
  onLeave: (room: string) => void
}) {
  const [messages, setMessages] = useState<any[]>([]);
  const [users, setUsers] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isOverLimit = input.length > MAX_MSG_LENGTH;
  const charsOver = input.length - MAX_MSG_LENGTH;

  useEffect(() => {
    setMessages([]);
    if (!ws) return;
    ws.send(JSON.stringify({ type: 'LIST_USERS', room }));
    
    const handler = (ev: MessageEvent) => {
      const data = JSON.parse(ev.data);
      if (data.type === 'MESSAGE' && data.room === room) {
        setMessages(prev => {
          if (data.id && prev.some(m => m.id === data.id)) return prev;
          if (prev.some(m => m.sender === data.sender && m.content === data.content && m.timestamp === data.timestamp)) return prev;
          return [...prev, data];
        });
      } else if (data.type === 'NOTIFICATION' && data.room === room) {
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last && last.type === 'SYS' && last.content === data.content) return prev;
          return [...prev, { type: 'SYS', content: data.content }];
        });
        ws.send(JSON.stringify({ type: 'LIST_USERS', room }));
      } else if (data.type === 'USER_LIST' && data.room === room) {
        setUsers(data.users || []);
      } else if (data.type === 'ERROR') {
        setErrorBanner(data.message || 'An error occurred');
      }
    };
    ws.addEventListener('message', handler);
    return () => ws.removeEventListener('message', handler);
  }, [ws, room]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);
    if (val.length <= MAX_MSG_LENGTH && errorBanner?.includes('exceeds limit')) {
      setErrorBanner(null);
    }
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  };

  const handleTrim = () => {
    setInput(prev => prev.slice(0, MAX_MSG_LENGTH));
    setErrorBanner(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (isOverLimit) {
        setErrorBanner(`Message limit exceeded by ${charsOver.toLocaleString()} characters! You cannot send this message. Please trim the message.`);
        return;
      }
      sendMsg();
    }
  };

  const sendMsg = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isOverLimit) {
      setErrorBanner(`Message limit exceeded by ${charsOver.toLocaleString()} characters! You cannot send this message. Please trim the message.`);
      return;
    }
    if (input.trim() && ws) {
      ws.send(JSON.stringify({ type: 'MESSAGE', room, content: input.trim() }));
      setInput('');
      setErrorBanner(null);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  return (
    <div className="flex flex-col h-full w-full min-h-0 overflow-hidden">
      <div className="px-3 py-2.5 md:px-6 md:py-3.5 border-b border-[#262626] flex justify-between items-center bg-[#111111] z-20 shadow-sm shrink-0 gap-2">
        <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
          <button 
            onClick={onBack} 
            className="text-slate-400 hover:text-white transition-colors p-1.5 -ml-1 rounded-md hover:bg-[#1a1a1a] shrink-0 touch-manipulation" 
            title="Return to channel list"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="bg-[#1a1a1a] p-1.5 rounded text-slate-400 shrink-0 hidden sm:block">
            <Hash size={15} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-sm md:text-[15px] text-white leading-tight truncate">{room}</h3>
            <div className="flex items-center gap-1 text-[10px] md:text-[11px] font-medium text-slate-400 mt-0.5">
              <Users size={10} /> <span>{users.length} {users.length === 1 ? 'member' : 'members'} online</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
          {code && (
            <div className="flex items-center gap-1 md:gap-1.5 bg-[#1a1a1a] px-2 py-1 md:px-2.5 md:py-1.5 rounded-md border border-[#262626]" title="Share this code for others to join">
              <Key size={11} className="text-slate-400 hidden sm:inline" />
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide hidden sm:inline">Code:</span>
              <span className="font-mono font-bold text-slate-200 text-[11px] md:text-xs bg-[#262626] px-1.5 py-0.5 border border-[#333333] rounded select-all">{code}</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(code);
                  setCopiedCode(true);
                  setTimeout(() => setCopiedCode(false), 2000);
                }}
                className="text-slate-400 hover:text-white transition-colors p-0.5 touch-manipulation"
                title="Copy code"
              >
                {copiedCode ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              if (window.confirm(`Leave #${room}? You will be removed from this channel.`)) {
                onLeave(room);
              }
            }}
            className="flex items-center gap-1 md:gap-1.5 px-2 md:px-2.5 py-1 md:py-1.5 rounded-md text-xs font-semibold text-red-400 bg-red-950/20 border border-red-900/40 hover:bg-red-900/40 hover:text-red-300 transition-colors shadow-sm cursor-pointer shrink-0 touch-manipulation"
            title="Leave this room"
          >
            <LogOut size={12} className="rotate-180" />
            <span className="hidden sm:inline">Leave Room</span>
          </button>
        </div>
      </div>
      
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-6 space-y-3.5 md:space-y-4">
        {messages.map((m, i) => {
          const isMe = m.sender === username;
          const msgKey = m.id ? `msg-${m.id}` : `${m.type}-${m.sender || 'sys'}-${m.timestamp || i}-${i}`;
          return m.type === 'SYS' ? (
            <div key={msgKey} className="flex justify-center my-2.5">
              <span className="text-[10.5px] md:text-[11px] font-medium text-slate-400 bg-[#1a1a1a] px-3 py-1 rounded-full border border-[#262626] shadow-sm">
                {m.content}
              </span>
            </div>
          ) : (
            <div key={msgKey} className={`flex flex-col min-w-0 max-w-[85%] md:max-w-[75%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
              <div className="flex items-baseline gap-1.5 mb-1 px-1">
                <span className="text-[11px] md:text-xs font-semibold text-slate-400">{m.sender}</span>
                {m.timestamp && <span className="text-[9px] text-[#52525b]">{formatTime(m.timestamp)}</span>}
              </div>
              <div className={`px-3.5 py-2 md:px-4 md:py-2.5 text-[13.5px] md:text-[14px] leading-relaxed shadow-sm min-w-0 max-w-full break-all [word-break:break-all] [overflow-wrap:anywhere] ${
                isMe 
                  ? 'bg-[#0f62fe] text-white rounded-2xl rounded-tr-sm' 
                  : 'bg-[#1a1a1a] border border-[#262626] text-slate-200 rounded-2xl rounded-tl-sm'
              }`}>
                <MessageContent content={m.content} isMe={isMe} />
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      
      <div className="p-2.5 sm:p-3 md:p-4 pb-[max(0.65rem,env(safe-area-inset-bottom))] bg-[#111111] border-t border-[#262626] shrink-0 mt-auto">
        {(isOverLimit || errorBanner) && (
          <div className="max-w-4xl mx-auto mb-2.5 p-2.5 sm:p-3 rounded-lg bg-red-950/80 border border-red-500/70 text-red-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shadow-lg">
            <div className="flex items-start sm:items-center gap-2 min-w-0">
              <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5 sm:mt-0" />
              <span className="font-medium text-red-200 leading-snug">
                {isOverLimit 
                  ? `Message limit exceeded by ${charsOver.toLocaleString()} characters! You cannot send this message. Please trim the message.` 
                  : errorBanner}
              </span>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              {isOverLimit && (
                <button
                  type="button"
                  onClick={handleTrim}
                  className="px-2.5 py-1.5 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white rounded-md text-xs font-semibold shrink-0 transition-colors flex items-center gap-1.5 shadow cursor-pointer touch-manipulation"
                  title="Trim message to exactly 60,000 characters"
                >
                  <Scissors size={13} />
                  <span>Trim message</span>
                </button>
              )}
              {!isOverLimit && errorBanner && (
                <button
                  type="button"
                  onClick={() => setErrorBanner(null)}
                  className="text-red-300 hover:text-white text-xs px-2 py-1 rounded bg-red-900/40 hover:bg-red-900/80 transition-colors"
                >
                  Dismiss
                </button>
              )}
            </div>
          </div>
        )}

        {input.length > 1000 && (
          <div className="flex justify-end max-w-4xl mx-auto px-1 mb-1">
            <span className={`text-[11px] font-mono font-medium ${isOverLimit ? 'text-red-400 font-bold' : input.length > 50000 ? 'text-amber-400' : 'text-slate-500'}`}>
              {input.length.toLocaleString()} / {MAX_MSG_LENGTH.toLocaleString()} characters
              {isOverLimit && ` (${charsOver.toLocaleString()} over limit)`}
            </span>
          </div>
        )}

        <form onSubmit={sendMsg} className="flex items-end gap-2 max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={isOverLimit ? "Message exceeds limit! Please trim your message to send." : `Message #${room} (Enter to send, Shift+Enter for new line)`}
              className={`input-field w-full rounded-md px-3.5 py-2 md:py-2.5 text-[16px] sm:text-sm transition-colors shadow-sm resize-none overflow-y-auto max-h-36 leading-relaxed block ${
                isOverLimit 
                  ? 'border-red-500 focus:border-red-500 ring-1 ring-red-500/70 bg-red-950/20 text-red-100 placeholder:text-red-400/70' 
                  : ''
              }`}
            />
          </div>
          <button 
            type="submit" 
            disabled={!input.trim() || isOverLimit}
            className={`rounded-md p-2.5 sm:px-4 md:px-5 min-h-[42px] min-w-[42px] flex items-center justify-center transition-colors shadow-sm shrink-0 active:scale-95 touch-manipulation ${
              isOverLimit 
                ? 'bg-red-900/40 border border-red-700/50 text-red-400 opacity-60 cursor-not-allowed' 
                : 'bg-[#0f62fe] hover:bg-blue-600 disabled:opacity-40 disabled:hover:bg-[#0f62fe] disabled:cursor-not-allowed text-white cursor-pointer'
            }`}
            title={isOverLimit ? `Cannot send: message exceeds limit by ${charsOver.toLocaleString()} characters. Please trim your message.` : 'Send message'}
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;
