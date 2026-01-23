const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const COLORS = ["red","green","blue","yellow","orange","purple","cyan","pink","brown","gray"];
const WARM = ["red","yellow","orange","pink","brown"];
const COLD = ["blue","cyan","purple","gray","green"];

let dragging = null;
let offsetX = 0, offsetY = 0;
let gameResult = null;

const spheres = Array.from({ length: 5 }, (_, i) => ({
  x: 100,
  y: 80 + i * 80,
  r: 25,
  color: COLORS[Math.floor(Math.random() * COLORS.length)]
}));

const switches = Array.from({ length: 10 }, (_, i) => ({
  x: 350 + i * 45,
  y: 350,
  w: 30,
  h: 60,
  on: false
}));

const checkButton = { x: 740, y: 40, w: 120, h: 40 };

function insideCircle(mx, my, c) {
  return Math.hypot(mx - c.x, my - c.y) < c.r;
}

function insideRect(mx, my, r) {
  return mx > r.x && mx < r.x + r.w && my > r.y && my < r.y + r.h;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.font = "14px sans-serif";
  spheres.forEach((s, i) => {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = s.color;
    ctx.fill();
    ctx.fillStyle = "white";
    ctx.fillText(i + 1, s.x - 4, s.y + 5);
  });

  ctx.font = "14px sans-serif";
  switches.forEach((sw, i) => {
    ctx.fillStyle = sw.on ? "#0f0" : "#555";
    ctx.fillRect(sw.x, sw.y + (sw.on ? 0 : 30), sw.w, 30);
    ctx.strokeStyle = "#aaa";
    ctx.strokeRect(sw.x, sw.y, sw.w, sw.h);
    ctx.fillStyle = "white";
    ctx.fillText(i + 1, sw.x + 8, sw.y + 75);
  });

  ctx.fillStyle = "#333";
  ctx.fillRect(checkButton.x, checkButton.y, checkButton.w, checkButton.h);
  ctx.strokeStyle = "#aaa";
  ctx.strokeRect(checkButton.x, checkButton.y, checkButton.w, checkButton.h);
  ctx.fillStyle = "white";
  ctx.font = "16px sans-serif";
  ctx.fillText("CHECK", checkButton.x + 35, checkButton.y + 26);

  if (gameResult) {
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = gameResult === "win" ? "#0f0" : "#f00";
    ctx.font = "48px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(gameResult === "win" ? "ПОБЕДА" : "ПРОИГРЫШ", canvas.width / 2, canvas.height / 2);
    ctx.textAlign = "left";
  }

  requestAnimationFrame(draw);
}
draw();

canvas.addEventListener("mousedown", e => {
  const r = canvas.getBoundingClientRect();
  const mx = e.clientX - r.left;
  const my = e.clientY - r.top;

  if (insideRect(mx, my, checkButton)) {
    gameResult = validateSwitches() ? "win" : "lose";
    return;
  }

  for (let s of spheres) {
    if (insideCircle(mx, my, s)) {
      dragging = s;
      offsetX = mx - s.x;
      offsetY = my - s.y;
      return;
    }
  }

  for (let sw of switches) {
    if (insideRect(mx, my, sw)) {
      sw.on = !sw.on;
      return;
    }
  }
});

canvas.addEventListener("mousemove", e => {
  if (!dragging) return;
  const r = canvas.getBoundingClientRect();
  dragging.x = e.clientX - r.left - offsetX;
  dragging.y = e.clientY - r.top - offsetY;
});

canvas.addEventListener("mouseup", () => dragging = null);

function validateSwitches() {
  const c = spheres.map(s => s.color);

  let expected = [
    WARM.includes(c[0]),
    COLD.includes(c[1]),
    c[2] === c[0] || c[2] === c[4],
    c[3] === "green" || c[3] === "brown",
    new Set(c).size < 5,
    WARM.includes(c[4]) && c[2] !== "blue",
    WARM.includes(c[1]) !== WARM.includes(c[3]),
    c[0] !== c[1] && c[1] !== c[2] && c[0] !== c[2],
    !["gray","brown","green"].includes(c[2]),
    (c.includes("blue") + c.includes("red") + COLD.includes(c[4])) % 2 === 1
  ];

  let invalid = false;

  const onCount = expected.filter(v => v).length;

  if (expected[0] === expected[1] && expected[1] === expected[2]) expected[9] = true;
  if (expected[4]) expected[5] = false;
  if (expected[6] !== expected[7]) expected[3] = true;
  if (onCount === 5) expected[0] = false;

  if (expected[9] && expected[1] === expected[8]) invalid = true;
  if (expected[2] && expected[5] && expected[8]) expected[7] = false;
  if (!expected[3]) expected[6] = !expected[1];
  if (expected.slice(0, 5).filter(v => v).length > 2) expected[5] = true;

  if (expected[7] && !expected[8] && expected[9]) invalid = true;

  const even = [1,3,5,7,9].map(i => expected[i]);
  if (even.every(v => v === even[0])) {
    [0,2,4,6,8].forEach(i => expected[i] = !even[0]);
  }

  if (invalid) return false;
  return switches.every((sw, i) => sw.on === expected[i]);
}
