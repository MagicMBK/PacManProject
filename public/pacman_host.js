const canvas = document.getElementById('game');
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
