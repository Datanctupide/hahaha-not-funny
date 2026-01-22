const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const COLORS = ["red","green","blue","orange","purple","yellow","cyan","pink","brown","gray"];
let dragging = null, hoverObject = null;
let offX = 0, offY = 0;
let gameWon = false;

const allowedSlots = [
  [0, 4],
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4]
];

function getRandomColor() { return COLORS[Math.floor(Math.random()*COLORS.length)]; }

const objects = Array.from({length:5}, (_,i)=>({
  x:120,
  y:90 + i*80,
  r:25,
  color: getRandomColor(),
  placed:false,
  slot:null
}));

const targets = Array.from({length:5}, (_,i)=>({
  x:720,
  y:90 + i*80,
  size:50,
  color: getRandomColor()
}));

const buttons = Array.from({length:10}, ()=>({
  x:320 + Math.random()*220,
  y:60 + Math.random()*380,
  r:18,
  effect: () => {
    if(gameWon) return;
    objects.forEach(o=>{
      o.color = getRandomColor();
      o.placed = false;
      o.slot = null;
    });
  }
}));

function manualRulesValid() {
  const c = objects.map(o => o.color);
  const t = targets.map(s => s.color);
  if(c[0]==="blue" && c[2]==="green") return false;
  if(c[3]==="purple" && c[4]!=="red") return false;
  for(let i=0;i<4;i++) if(c[i]===c[i+1]) return false;
  if(c[2]==="green" && (c[0]!=="red" || c[4]!=="blue")) return false;
  if(c[1]==="yellow" && c[3]==="blue") return false;
  if(c[2]==="pink" && c[1]===c[3]) return false;
  if(c.includes("brown") && c[0]==="gray") return false;
  if(t[2]==="yellow" && c[2]==="purple") return false;
  if(t.includes("gray") && c[0]==="cyan") return false;
  if(t[4]==="red" && c[0]===c[3]) return false;
  for(let i=0;i<objects.length;i++){
    if(objects[i].slot===null) return false;
    if(!allowedSlots[i].includes(objects[i].slot)) return false;
  }
  return true;
}

function checkWin() { gameWon = objects.every(o => o.placed) && manualRulesValid(); }

function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);

  targets.forEach((t,i)=>{
    ctx.strokeStyle = t.color;
    ctx.lineWidth = 4;
    ctx.strokeRect(t.x,t.y,t.size,t.size);
    ctx.fillStyle="#000";
    ctx.font="12px sans-serif";
    ctx.fillText(String.fromCharCode(65+i), t.x+18, t.y-5);
  });

  if(dragging || hoverObject){
    const o = dragging || hoverObject;
    allowedSlots[o.index].forEach(slot=>{
      const t = targets[slot];
      ctx.fillStyle = "rgba(0,255,0,0.2)";
      ctx.fillRect(t.x,t.y,t.size,t.size);
    });
  }

  buttons.forEach(b=>{
    ctx.beginPath();
    ctx.arc(b.x,b.y,b.r,0,Math.PI*2);
    ctx.fillStyle="#444";
    ctx.fill();
    ctx.fillStyle="white";
    ctx.font="12px sans-serif";
    ctx.fillText("C", b.x-4, b.y+4);
  });

  objects.forEach((o,i)=>{
    ctx.beginPath();
    ctx.arc(o.x,o.y,o.r,0,Math.PI*2);
    ctx.fillStyle=o.color;
    ctx.fill();
    o.index = i;
  });

  if(gameWon){
    ctx.fillStyle="rgba(0,0,0,0.65)";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle="white";
    ctx.font="48px sans-serif";
    ctx.textAlign="center";
    ctx.fillText("YOU WIN", canvas.width/2, canvas.height/2);
  }

  requestAnimationFrame(draw);
}
draw();

function inside(mx,my,x,y,r){ return Math.hypot(mx-x,my-y) < r; }

canvas.addEventListener("mousemove", e=>{
  const r = canvas.getBoundingClientRect();
  const mx = e.clientX - r.left;
  const my = e.clientY - r.top;
  hoverObject = null;
  if(gameWon) return;
  objects.forEach(o=>{ if(!o.placed && inside(mx,my,o.x,o.y,o.r)) hoverObject=o; });
  if(dragging){
    dragging.x = mx - offX;
    dragging.y = my - offY;
  }
});

canvas.addEventListener("mousedown", e=>{
  if(gameWon) return;
  const r = canvas.getBoundingClientRect();
  const mx = e.clientX - r.left;
  const my = e.clientY - r.top;
  for(let b of buttons){ if(inside(mx,my,b.x,b.y,b.r)){ b.effect(); return; } }
  for(let o of objects){ if(!o.placed && inside(mx,my,o.x,o.y,o.r)){
      dragging = o;
      offX = mx - o.x;
      offY = my - o.y;
      return;
  }}
});

canvas.addEventListener("mouseup", ()=>{
  if(!dragging || gameWon) return;
  targets.forEach((t,i)=>{
    if(dragging.x>t.x && dragging.x<t.x+t.size &&
       dragging.y>t.y && dragging.y<t.y+t.size){
      dragging.x = t.x + t.size/2;
      dragging.y = t.y + t.size/2;
      dragging.placed = true;
      dragging.slot = i;
    }
  });
  dragging = null;
  checkWin();
});