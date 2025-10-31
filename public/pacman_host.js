# Pac-Man Remote Game Service (Updated Host Script)

This update adds:

* Slower Pac-Man and ghost movement
* Classic Pac-Man maze with walls and ghost cage
* Power pellets (cherries) that make ghosts edible
* Score display on screen

---

## public/pacman_host.js

```js
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const TILE = 20, COLS = 21, ROWS = 21;
let pac = {x:9, y:15, dir:[0,0], nextDir:[0,0]};
let ghosts = [{x:9, y:9, dir:[0,0], edible:false, respawn:true}];
let ws;
let score = 0;
let powerActive = false;
let powerTimer = 0;
let tick = 0;
let PAC_SPEED = 5; // frames per move
let GHOST_SPEED = 10;

// Map layout
// 0 = empty, 1 = wall, 2 = dot, 3 = power pellet, 4 = ghost cage
let map = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,2,2,2,1,2,2,2,2,2,2,2,2,2,2,1,2,2,2,2,1],
  [1,2,1,2,1,2,1,1,1,1,1,1,1,1,2,1,2,1,2,1,1],
  [1,3,1,2,1,2,2,2,2,4,4,2,2,2,2,1,2,1,3,1,1],
  [1,2,1,2,1,2,1,1,1,1,1,1,1,1,2,1,2,1,2,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,1,1,2,1,1,1,1,1,1,1,2,1,1,1,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

// Expand map to full ROWS x COLS with walls for simplicity
while(map.length < ROWS) map.push(Array(COLS).fill(1));

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  for(let y=0; y<ROWS; y++){
    for(let x=0; x<COLS; x++){
      const tile = map[y][x];
      if(tile===1){ ctx.fillStyle='blue'; ctx.fillRect(x*TILE,y*TILE,TILE,TILE); }
      else if(tile===2){ ctx.fillStyle='yellow'; ctx.fillRect(x*TILE+TILE/3,y*TILE+TILE/3,TILE/3,TILE/3); }
      else if(tile===3){ ctx.fillStyle='red'; ctx.beginPath(); ctx.arc(x*TILE+TILE/2,y*TILE+TILE/2,TILE/3,0,Math.PI*2); ctx.fill(); }
      else if(tile===4){ ctx.fillStyle='gray'; ctx.fillRect(x*TILE,y*TILE,TILE,TILE); }
    }
  }
  // Pac-Man
  ctx.fillStyle='orange';
  ctx.beginPath();
  ctx.arc(pac.x*TILE+TILE/2,pac.y*TILE+TILE/2,TILE/2-2,0,Math.PI*2);
  ctx.fill();
  // Ghosts
  ghosts.forEach(g=>{
    ctx.fillStyle = g.edible ? 'cyan' : 'red';
    ctx.beginPath();
    ctx.arc(g.x*TILE+TILE/2,g.y*TILE+TILE/2,TILE/2-2,0,Math.PI*2);
    ctx.fill();
  });
  // Score
  ctx.fillStyle='white';
  ctx.font='16px Arial';
  ctx.fillText('Score: '+score, 5, 18);
}

function canMove(x,y){
  if(y<0||y>=ROWS||x<0||x>=COLS) return false;
  return map[y][x]!==1;
}

function movePac(){
  if(canMove(pac.x+pac.nextDir[0], pac.y+pac.nextDir[1])) pac.dir = pac.nextDir.slice();
  const nx = pac.x+pac.dir[0]; const ny = pac.y+pac.dir[1];
  if(canMove(nx,ny)) pac.x=nx; pac.y=ny;

  // Eat dot or power pellet
  const tile = map[pac.y][pac.x];
  if(tile===2){ score+=10; map[pac.y][pac.x]=0; }
  if(tile===3){ score+=50; map[pac.y][pac.x]=0; powerActive=true; powerTimer=300; ghosts.forEach(g=>g.edible=true); }
}

function moveGhosts(){
  ghosts.forEach(g=>{
    if(g.respawn){ g.x=9; g.y=9; g.respawn=false; }
    if(tick%GHOST_SPEED===0){
      const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
      const validDirs = dirs.filter(d=>canMove(g.x+d[0], g.y+d[1]));
      if(validDirs.length) g.dir = validDirs[Math.floor(Math.random()*validDirs.length)];
      g.x+=g.dir[0]; g.y+=g.dir[1];
    }
    // Collision with Pac-Man
    if(g.x===pac.x && g.y===pac.y){
      if(g.edible){ score+=200; g.respawn=true; g.edible=false; }
      else{ resetGame(); }
    }
  });
}

function resetGame(){
  pac.x=9; pac.y=15; pac.dir=[0,0]; pac.nextDir=[0,0];
  ghosts.forEach(g=>{ g.x=9; g.y=9; g.dir=[0,0]; g.edible=false; g.respawn=true; });
  score=0;
  map.forEach((row,y)=>row.forEach((cell,x)=>{ if(cell===0) map[y][x]=2; }));
}

function gameLoop(){
  tick++;
  if(tick%PAC_SPEED===0) movePac();
  moveGhosts();
  draw();
  if(powerActive){ powerTimer--; if(powerTimer<=0){ powerActive=false; ghosts.forEach(g=>g.edible=false); } }
  requestAnimationFrame(gameLoop);
}

window.addEventListener('keydown', e=>{
  const mapDir = { ArrowUp:[0,-1], ArrowDown:[0,1], ArrowLeft:[-1,0], ArrowRight:[1,0] };
  if(mapDir[e.key]){ pac.nextDir=mapDir[e.key]; e.preventDefault();
    if(ws && ws.readyState===WebSocket.OPEN) ws.send(JSON.stringify({ type:'input', payload:{ kind:'control', dir:mapDir[e.key] } }));
  }
});

document.getElementById('startBtn').addEventListener('click', ()=>{
  const roomId = document.getElementById('roomId').value||'room1';
  const url = (location.protocol==='https:'?'wss://':'ws://')+location.host;
  ws = new WebSocket(url);
  ws.addEventListener('open', ()=>{ ws.send(JSON.stringify({ type:'join', role:'host', roomId })); document.getElementById('status').textContent='Connected as host'; });
  ws.addEventListener('message', ev=>{
    const data=JSON.parse(ev.data);
    if(data.type==='input' && data.payload && data.payload.kind==='control') pac.nextDir = data.payload.dir;
  });
});

gameLoop();
```
