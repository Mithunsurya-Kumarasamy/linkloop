import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))

raw_host = os.getenv('TCP_SERVER_HOST', '0.0.0.0')
HOST = '0.0.0.0' if raw_host == 'tcp-core' else raw_host
PORT = int(os.getenv('TCP_SERVER_PORT', 9000))
