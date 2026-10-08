import json

MAX_MESSAGE_SIZE = 4096

class Protocol:
    @staticmethod
    def encode(message_dict):
        try:
            return json.dumps(message_dict).encode('utf-8') + b'\n'
        except Exception:
            return None

    @staticmethod
    def decode(data):
        if not data:
            return None
        if len(data) > MAX_MESSAGE_SIZE:
            raise ValueError("Message too large")
        try:
            return json.loads(data.decode('utf-8').strip())
        except json.JSONDecodeError:
            raise ValueError("Invalid JSON format")
