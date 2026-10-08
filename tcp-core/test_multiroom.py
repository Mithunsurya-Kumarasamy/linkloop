import socket
import threading
import time
import json

def read_messages(sock, name):
    buffer = ""
    try:
        while True:
            data = sock.recv(1024)
            if not data: break
            buffer += data.decode('utf-8')
            while '\n' in buffer:
                line, buffer = buffer.split('\n', 1)
                if line.strip():
                    print(f"[{name} received] {line.strip()}")
    except Exception:
        pass

def create_client(username, room):
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.connect(('127.0.0.1', 9000))
    
    t = threading.Thread(target=read_messages, args=(s, username))
    t.daemon = True
    t.start()
    
    s.sendall((json.dumps({"type": "REGISTER", "username": username}) + '\n').encode('utf-8'))
    time.sleep(0.5)
    s.sendall((json.dumps({"type": "JOIN_ROOM", "room": room}) + '\n').encode('utf-8'))
    time.sleep(0.5)
    
    return s

if __name__ == "__main__":
    print("Starting multiroom test...")
    alice = create_client("Alice", "General")
    bob = create_client("Bob", "General")
    charlie = create_client("Charlie", "Gaming")
    
    # Alice sends a message to General
    alice.sendall((json.dumps({"type": "MESSAGE", "content": "Hello General from Alice!"}) + '\n').encode('utf-8'))
    time.sleep(0.5)
    
    # Charlie sends a message to Gaming
    charlie.sendall((json.dumps({"type": "MESSAGE", "content": "Hello Gaming from Charlie!"}) + '\n').encode('utf-8'))
    time.sleep(1)
    
    alice.close()
    bob.close()
    charlie.close()
    print("Multiroom test finished.")
