import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))

HOST = os.getenv('TCP_SERVER_HOST', '0.0.0.0')
PORT = int(os.getenv('TCP_SERVER_PORT', 9000))
