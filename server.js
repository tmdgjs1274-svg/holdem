const path = require('path');
const crypto = require('crypto');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

// 참가자용 고정 URL
app.get('/join', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'join.html'));
});

const MAX_SEATS = 9;
function emptySeatMap() {
  const m = {};
  for (let i = 1; i <= MAX_SEATS; i++) m[i] = null;
  return m;
}

// roomId(4자리 코드) -> { hostId, players: {1..9}, names: {1..9}, state: {...} }
const rooms = {};

// 헷갈리는 문자(0/O, 1/I) 제외한 4자리 코드
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function genRoomCode() {
  let code;
  do {
    const bytes = crypto.randomBytes(4);
    code = '';
    for (let i = 0; i < 4; i++) code += CODE_CHARS[bytes[i] % CODE_CHARS.length];
  } while (rooms[code]); // 충돌 방지
  return code;
}

function emitToHost(room, event, payload) {
  if (room && room.hostId) io.to(room.hostId).emit(event, payload);
}

io.on('connection', (socket) => {
  socket.on('create-room', (cb) => {
    const roomId = genRoomCode();
    rooms[roomId] = {
      hostId: socket.id,
      players: emptySeatMap(),
      names: emptySeatMap(),
      state: { phase: 'waiting' },
    };
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.role = 'host';
    if (typeof cb === 'function') cb({ ok: true, roomId });
  });

  socket.on('join-room', ({ roomId, name }, cb) => {
    const code = (roomId || '').trim().toUpperCase();
    const room = rooms[code];
    if (!room) {
      if (typeof cb === 'function') cb({ ok: false, error: '입장 코드를 찾을 수 없어요. 다시 확인해주세요.' });
      return;
    }
    let seat = null;
    for (let i = 1; i <= MAX_SEATS; i++) {
      if (!room.players[i]) { seat = i; break; }
    }
    if (!seat) {
      if (typeof cb === 'function') cb({ ok: false, error: `이미 ${MAX_SEATS}명이 입장한 방이에요.` });
      return;
    }
    const safeName = (name || '').toString().trim().slice(0, 20) || `플레이어${seat}`;
    room.players[seat] = socket.id;
    room.names[seat] = safeName;
    socket.join(code);
    socket.data.roomId = code;
    socket.data.role = 'player';
    socket.data.seat = seat;

    if (typeof cb === 'function') cb({ ok: true, seat, state: room.state, names: room.names });
    emitToHost(room, 'player-joined', { seat, name: safeName });
  });

  socket.on('host-action', ({ roomId, state }) => {
    const room = rooms[roomId];
    if (!room || room.hostId !== socket.id) return;
    room.state = state;
    io.to(roomId).emit('state-update', { state: room.state, names: room.names });
  });

  // 참가자가 리버에서 카드 공개 여부를 바꿀 때 -> 호스트에게 전달
  socket.on('player-set-open', ({ open }) => {
    const roomId = socket.data.roomId;
    const seat = socket.data.seat;
    if (!roomId || !seat) return;
    const room = rooms[roomId];
    if (!room) return;
    emitToHost(room, 'player-open-choice', { seat, open: !!open });
  });

  // 호스트가 참가자를 방에서 내보낼 때
  socket.on('kick-player', ({ roomId, seat }) => {
    const room = rooms[roomId];
    if (!room || room.hostId !== socket.id) return;
    const targetSocketId = room.players[seat];
    if (!targetSocketId) return;
    room.players[seat] = null;
    room.names[seat] = null;
    const targetSocket = io.sockets.sockets.get(targetSocketId);
    if (targetSocket) {
      targetSocket.emit('kicked');
      targetSocket.disconnect(true);
    }
    io.to(roomId).emit('state-update', { state: room.state, names: room.names });
  });

  socket.on('disconnect', () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    const room = rooms[roomId];
    if (!room) return;

    if (socket.data.role === 'host') {
      io.to(roomId).emit('host-left');
      delete rooms[roomId];
    } else if (socket.data.role === 'player') {
      const seat = socket.data.seat;
      if (room.players[seat] === socket.id) {
        room.players[seat] = null;
        room.names[seat] = null;
      }
      emitToHost(room, 'player-left', { seat });
    }
  });
});

// 메모리 누수 방지용 세이프가드
setInterval(() => {
  const ids = Object.keys(rooms);
  if (ids.length > 5000) ids.slice(0, 1000).forEach((id) => delete rooms[id]);
}, 60 * 60 * 1000);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`홀덤 분배기 서버 실행 중: http://localhost:${PORT}`);
});
