const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, 'public')));

const rooms = new Map();

function safeSend(ws, obj){ try{ ws.send(JSON.stringify(obj)); }catch(e){} }

wss.on('connection', (ws) => {
  ws._meta = { role: null, room: null };

  ws.on('message', (msg) => {
    let data;
    try { data = JSON.parse(msg); } catch(e){ return; }
    const { type, roomId, role, payload } = data;

    if(type === 'join'){
      ws._meta.role = role;
      ws._meta.room = roomId;
      if(!rooms.has(roomId)) rooms.set(roomId, { host: null, controllers: new Set() });
      const room = rooms.get(roomId);
      if(role === 'host'){
        room.host = ws;
        safeSend(ws, { type: 'joined', role: 'host' });
      } else {
        room.controllers.add(ws);
        safeSend(ws, { type: 'joined', role: 'controller' });
        if(room.host) safeSend(room.host, { type: 'controller_connected' });
      }
      return;
    }

    if(type === 'input'){
      const room = rooms.get(ws._meta.room);
      if(!room) return;
      if(ws._meta.role === 'controller'){
        if(room.host) safeSend(room.host, { type: 'input', payload });
      } else if(ws._meta.role === 'host'){
        room.controllers.forEach(c => safeSend(c, { type: 'state', payload }));
      }
      return;
    }
  });

  ws.on('close', () => {
    const { role, room } = ws._meta;
    if(!room) return;
    const r = rooms.get(room);
    if(!r) return;
    if(role === 'host'){
      r.host = null;
      r.controllers.forEach(c => safeSend(c, { type: 'host_disconnected' }));
    } else if(role === 'controller'){
      r.controllers.delete(ws);
      if(r.host) safeSend(r.host, { type: 'controller_disconnected' });
    }
    if(!r.host && r.controllers.size === 0) rooms.delete(room);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Server listening on', PORT));