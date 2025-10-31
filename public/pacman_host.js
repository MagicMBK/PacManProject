const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const TILE = 20, COLS = 21, ROWS = 21;

let pac = {x: 10, y: 15, dir: [0,0], nextDir: [0,0], speed: 0.15, counter: 0};
let dots = [];
let ghosts = [
  {x: 9, y: 9, edible: false, speed: 0.03, counter:0},
  {x: 11, y: 9, edible: false, speed: 0.025, counter:0}
];
let cherries = [];
let powerUps = [];
let powerUpTimer = 0;

let ws;
let roomIdInput = document.getElementById('roomId');
let statusEl = document.getElementById('status');

// LABIRINTO: 0 = vuoto, 1 = muro
const maze = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,0,1,1,1,0,0,1,0,0,1,1,1,0,1,1,0,1],
  [1,0,1,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,1,0,1],
  [1,0,1,0,1,1,0,1,1,1,0,1,1,1,0,1,1,0,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,0,1,0,1,1,1,1,1,1,1,0,1,0,1,1,0,1],
  [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],
  [1,1,1,1,0,1,1,1,0,0,1,0,0,1,1,1,0,1,1,1,1],
  [0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0],
  [1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1],
  [0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0],
  [1,1,1,1,0,1,1,1,0,0,1,0,0,1,1,1,0,1,1,1,1],
  [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],
  [1,0,1,1,0,1,0,1,1,1,1,1,1,1,0,1,0,1,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,0,1,1,0,1,1,1,0,1,1,1,0,1,1,0,1,0,1],
  [1,0,1,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,1,0,1],
  [1,0,1,1,0,1,1,1,0,0,1,0,0,1,1,1,0,1,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

function init() {
  dots = [];
  cherries = [];
  powerUps = [];
  for(let r=0; r<ROWS; r++){
    for(let c=0; c<COLS; c++){
      if(maze[r] && maze[r][c]===0){
        dots.push({x:c,y:r});
      }
    }
  }
  // Aggiungi ciliegie e power-up
  cherries.push({x:1,y:1});
  cherries.push({x:19,y:19});
  powerUps.push({x:1,y:19});
  powerUps.push({x:19,y:1});
}

function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // Disegna labirinto
  ctx.fillStyle='#0000AA';
  for(let r=0;r<ROWS;r++){
    for(let c=0;c<COLS;c++){
      if(maze[r] && maze[r][c]===1){
        ctx.fillRect(c*TILE, r*TILE, TILE, TILE);
      }
    }
  }

  // Dots
  ctx.fillStyle='#FFD700';
  dots.forEach(d => {
    ctx.beginPath();
    ctx.arc(d.x*TILE+TILE/2, d.y*TILE+TILE/2, 3, 0, Math.PI*2);
    ctx.fill();
  });

  // Cherries
  ctx.fillStyle='#FF1493';
  cherries.forEach(ch => {
    ctx.beginPath();
    ctx.arc(ch.x*TILE+TILE/2, ch.y*TILE+TILE/2, TILE/3, 0, Math.PI*2);
    ctx.fill();
  });

  // Power-ups
  ctx.fillStyle='white';
  powerUps.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x*TILE+TILE/2, p.y*TILE+TILE/2, TILE/2-4, 0, Math.PI*2);
    ctx.fill();
  });

  // Pac-Man
  ctx.beginPath();
  ctx.fillStyle='#FFFF00';
  ctx.arc(pac.x*TILE+TILE/2, pac.y*TILE+TILE/2, TILE/2-2, 0.2*Math.PI, 1.8*Math.PI);
  ctx.lineTo(pac.x*TILE+TILE/2, pac.y*TILE+TILE/2);
  ctx.fill();

  // Fantasmi
  ghosts.forEach(g=>{
    ctx.fillStyle = g.edible ? '#00FFFF' : '#FF0000';
    ctx.beginPath();
    ctx.arc(g.x*TILE+TILE/2, g.y*TILE+4, TILE/2-2, Math.PI, 0);
    ctx.lineTo(g.x*TILE+TILE-2, g.y*TILE+TILE-2);
    ctx.lineTo(g.x*TILE+TILE-6, g.y*TILE+TILE/2+2);
    ctx.lineTo(g.x*TILE+TILE/2, g.y*TILE+TILE-2);
    ctx.lineTo(g.x*TILE+6, g.y*TILE+TILE/2+2);
    ctx.lineTo(g.x*TILE+2, g.y*TILE+TILE-2);
    ctx.closePath();
    ctx.fill();
    
    // Eyes
    ctx.fillStyle = 'white';
    ctx.fillRect(g.x*TILE+6, g.y*TILE+6, 4, 6);
    ctx.fillRect(g.x*TILE+TILE-10, g.y*TILE+6, 4, 6);
    ctx.fillStyle = 'blue';
    ctx.fillRect(g.x*TILE+7, g.y*TILE+8, 2, 3);
    ctx.fillRect(g.x*TILE+TILE-9, g.y*TILE+8, 2, 3);
  });
}

