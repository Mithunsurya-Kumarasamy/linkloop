import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { Send, Users, LogOut, MessageSquare } from 'lucide-react';

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
      <div className="min-h-screen bg-slate-100 font-sans flex flex-col">
        <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <MessageSquare className="text-blue-600" />
            <h1 className="text-xl font-bold text-slate-800">LinkLoop</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className={`text-xs px-2 py-1 rounded-full ${status === 'CONNECTED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {status}
            </span>
            {user && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{user}</span>
                <button onClick={() => { setUser(null); ws?.send(JSON.stringify({type: 'DISCONNECT'})); }} className="text-slate-500 hover:text-slate-800">
                  <LogOut size={18} />
                </button>
              </div>
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
    <div className="m-auto w-full max-w-md p-8 bg-white rounded-xl shadow-lg border border-slate-200">
      <h2 className="text-2xl font-bold text-center mb-6">{isRegister ? 'Create Account' : 'Welcome Back'}</h2>
      {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
          <input type="text" required value={username} onChange={e => setUsername(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
          <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 transition">
          {isRegister ? 'Sign Up' : 'Sign In'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-600">
        {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button onClick={() => setIsRegister(!isRegister)} className="text-blue-600 font-medium hover:underline">
          {isRegister ? 'Sign In' : 'Sign Up'}
        </button>
      </p>
    </div>
  );
}

function Dashboard({ ws, username }: { ws: WebSocket | null, username: string }) {
  const [rooms, setRooms] = useState<string[]>([]);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [newRoom, setNewRoom] = useState('');

  useEffect(() => {
    if (!ws) return;
    ws.send(JSON.stringify({ type: 'LIST_ROOMS' }));
    
    const handler = (ev: MessageEvent) => {
      const data = JSON.parse(ev.data);
      if (data.type === 'ROOM_LIST') {
        setRooms(data.rooms);
      } else if (data.type === 'CREATE_OK' || data.type === 'JOIN_OK') {
        setCurrentRoom(data.room);
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

  return (
    <div className="flex w-full h-full">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-800 mb-4">Rooms</h2>
          <form onSubmit={createRoom} className="flex gap-2">
            <input type="text" placeholder="New room..." value={newRoom} onChange={e => setNewRoom(e.target.value)} className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none" />
            <button type="submit" className="bg-slate-800 text-white px-3 py-1.5 rounded text-sm hover:bg-slate-700">+</button>
          </form>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {rooms.map(r => (
            <button key={r} onClick={() => joinRoom(r)} className={`w-full text-left px-4 py-2 rounded-lg text-sm mb-1 transition ${currentRoom === r ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>
              # {r}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-slate-50">
        {currentRoom ? <ChatRoom ws={ws} room={currentRoom} username={username} /> : (
          <div className="m-auto text-center text-slate-400">
            <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
            <p>Select a room to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ChatRoom({ ws, room, username }: { ws: WebSocket | null, room: string, username: string }) {
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
    <div className="flex flex-col h-full w-full relative">
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm z-10">
        <h3 className="font-semibold text-lg text-slate-800"># {room}</h3>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Users size={16} /> {users.length} online
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((m, i) => (
          m.type === 'SYS' ? (
            <div key={i} className="text-center text-xs text-slate-400 my-2">{m.content}</div>
          ) : (
            <div key={i} className={`flex flex-col max-w-lg ${m.sender === username ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
              <span className="text-xs text-slate-500 mb-1 mx-1">{m.sender}</span>
              <div className={`px-4 py-2 rounded-2xl ${m.sender === username ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'}`}>
                {m.content}
              </div>
            </div>
          )
        ))}
        <div ref={endRef} />
      </div>
      
      <div className="p-4 bg-white border-t border-slate-200">
        <form onSubmit={sendMsg} className="flex gap-2">
          <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder="Type a message..." className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-6 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" />
          <button type="submit" className="bg-blue-600 text-white rounded-full p-3 hover:bg-blue-700 transition flex items-center justify-center h-12 w-12 shrink-0 shadow-sm">
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;
