const path = require('path');
const crypto = require('crypto');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

// roomId -> { hostId, players: {1: socketId|null, 2: socketId|null}, state: {...} }
const rooms = {};

// 클로드 세션 ID 스타일의 방 코드 생성 (예: hd_014bEjp7MtKgSAMdSuoTLCbC)
function genRoomId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.randomBytes(24);
  let id = 'hd_';
  for (let i = 0; i < 24; i++) {
    id += chars[bytes[i] % chars.length];
  }
  return id;
}

io.on('connection', (socket) => {
  socket.on('create-room', (cb) => {
    const roomId = genRoomId();
    rooms[roomId] = {
      hostId: socket.id,
      players: { 1: null, 2: null },
      state: { phase: 'waiting' },
    };
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.role = 'host';
    if (typeof cb === 'function') cb({ ok: true, roomId });
  });

  socket.on('join-room', ({ roomId, seat }, cb) => {
    const room = rooms[roomId];
    if (!room) {
      if (typeof cb === 'function') cb({ ok: false, error: '방을 찾을 수 없어요. 코드를 다시 확인해주세요.' });
      return;
    }
    if (seat !== 1 && seat !== 2) {
      if (typeof cb === 'function') cb({ ok: false, error: '잘못된 좌석 번호예요.' });
      return;
    }
    room.players[seat] = socket.id;
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.role = 'player';
    socket.data.seat = seat;
    if (typeof cb === 'function') cb({ ok: true, state: room.state });
    io.to(room.hostId).emit('player-joined', { seat });
  });

  socket.on('host-action', ({ roomId, state }) => {
    const room = rooms[roomId];
    if (!room || room.hostId !== socket.id) return;
    room.state = state;
    io.to(roomId).emit('state-update', state);
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
      if (room.players[seat] === socket.id) room.players[seat] = null;
      io.to(room.hostId).emit('player-left', { seat });
    }
  });
});

// 오래된 빈 방 정리 (메모리 누수 방지, 6시간 이상 지난 방)
setInterval(() => {
  // 간단한 세이프가드: 방 개수가 과도하게 쌓이는 것만 방지 (프로덕션에서는 room.createdAt 기반으로 개선 가능)
  const ids = Object.keys(rooms);
  if (ids.length > 5000) {
    ids.slice(0, 1000).forEach((id) => delete rooms[id]);
  }
}, 60 * 60 * 1000);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`홀덤 분배기 서버 실행 중: http://localhost:${PORT}`);
});