function canMove(x,y){
  return y>=0 && y<ROWS && x>=0 && x<COLS && maze[y] && maze[y][x]===0;
}

function step() {
  // Movimento pac
  if(canMove(pac.x+pac.nextDir[0], pac.y+pac.nextDir[1])) pac.dir = pac.nextDir.slice();
  
  pac.counter += pac.speed;
  if(pac.counter >= 1) {
    pac.counter = 0;
    if(canMove(pac.x+pac.dir[0], pac.y+pac.dir[1])) { 
      pac.x+=pac.dir[0]; 
      pac.y+=pac.dir[1]; 
    }
  }

  // Wrap
  if(pac.x<0) pac.x=COLS-1; 
  if(pac.x>=COLS) pac.x=0;
  if(pac.y<0) pac.y=ROWS-1; 
  if(pac.y>=ROWS) pac.y=0;

  // Mangia dots
  for(let i=0;i<dots.length;i++){
    if(dots[i].x===pac.x && dots[i].y===pac.y){ 
      dots.splice(i,1); 
      break; 
    }
  }

  // Mangia ciliegie
  for(let i=0;i<cherries.length;i++){
    if(cherries[i].x===pac.x && cherries[i].y===pac.y){ 
      cherries.splice(i,1); 
      break; 
    }
  }

  // Mangia power-up
  for(let i=0;i<powerUps.length;i++){
    if(powerUps[i].x===pac.x && powerUps[i].y===pac.y){
      powerUps.splice(i,1);
      powerUpTimer = 300; // durata power-up in frame
      ghosts.forEach(g=>g.edible=true);
      break;
    }
  }

  // Movimento fantasmi
  ghosts.forEach(g=>{
    g.counter += g.speed;
    if(g.counter>=1){
      g.counter=0;
      const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
      const d = dirs[Math.floor(Math.random()*dirs.length)];
      if(canMove(g.x+d[0], g.y+d[1])) {
        g.x+=d[0];
        g.y+=d[1];
      }
    }

    // Collisione
    if(g.x===pac.x && g.y===pac.y){
      if(g.edible){
        g.x = 10; g.y = 10; g.edible=false; // mangiato
      } else {
        reset();
      }
    }
  });

  // Timer power-up
  if(powerUpTimer>0){
    powerUpTimer--;
    if(powerUpTimer===0) ghosts.forEach(g=>g.edible=false);
  }

  // Invio stato al server
  if(ws && ws.readyState===WebSocket.OPEN){
    ws.send(JSON.stringify({ type:'input', payload:{kind:'state', pac, dotsCount:dots.length} }));
  }
}

function reset(){
  init();
  pac.x=10; pac.y=15; pac.dir=[0,0]; pac.nextDir=[0,0]; pac.counter=0;
  ghosts.forEach(g=>{ g.x=9; g.y=9; g.edible=false; g.counter=0; });
  powerUpTimer = 0;
}

function gameLoop(){ 
  step(); 
  draw(); 
  requestAnimationFrame(gameLoop); 
}

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
  ws.addEventListener('error', ()=>{
    statusEl.textContent = 'WebSocket connection failed';
    statusEl.style.color = '#ff4444';
  });
});

init();
requestAnimationFrame(gameLoop);
