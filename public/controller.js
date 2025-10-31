const roomIdInput = document.getElementById('roomId');
const connectBtn = document.getElementById('connectBtn');
const status = document.getElementById('ctlStatus');
let ws;

connectBtn.addEventListener('click', ()=>{
  const roomId = roomIdInput.value||'room1';
  const url = (location.protocol==='https:'? 'wss://' : 'ws://') + location.host;
  ws = new WebSocket(url);
  ws.addEventListener('open', ()=>{ ws.send(JSON.stringify({ type:'join', role:'controller', roomId })); status.textContent='Connected'; });
  ws.addEventListener('message', (ev)=>{
    const d = JSON.parse(ev.data);
    if(d.type==='joined') status.textContent = 'Joined as controller';
    if(d.type==='state') status.textContent = 'Game state: '+JSON.stringify(d.payload).slice(0,60);
    if(d.type==='host_disconnected') status.textContent = 'Host disconnected';
  });
});

function sendDir(dir){ if(ws && ws.readyState===WebSocket.OPEN){ ws.send(JSON.stringify({ type:'input', payload:{ kind:'control', dir }})); }}

document.addEventListener('keydown', e=>{
  const map = { ArrowUp:[0,-1], ArrowDown:[0,1], ArrowLeft:[-1,0], ArrowRight:[1,0] };
  if(map[e.key]){ sendDir(map[e.key]); e.preventDefault(); }
});

document.querySelectorAll('.dpad button').forEach(b=> b.addEventListener('click', ()=> sendDir({ up:[0,-1], down:[0,1], left:[-1,0], right:[1,0] }[b.dataset.dir]) ));