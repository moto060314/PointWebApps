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
// 追加: 種目最大値ファイル
const MUSCLE_MAX_FILE = path.join(__dirname, 'muscle.json');
// 追加: コスプレ投票ファイル
const COSPLAY_FILE = path.join(__dirname, 'cosplay.json');

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

// 追加: 筋肉種目 最大値 取得API
app.get('/api/muscle-max', (req, res) => {
  fs.readFile(MUSCLE_MAX_FILE, 'utf8', (err, data) => {
    if (err) {
      // 未作成時はデフォルト0で返す
      return res.json({
        grip: 0,
        situp30: 0,
        wallSit: 0,
        pushup60: 0,
        backExt: 0,
        yoga60: 0,
      });
    }
    res.json(JSON.parse(data));
  });
});

// 追加: 筋肉種目 最大値 更新API
app.post('/api/muscle-max', (req, res) => {
  const max = req.body || {};
  fs.writeFile(MUSCLE_MAX_FILE, JSON.stringify(max, null, 2), (err) => {
    if (err)
      return res.status(500).json({ error: 'Failed to save muscle max' });
    res.json({ success: true });
  });
});

// 追加: コスプレ投票 取得API
app.get('/api/cosplay', (req, res) => {
  fs.readFile(COSPLAY_FILE, 'utf8', (err, data) => {
    if (err) return res.json([]);
    res.json(JSON.parse(data));
  });
});

// 追加: コスプレ投票 更新API
app.post('/api/cosplay', (req, res) => {
  const votes = req.body;
  fs.writeFile(COSPLAY_FILE, JSON.stringify(votes, null, 2), (err) => {
    if (err)
      return res.status(500).json({ error: 'Failed to save cosplay votes' });
    io.emit('cosplayUpdated'); // 追加: クライアントへ通知
    res.json({ success: true });
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
