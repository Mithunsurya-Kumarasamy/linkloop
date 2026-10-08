import json

class Protocol:
    @staticmethod
    def encode(message_dict):
        return json.dumps(message_dict).encode('utf-8') + b'\n'

    @staticmethod
    def decode(data):
        if not data:
            return None
        return json.loads(data.decode('utf-8').strip())
