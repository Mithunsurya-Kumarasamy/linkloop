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
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900 via-slate-900 to-black font-sans flex flex-col text-slate-100 selection:bg-indigo-500/30">
        <header className="glass-panel px-6 py-4 flex justify-between items-center sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
              <MessageSquare className="text-white w-5 h-5" />
            </div>
            <h1 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 via-purple-200 to-indigo-200">
              LinkLoop
            </h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-full border border-white/5">
              <div className={`w-2 h-2 rounded-full animate-pulse ${status === 'CONNECTED' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.8)]'}`}></div>
              <span className="text-xs font-semibold tracking-wider text-slate-300">
                {status}
              </span>
            </div>
            {user && (
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-indigo-200">{user}</span>
                <button onClick={() => { setUser(null); ws?.send(JSON.stringify({type: 'DISCONNECT'})); }} className="text-slate-400 hover:text-rose-400 transition-colors p-1.5 rounded-lg hover:bg-rose-500/10">
                  <LogOut size={18} />
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 flex overflow-hidden p-6 max-w-[1600px] w-full mx-auto gap-6">
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
    <div className="m-auto w-full max-w-md">
      <div className="glass-panel p-10 rounded-3xl shadow-2xl relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative z-10">
          <div className="flex justify-center mb-8">
             <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-2xl shadow-xl shadow-indigo-500/20">
              <Zap className="text-white w-8 h-8" />
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-center mb-8 text-white">{isRegister ? 'Join the Loop' : 'Welcome Back'}</h2>
          
          {error && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-sm font-medium flex items-center justify-center">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Username</label>
              <input type="text" required value={username} onChange={e => setUsername(e.target.value)} 
                className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-white transition-all placeholder:text-slate-600" 
                placeholder="Enter your username" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Password</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} 
                className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-white transition-all placeholder:text-slate-600" 
                placeholder="••••••••" />
            </div>
            <button type="submit" 
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-3.5 rounded-xl hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:-translate-y-0.5 transition-all duration-200 mt-2">
              {isRegister ? 'Create Account' : 'Sign In'}
            </button>
          </form>
          
          <div className="mt-8 text-center">
            <button onClick={() => setIsRegister(!isRegister)} className="text-slate-400 text-sm font-medium hover:text-white transition-colors">
              {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </div>
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
    <div className="flex w-full h-full gap-6">
      {/* Sidebar */}
      <div className="w-72 glass-panel rounded-3xl flex flex-col overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Explore Rooms</h2>
          
          <form onSubmit={createRoom} className="mb-4 relative">
            <input type="text" placeholder="Create new room..." value={newRoom} onChange={e => setNewRoom(e.target.value)} 
              className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none pr-10 transition-all placeholder:text-slate-600" />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-400 hover:text-indigo-300 p-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
          </form>
          
          <form onSubmit={joinByCode} className="relative">
            <input type="text" placeholder="Got a code?" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} 
              className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none pr-10 uppercase transition-all placeholder:text-slate-600 placeholder:normal-case" />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-400 hover:text-indigo-300 p-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
            </button>
          </form>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
          {rooms.map(r => (
            <button key={r} onClick={() => joinRoom(r)} 
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center gap-3
                ${currentRoom === r 
                  ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-200 border border-indigo-500/30 shadow-[inset_0_0_20px_rgba(99,102,241,0.1)]' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'}`}>
              <Hash size={16} className={currentRoom === r ? 'text-indigo-400' : 'text-slate-600'} />
              {r}
            </button>
          ))}
          {rooms.length === 0 && (
            <div className="text-center text-slate-600 text-sm p-4">No rooms available. Create one!</div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 glass-panel rounded-3xl overflow-hidden flex flex-col relative shadow-2xl shadow-indigo-900/20">
        {currentRoom ? <ChatRoom ws={ws} room={currentRoom} code={currentCode} username={username} /> : (
          <div className="m-auto text-center">
            <div className="bg-white/5 p-6 rounded-full inline-block mb-6 border border-white/10 shadow-xl">
              <MessageSquare size={48} className="text-indigo-400/50" />
            </div>
            <h3 className="text-xl font-bold text-slate-300 mb-2">No Room Selected</h3>
            <p className="text-slate-500 text-sm max-w-xs mx-auto">Select a room from the sidebar or create a new one to start chatting with others.</p>
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
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
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
      <div className="px-8 py-5 border-b border-white/10 flex justify-between items-center bg-slate-900/40 backdrop-blur-xl z-20">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-500/20 p-2 rounded-lg border border-indigo-500/30">
            <Hash size={20} className="text-indigo-400" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white leading-none mb-1">{room}</h3>
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
              <Users size={12} className="text-indigo-400" /> {users.length} {users.length === 1 ? 'member' : 'members'} online
            </div>
          </div>
        </div>
        
        {code && (
          <div className="flex items-center gap-3 bg-slate-900/60 border border-white/10 px-4 py-2 rounded-xl" title="Share this code for others to join">
            <Key size={14} className="text-purple-400" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Room Code</span>
            <span className="font-mono font-bold text-indigo-300 text-sm bg-indigo-500/10 px-2 py-0.5 rounded">{code}</span>
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-8 space-y-6 relative">
        {messages.map((m, i) => (
          m.type === 'SYS' ? (
            <div key={i} className="flex justify-center my-4">
              <div className="bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-xs font-medium text-slate-400 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                {m.content}
              </div>
            </div>
          ) : (
            <div key={i} className={`flex flex-col max-w-[75%] ${m.sender === username ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
              <span className="text-[11px] font-semibold text-slate-500 mb-1.5 px-1 tracking-wide">{m.sender}</span>
              <div className={`px-5 py-3 text-[15px] leading-relaxed shadow-lg ${
                m.sender === username 
                  ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl rounded-tr-sm shadow-indigo-500/20' 
                  : 'bg-slate-800/80 border border-white/5 text-slate-200 rounded-2xl rounded-tl-sm backdrop-blur-md'
              }`}>
                {m.content}
              </div>
            </div>
          )
        ))}
        <div ref={endRef} />
      </div>
      
      <div className="p-6 bg-slate-900/60 backdrop-blur-xl border-t border-white/10">
        <form onSubmit={sendMsg} className="flex gap-3 relative">
          <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder="Message the room..." 
            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-[15px] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder:text-slate-500 shadow-inner" />
          <button type="submit" 
            className="bg-indigo-500 hover:bg-indigo-400 text-white rounded-2xl px-6 flex items-center justify-center transition-colors shadow-lg shadow-indigo-500/20 group">
            <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </button>
        </form>
      </div>
    </>
  );
}

export default App;
