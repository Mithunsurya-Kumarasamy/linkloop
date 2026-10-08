import { WebSocketServer, WebSocket } from 'ws';
import { TCPClient } from './tcp_client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const PORT = parseInt(process.env.GATEWAY_PORT || '8080');
const TCP_HOST = process.env.TCP_SERVER_HOST === 'tcp-core' ? '127.0.0.1' : (process.env.TCP_SERVER_HOST || '127.0.0.1');
const TCP_PORT = parseInt(process.env.TCP_SERVER_PORT || '9000');

const wss = new WebSocketServer({ port: PORT });

console.log(`WebSocket Gateway running on ws://localhost:${PORT}`);

wss.on('connection', (ws: WebSocket) => {
    console.log('New WebSocket connection established');

    const tcpClient = new TCPClient(ws, TCP_HOST, TCP_PORT);

    ws.on('message', (message: string) => {
        try {
            const data = message.toString();
            JSON.parse(data); 
            tcpClient.send(data);
        } catch (e) {
            ws.send(JSON.stringify({ type: "ERROR", message: "Invalid JSON format from client" }));
        }
    });

    ws.on('close', () => {
        console.log('WebSocket connection closed');
        tcpClient.close();
    });

    ws.on('error', (err) => {
        console.error('WebSocket error:', err);
    });
});
