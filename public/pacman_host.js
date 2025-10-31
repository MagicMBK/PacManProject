const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const TILE=20, COLS=21, ROWS=21;
let pac = {x:10,y:15,dir:[0,0],nextDir:[0,0]};
let dots = [];
let ghosts = [{x:9,y:9},{x:11,y:9}];
let ws;
let roomIdInput = document.getElementById('roomId');
let statusEl = document.getElementById('status');

function init(){
  dots = [];
  for(let r=0;r<ROWS;r++){
    for(let c=0;c<COLS;c++){
      if(!(r===10 && (c===10))){ dots.push({x:c,y:r}); }
    }
  }
}

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle='yellow';
  dots.forEach(d=>ctx.fillRect(d.x*TILE+TILE/3, d.y*TILE+TILE/3, TILE/3, TILE/3));
  ctx.beginPath();
  ctx.fillStyle='orange';
  ctx.arc(pac.x*TILE+TILE/2, pac.y*TILE+TILE/2, TILE/2-2, 0, Math.PI*2);
  ctx.fill();
  ctx.fillStyle='red';
  ghosts.forEach(g=>{ ctx.fillRect(g.x*TILE+4,g.y*TILE+4,TILE-8,TILE-8); });
}

function step(){
  if(canMove(pac.x+pac.nextDir[0], pac.y+pac.nextDir[1])) pac.dir = pac.nextDir.slice();
  if(canMove(pac.x+pac.dir[0], pac.y+pac.dir[1])){ pac.x += pac.dir[0]; pac.y += pac.dir[1]; }
  if(pac.x<0) pac.x=COLS-1; if(pac.x>=COLS) pac.x=0;
  if(pac.y<0) pac.y=ROWS-1; if(pac.y>=ROWS) pac.y=0;
  for(let i=0;i<dots.length;i++){ if(dots[i].x===pac.x && dots[i].y===pac.y){ dots.splice(i,1); break; } }
  ghosts.forEach(g=>{
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    const d = dirs[Math.floor(Math.random()*dirs.length)];
    if(canMove(g.x+d[0], g.y+d[1])){ g.x+=d[0]; g.y+=d[1]; }
    if(g.x===pac.x && g.y===pac.y){ reset(); }
  });
  if(ws && ws.readyState===WebSocket.OPEN){
    ws.send(JSON.stringify({ type:'input', payload:{kind:'state', pac, dotsCount:dots.length} }));
  }
}

function canMove(x,y){ return x>=0 && x<COLS && y>=0 && y<ROWS; }
function reset(){ init(); pac.x=10; pac.y=15; pac.dir=[0,0]; pac.nextDir=[0,0]; }
function gameLoop(){ step(); draw(); requestAnimationFrame(gameLoop); }

window.addEventListener('keydown', e=>{
  const map = { ArrowUp:[0,-1], ArrowDown:[0,1], ArrowLeft:[-1,0], ArrowRight:[1,0] };
  if(map[e.key]){
    pac.nextDir = map[e.key];
    e.preventDefault();
    if(ws && ws.readyState===WebSocket.OPEN){
      ws.send(JSON.stringify({ type:'input', payload:{ kind:'control', dir:map[e.key] } }));
    }
  }
});

document.getElementById('startBtn').addEventListener('click', ()=>{
  const roomId = roomIdInput.value||'room1';
  const url = (location.protocol==='https:'? 'wss://' : 'ws://') + location.host;
  ws = new WebSocket(url);
  ws.addEventListener('open', ()=>{
    ws.send(JSON.stringify({ type:'join', role:'host', roomId }));
    statusEl.textContent = 'Connected as host to '+roomId;
  });
  ws.addEventListener('message', (ev)=>{
    let data = JSON.parse(ev.data);
    if(data.type==='input' && data.payload && data.payload.kind==='control'){
      pac.nextDir = data.payload.dir;
    }
    if(data.type==='controller_connected'){
      statusEl.textContent = 'Controller connected';
      setTimeout(()=> statusEl.textContent = '', 2000);
    }
  });
});

init();
requestAnimationFrame(gameLoop);
