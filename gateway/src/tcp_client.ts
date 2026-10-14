import * as net from 'net';
import { WebSocket } from 'ws';
import { StringDecoder } from 'string_decoder';

export class TCPClient {
    private client: net.Socket;
    private ws: WebSocket;
    private buffer: string = "";
    private decoder: StringDecoder = new StringDecoder('utf-8');

    constructor(ws: WebSocket, host: string, port: number) {
        this.ws = ws;
        this.client = new net.Socket();
        this.client.setNoDelay(true);

        this.client.connect(port, host, () => {
            console.log(`Connected to TCP Core at ${host}:${port}`);
        });

        this.client.on('data', (data) => {
            this.buffer += this.decoder.write(data);
            let newlineIdx;
            while ((newlineIdx = this.buffer.indexOf('\n')) !== -1) {
                const line = this.buffer.substring(0, newlineIdx).trim();
                this.buffer = this.buffer.substring(newlineIdx + 1);
                
                if (line) {
                    try {
                        if (this.ws.readyState === WebSocket.OPEN) {
                            this.ws.send(line);
                        }
                    } catch (e) {
                        console.error("Failed to forward to WS:", e);
                    }
                }
            }
        });

        this.client.on('close', () => {
            console.log('TCP connection closed');
            if (this.ws.readyState === WebSocket.OPEN) {
                this.ws.close(1011, "TCP Backend Disconnected");
            }
        });

        this.client.on('error', (err) => {
            console.error('TCP Error:', err);
        });
    }

    public send(data: string) {
        if (!this.client.destroyed) {
            this.client.write(data + '\n');
        }
    }

    public close() {
        this.client.destroy();
    }
}
