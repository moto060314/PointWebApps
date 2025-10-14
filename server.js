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
// 追加: イベントスコアファイル
const EVENT_SCORE_FILE = path.join(__dirname, 'event_scores.json');

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
    if (err) return res.status(500).json({ error: 'Failed to save muscle max' });
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
    if (err) return res.status(500).json({ error: 'Failed to save cosplay votes' });
    io.emit('cosplayUpdated'); // 追加: クライアントへ通知
    res.json({ success: true });
  });
});

app.get('/api/event-scores', (req, res) => {
  fs.readFile(EVENT_SCORE_FILE, 'utf8', (err, data) => {
    if (err) return res.json([]);
    res.json(JSON.parse(data));
  });
});

// 既存の保存APIでSocket.IO通知も追加
app.post('/api/event-score', (req, res) => {
  const body = req.body;
  let scores = [];
  fs.readFile(EVENT_SCORE_FILE, 'utf8', (err, data) => {
    try {
      if (!err && data) scores = JSON.parse(data);
      if (!Array.isArray(scores)) scores = [];
    } catch (e) {
      scores = [];
    }
    if (Array.isArray(body)) {
      // 配列なら全体上書き
      scores = body;
    } else {
      // オブジェクトなら追加（重複チェック: event, team, classCode, name が一致するものは追加しない）
      const exists = scores.some((e) => e.event === body.event && e.team === body.team && (e.classCode ?? null) === (body.classCode ?? null) && (e.name ?? null) === (body.name ?? null));
      if (!exists) {
        scores.push(body);
      }
    }
    fs.writeFile(EVENT_SCORE_FILE, JSON.stringify(scores, null, 2), (err) => {
      if (err) return res.status(500).json({ error: 'Failed to save event score' });
      io.emit('eventScoreUpdated');
      res.json({ success: true });
    });
  });
});

app.post('/api/update-teams-from-events', (req, res) => {
  fs.readFile(EVENT_SCORE_FILE, 'utf8', (err, eventData) => {
    if (err) return res.status(500).json({ error: 'Failed to read event scores' });
    const events = JSON.parse(eventData);

    // チームごとに合計点を集計
    const teamMap = {};
    events.forEach((e) => {
      if (!teamMap[e.team]) {
        teamMap[e.team] = { cosplay: 0, muscle: 0, events: {} };
      }
      // 種目ごとの最高点を加算（同じ生徒が複数回入力した場合は最新のみ反映したい場合は工夫が必要）
      teamMap[e.team].muscle += e.point;
      // 必要なら個別種目も記録
      teamMap[e.team].events[e.event] = Math.max(teamMap[e.team].events[e.event] || 0, e.value);
    });

    // data.jsonのチーム構造に合わせて更新
    fs.readFile(DATA_FILE, 'utf8', (err, teamData) => {
      if (err) return res.status(500).json({ error: 'Failed to read team data' });
      const teams = JSON.parse(teamData);
      teams.forEach((team) => {
        if (teamMap[team.name]) {
          team.muscle = teamMap[team.name].muscle;
          team.events = teamMap[team.name].events;
        } else {
          team.muscle = 0;
          team.events = {};
        }
      });
      fs.writeFile(DATA_FILE, JSON.stringify(teams, null, 2), (err) => {
        if (err) return res.status(500).json({ error: 'Failed to save team data' });
        io.emit('teamsUpdated', teams);
        res.json({ success: true });
      });
    });
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
