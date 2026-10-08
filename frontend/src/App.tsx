import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { Send, Users, LogOut, MessageSquare, Hash, Zap, Key } from 'lucide-react';

const GATEWAY_URL = 'ws://127.0.0.1:8080';

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
      <div className="min-h-screen bg-[#0f111a] font-sans flex flex-col text-slate-200">
        <header className="bg-[#1e293b] border-b border-slate-700 px-6 py-3 flex justify-between items-center z-50">
          <div className="flex items-center gap-2">
            <MessageSquare className="text-indigo-500 w-5 h-5" />
            <h1 className="text-xl font-bold text-white tracking-tight">
              LinkLoop
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${status === 'CONNECTED' ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                {status}
              </span>
            </div>
            {user && (
              <>
                <div className="w-px h-4 bg-slate-700"></div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-slate-200">{user}</span>
                  <button onClick={() => { setUser(null); ws?.send(JSON.stringify({type: 'DISCONNECT'})); }} className="text-slate-400 hover:text-white transition-colors" title="Log Out">
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
    <div className="m-auto w-full max-w-sm">
      <div className="panel p-8 rounded-lg shadow-xl">
        <div className="flex justify-center mb-6">
           <div className="bg-indigo-600 p-3 rounded-md">
            <Zap className="text-white w-6 h-6" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center mb-6 text-white">{isRegister ? 'Create Account' : 'Sign In'}</h2>
        
        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded text-sm text-center">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">USERNAME</label>
            <input type="text" required value={username} onChange={e => setUsername(e.target.value)} 
              className="input-field w-full px-3 py-2 rounded text-sm" 
              placeholder="Enter username" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">PASSWORD</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} 
              className="input-field w-full px-3 py-2 rounded text-sm" 
              placeholder="Enter password" />
          </div>
          <button type="submit" 
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded transition-colors mt-2 text-sm">
            {isRegister ? 'Sign Up' : 'Log In'}
          </button>
        </form>
        
        <div className="mt-6 text-center border-t border-slate-700 pt-4">
          <button onClick={() => setIsRegister(!isRegister)} className="text-slate-400 text-xs hover:text-white transition-colors">
            {isRegister ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
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
      <div className="w-64 bg-[#111827] border-r border-slate-800 flex flex-col">
        <div className="p-4 border-b border-slate-800">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Channels</h2>
          
          <form onSubmit={createRoom} className="mb-3">
            <div className="flex gap-2">
              <input type="text" placeholder="New room..." value={newRoom} onChange={e => setNewRoom(e.target.value)} 
                className="input-field w-full px-2 py-1.5 rounded text-xs" />
              <button type="submit" className="bg-slate-700 text-white px-2.5 py-1.5 rounded text-xs hover:bg-slate-600 transition-colors">+</button>
            </div>
          </form>
          
          <form onSubmit={joinByCode}>
            <div className="flex gap-2">
              <input type="text" placeholder="Room code..." value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} 
                className="input-field w-full px-2 py-1.5 rounded text-xs uppercase placeholder:normal-case" />
              <button type="submit" className="bg-slate-700 text-white px-2.5 py-1.5 rounded text-xs hover:bg-slate-600 transition-colors">Join</button>
            </div>
          </form>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {rooms.map(r => (
            <button key={r} onClick={() => joinRoom(r)} 
              className={`w-full text-left px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-2
                ${currentRoom === r 
                  ? 'bg-indigo-600 text-white' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
              <Hash size={14} className={currentRoom === r ? 'text-indigo-200' : 'text-slate-500'} />
              {r}
            </button>
          ))}
          {rooms.length === 0 && (
            <div className="text-center text-slate-600 text-xs p-4">No rooms available.</div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-[#1e293b] flex flex-col relative">
        {currentRoom ? <ChatRoom ws={ws} room={currentRoom} code={currentCode} username={username} /> : (
          <div className="m-auto text-center">
            <MessageSquare size={40} className="text-slate-700 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-400 mb-1">No channel selected</h3>
            <p className="text-slate-600 text-sm">Choose a channel from the sidebar to start chatting.</p>
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
      <div className="px-6 py-3 border-b border-slate-700 flex justify-between items-center bg-[#1e293b] z-20">
        <div className="flex items-center gap-2">
          <Hash size={18} className="text-slate-400" />
          <h3 className="font-bold text-md text-white">{room}</h3>
          <div className="w-px h-4 bg-slate-700 mx-2"></div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <Users size={12} /> {users.length} {users.length === 1 ? 'member' : 'members'}
          </div>
        </div>
        
        {code && (
          <div className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded border border-slate-700" title="Share this code for others to join">
            <Key size={12} className="text-slate-400" />
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Code:</span>
            <span className="font-mono font-bold text-slate-200 text-xs">{code}</span>
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((m, i) => {
          const isMe = m.sender === username;
          return m.type === 'SYS' ? (
            <div key={i} className="flex justify-center my-2">
              <span className="text-[11px] text-slate-500 bg-slate-800/50 px-3 py-1 rounded-full">{m.content}</span>
            </div>
          ) : (
            <div key={i} className={`flex flex-col max-w-[85%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
              <div className="flex items-baseline gap-2 mb-1 px-1">
                <span className="text-xs font-semibold text-slate-300">{m.sender}</span>
                {/* Could add timestamp here in the future */}
              </div>
              <div className={`px-4 py-2 text-sm leading-relaxed rounded-md ${
                isMe 
                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                  : 'bg-slate-700 text-slate-100 rounded-tl-none'
              }`}>
                {m.content}
              </div>
            </div>
          )
        })}
        <div ref={endRef} />
      </div>
      
      <div className="p-4 bg-[#1e293b] border-t border-slate-700">
        <form onSubmit={sendMsg} className="flex gap-2">
          <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder={`Message #${room}`} 
            className="input-field flex-1 rounded-md px-4 py-2.5 text-sm transition-colors" />
          <button type="submit" 
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-md px-4 flex items-center justify-center transition-colors">
            <Send size={18} />
          </button>
        </form>
      </div>
    </>
  );
}

export default App;
