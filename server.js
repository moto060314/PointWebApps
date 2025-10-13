// server.js
import express from 'express';
import fs from 'fs';
import path from 'path';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';
import http from 'http';
import { Server } from 'socket.io';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

// HTTP サーバー & Socket.IO 初期化
const server = http.createServer(app);
const io = new Server(server);

// データ取得API
app.get('/api/teams', (req, res) => {
  fs.readFile(DATA_FILE, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to read data' });
    res.json(JSON.parse(data));
  });
});

// データ更新API
app.post('/api/teams', (req, res) => {
  const teams = req.body;
  fs.writeFile(DATA_FILE, JSON.stringify(teams, null, 2), (err) => {
    if (err) return res.status(500).json({ error: 'Failed to save data' });
    // 保存成功 → クライアントへ通知
    io.emit('teamsUpdated', teams);
    res.json({ success: true });
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
