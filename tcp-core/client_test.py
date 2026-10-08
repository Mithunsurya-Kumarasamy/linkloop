import socket

def test_client():
    client = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    client.connect(('127.0.0.1', 9000))
    
    msg = "Hello"
    print(f"Client -> {msg}")
    client.sendall(f"{msg}\n".encode('utf-8'))
    
    response = client.recv(1024).decode('utf-8').strip()
    print(f"Server -> {response}")
    
    client.close()

if __name__ == "__main__":
    test_client()
