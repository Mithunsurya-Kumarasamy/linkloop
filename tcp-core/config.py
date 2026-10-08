import os

HOST = os.getenv('TCP_SERVER_HOST', '0.0.0.0')
PORT = int(os.getenv('TCP_SERVER_PORT', 9000))
