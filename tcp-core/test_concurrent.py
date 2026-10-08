import socket
import threading
import time

def single_client(client_id):
    try:
        client = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        client.connect(('127.0.0.1', 9000))
        
        msg = f"Hello from client {client_id}"
        client.sendall(f"{msg}\n".encode('utf-8'))
        
        response = client.recv(1024).decode('utf-8').strip()
        print(f"Client {client_id} received: {response}")
        
        time.sleep(1) # Keep connection alive briefly
        client.close()
    except Exception as e:
        print(f"Client {client_id} error: {e}")

if __name__ == "__main__":
    threads = []
    for i in range(5):
        t = threading.Thread(target=single_client, args=(i,))
        threads.append(t)
        t.start()
        
    for t in threads:
        t.join()
    print("All clients finished.")
