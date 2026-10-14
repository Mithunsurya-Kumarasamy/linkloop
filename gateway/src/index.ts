import * as http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { TCPClient } from './tcp_client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const PORT = parseInt(process.env.PORT || process.env.GATEWAY_PORT || '8080');
const TCP_HOST = process.env.TCP_SERVER_HOST === 'tcp-core' ? '127.0.0.1' : (process.env.TCP_SERVER_HOST || '127.0.0.1');
const TCP_PORT = parseInt(process.env.TCP_SERVER_PORT || '9000');

// Create HTTP server for health checks (UptimeRobot / Render) and WebSocket upgrades
const server = http.createServer((req, res) => {
    if (req.url === '/health' || req.url === '/' || req.url === '/ping') {
        res.writeHead(200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({
            status: 'ok',
            service: 'linkloop-gateway',
            uptime: Math.floor(process.uptime()),
            timestamp: new Date().toISOString()
        }));
        return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
});

const wss = new WebSocketServer({ server });

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

server.listen(PORT, () => {
    console.log(`Server & WebSocket Gateway running on port ${PORT}`);
    console.log(`Health check available at http://localhost:${PORT}/health`);
});
