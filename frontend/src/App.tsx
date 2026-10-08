import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { Send, Users, LogOut, Hash, Zap, Key } from 'lucide-react';

const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL || 'ws://127.0.0.1:8080';

const formatTime = (ts: string) => {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const MessageContent = ({ content }: { content: string }) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = content.split(urlRegex);
  return (
    <>
      {parts.map((part, i) => {
        if (part.match(urlRegex)) {
          return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{part}</a>;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
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
    connect();
    return () => {
      if (ws) ws.close();
    };
  }, []);

  const connect = () => {
    setStatus('CONNECTING');
    const socket = new WebSocket(GATEWAY_URL);
    
    socket.onopen = () => setStatus('CONNECTED');
    socket.onclose = () => {
      setStatus('DISCONNECTED');
      setTimeout(connect, 3000);
    };
    socket.onerror = () => setStatus('ERROR');
    
    setWs(socket);
  };

  return (
    <Router>
      <div className="min-h-screen bg-black font-sans flex flex-col text-slate-200">
        <header className="bg-[#111111] border-b border-[#262626] px-6 py-3 flex justify-between items-center z-50">
          <div className="flex items-center gap-2.5">
            <div className="bg-[#0f62fe] p-1.5 rounded">
              <LinkLogo className="text-white w-4 h-4" />
            </div>
            <h1 className="text-lg font-bold text-white tracking-tight">
              LinkLoop
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-[#1a1a1a] px-2.5 py-1 rounded-md border border-[#262626]">
              <div className={`w-2 h-2 rounded-full ${status === 'CONNECTED' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                {status}
              </span>
            </div>
            {user && (
              <>
                <div className="w-px h-5 bg-[#333333]"></div>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#1a1a1a] border border-[#333333] flex items-center justify-center text-xs font-bold text-slate-300 uppercase">
                    {user.charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-slate-300">{user}</span>
                  <button onClick={() => { setUser(null); ws?.send(JSON.stringify({type: 'DISCONNECT'})); }} className="text-slate-500 hover:text-red-500 transition-colors p-1" title="Log Out">
                    <LogOut size={16} />
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        <main className="flex-1 flex overflow-hidden">
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
        setRooms(data.rooms);
      } else if (data.type === 'CREATE_OK' || data.type === 'JOIN_OK') {
        setCurrentRoom(data.room);
        setCurrentCode(data.code || null);
        ws.send(JSON.stringify({ type: 'LIST_ROOMS' }));
      }
    };
    ws.addEventListener('message', handler);
    return () => ws.removeEventListener('message', handler);
  }, [ws]);

  const joinRoom = (room: string) => {
    ws?.send(JSON.stringify({ type: 'JOIN_ROOM', room }));
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
    <div className="flex w-full h-full">
      {/* Sidebar */}
      <div className="w-[280px] bg-black border-r border-[#262626] flex flex-col">
        <div className="p-4">
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
        
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
          {rooms.map(r => (
            <button key={r} onClick={() => joinRoom(r)} 
              className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2.5
                ${currentRoom === r 
                  ? 'bg-[#0f62fe]/10 text-[#0f62fe]' 
                  : 'text-slate-400 hover:bg-[#111111] hover:text-slate-200'}`}>
              <Hash size={14} className={currentRoom === r ? 'text-[#0f62fe]' : 'text-slate-500'} />
              {r}
            </button>
          ))}
          {rooms.length === 0 && (
            <div className="text-center text-slate-500 text-xs p-4 font-medium">No active channels.</div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-[#111111] flex flex-col relative">
        {currentRoom ? <ChatRoom ws={ws} room={currentRoom} code={currentCode} username={username} /> : (
          <div className="m-auto text-center max-w-md">
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

function ChatRoom({ ws, room, code, username }: { ws: WebSocket | null, room: string, code: string | null, username: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [users, setUsers] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([]);
    if (!ws) return;
    ws.send(JSON.stringify({ type: 'LIST_USERS', room }));
    
    const handler = (ev: MessageEvent) => {
      const data = JSON.parse(ev.data);
      if (data.type === 'MESSAGE' && data.room === room) {
        setMessages(prev => [...prev, data]);
      } else if (data.type === 'NOTIFICATION' && data.room === room) {
        setMessages(prev => [...prev, { type: 'SYS', content: data.content }]);
        ws.send(JSON.stringify({ type: 'LIST_USERS', room }));
      } else if (data.type === 'USER_LIST' && data.room === room) {
        setUsers(data.users);
      }
    };
    ws.addEventListener('message', handler);
    return () => ws.removeEventListener('message', handler);
  }, [ws, room]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [messages]);

  const sendMsg = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && ws) {
      ws.send(JSON.stringify({ type: 'MESSAGE', room, content: input.trim() }));
      setInput('');
    }
  };

  return (
    <>
      <div className="px-6 py-4 border-b border-[#262626] flex justify-between items-center bg-[#111111] z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-[#1a1a1a] p-1.5 rounded text-slate-400">
            <Hash size={16} />
          </div>
          <div>
            <h3 className="font-bold text-[15px] text-white leading-tight">{room}</h3>
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 mt-0.5">
              <Users size={10} /> {users.length} {users.length === 1 ? 'member' : 'members'} online
            </div>
          </div>
        </div>
        
        {code && (
          <div className="flex items-center gap-2 bg-[#1a1a1a] px-3 py-1.5 rounded-md border border-[#262626]" title="Share this code for others to join">
            <Key size={12} className="text-slate-400" />
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Join Code:</span>
            <span className="font-mono font-bold text-slate-200 text-xs bg-[#262626] px-1.5 py-0.5 border border-[#333333] rounded">{code}</span>
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {messages.map((m, i) => {
          const isMe = m.sender === username;
          return m.type === 'SYS' ? (
            <div key={i} className="flex justify-center my-4">
              <span className="text-[11px] font-medium text-slate-400 bg-[#1a1a1a] px-3 py-1 rounded-full border border-[#262626]">{m.content}</span>
            </div>
          ) : (
            <div key={i} className={`flex flex-col max-w-[70%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
              <div className="flex items-baseline gap-2 mb-1 px-1">
                <span className="text-xs font-semibold text-slate-400">{m.sender}</span>
                {m.timestamp && <span className="text-[9px] text-[#52525b]">{formatTime(m.timestamp)}</span>}
              </div>
              <div className={`px-4 py-2.5 text-[14px] leading-relaxed shadow-sm break-words ${
                isMe 
                  ? 'bg-[#0f62fe] text-white rounded-2xl rounded-tr-sm' 
                  : 'bg-[#1a1a1a] border border-[#262626] text-slate-200 rounded-2xl rounded-tl-sm'
              }`}>
                <MessageContent content={m.content} />
              </div>
            </div>
          )
        })}
        <div ref={endRef} />
      </div>
      
      <div className="p-4 bg-[#111111] border-t border-[#262626]">
        <form onSubmit={sendMsg} className="flex gap-2 max-w-4xl mx-auto">
          <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder={`Message #${room}`} 
            className="input-field flex-1 rounded-md px-4 py-2.5 text-sm transition-colors shadow-sm" />
          <button type="submit" 
            className="bg-[#0f62fe] hover:bg-blue-600 text-white rounded-md px-5 flex items-center justify-center transition-colors shadow-sm">
            <Send size={18} />
          </button>
        </form>
      </div>
    </>
  );
}

export default App;
