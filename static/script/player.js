const EXPLOSIVE_COOLDOWN = 120;
const BULLET_COOLDOWN = 1000 / 10;
const EXPLOSIVE_RADIUS = 200;
const EXPLOSION_DAMAGE = 60;

const PLAYER_SCALE = 3;

class Rect {
  constructor(x, y, width, height, powerup) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.health = 100;
    this.powerups = [];
    this.numBullets = 1;
    this.speed = 1;
    this.powerup = powerup;
  }

  drawPowerup() {
    var dist = Math.sqrt(
      Math.pow(this.x - camera.x, 2) + Math.pow(this.y - camera.y, 2)
    );

    if (dist > WIDTH / 2 + BLOCK_SIZE) return;

    cxt.drawImage(
      document.getElementById(`pu${this.powerup}`),
      this.x,
      this.y,
      BLOCK_SIZE,
      BLOCK_SIZE
    );
  }

  respawn() {
    this.x = Math.random() * WIDTH;
    this.y = Math.random() * HEIGHT;
    this.powerups = [];
    this.health = 100;
    this.numBullets = 1;
    this.speed = 1;
  }

  intersects(x, y) {
    return (
      x >= this.x &&
      x <= this.x + this.width &&
      y >= this.y &&
      y <= this.y + this.height
    );
  }
  hitsRect(r) {
    return (
      this.intersects(r.x, r.y) ||
      this.intersects(r.x + r.width, r.y) ||
      this.intersects(r.x, r.y + r.height) ||
      this.intersects(r.x + r.width, r.y + r.height)
    );
  }

  addPowerup(p) {
    if (p.powerup == 1) this.numBullets++;
    if (p.powerup == 2) this.health = Math.max(100, this.health);
    if (p.powerup == 3) this.health = 200;
    if (p.powerup == 4) this.speed++;
    else this.powerups.push(p);
  }

  update() {
    if (this.powerup) {
      if (this.hitsRect(player)) {
        player.addPowerup(this);
        powerups = powerups.filter((p) => p != this);
      }
      for (var p in players) {
        if (this.hitsRect(players[p])) {
          powerups = powerups.filter((p) => p != this);
        }
      }
    } else {
      var xVel =
        (keys["ArrowRight"] || keys["KeyD"] || false) -
        (keys["ArrowLeft"] || keys["KeyA"] || false);
      var yVel =
        (keys["ArrowDown"] || keys["KeyS"] || false) -
        (keys["ArrowUp"] || keys["KeyW"] || false);

      this.x += xVel * PLAYER_SPEED * this.speed;
      for (var w in walls) {
        if (
          walls[w].hitsRect(
            new Rect(
              this.x + PLAYER_SCALE * BLOCK_SIZE / 4,
              this.y + PLAYER_SCALE * BLOCK_SIZE / 4,
              BLOCK_SIZE * PLAYER_SCALE / 2,
              BLOCK_SIZE * PLAYER_SCALE / 2
            )
          )
        ) {
          this.x -= xVel * PLAYER_SPEED * this.speed;
        }
      }
      this.y += yVel * PLAYER_SPEED * this.speed;
      for (var w in walls) {
        if (
          walls[w].hitsRect(
            new Rect(
              this.x + PLAYER_SCALE * BLOCK_SIZE / 4,
              this.y + PLAYER_SCALE * BLOCK_SIZE / 4,
              BLOCK_SIZE * PLAYER_SCALE / 2,
              BLOCK_SIZE * PLAYER_SCALE / 2
            )
          )
        ) {
          this.y -= yVel * PLAYER_SPEED * this.speed;
        }
      }
      if (keys["click"]) this.shoot(keys["mouse x"] || 0, keys["mouse y"] || 0);
      if (keys["right click"])
        this.shootExplosive(keys["mouse x"] || 0, keys["mouse y"] || 0);
      if (this.health < 0) this.respawn();
    }
  }
  toObject() {
    return { x: this.x, y: this.y, h: this.health, p: this.powerup };
  }

  getAngle() {
    return Math.atan2(
      keys["mouse y"] - canvas.height / 2,
      keys["mouse x"] - canvas.width / 2
    );
  }

  shoot(mouseX, mouseY) {
    var cooldown = BULLET_COOLDOWN / (this.powerups.length + 1);
    if (this.lastBullet && Date.now() - this.lastBullet < cooldown) return;

    for (var i = 0; i < this.numBullets; i++) {
      var angle =
        Math.atan2(mouseY - canvas.height / 2, mouseX - canvas.width / 2) +
        (Math.random() - 0.5) / 6;
      var b = new Bullet(
        "normal",
        this.x + (PLAYER_SCALE * BLOCK_SIZE) / 2 + Math.cos(angle) * 30,
        this.y + (PLAYER_SCALE * BLOCK_SIZE) / 2 + Math.sin(angle) * 30,
        BULLET_SPEED * Math.cos(angle),
        BULLET_SPEED * Math.sin(angle)
      );
      send("bullet_spawned", {
        type: b.type,
        x: b.x,
        y: b.y,
        xVel: b.xVel,
        yVel: b.yVel,
      });
      bullets.push(b);
    }

    this.lastBullet = Date.now();
  }
  shootExplosive(mouseX, mouseY) {
    var cooldown = EXPLOSIVE_COOLDOWN / (this.powerups.length + 1);
    if (this.lastBullet && Date.now() - this.lastBullet < cooldown) return;
    
    for (var i = 0; i < this.numBullets; i++) {
      var angle = Math.atan2(
        mouseY - canvas.height / 2,
        mouseX - canvas.width / 2
      )+
      (Math.random() - 0.5) / 4.5;
      var b = new Bullet(
        "explosive",
        this.x + BLOCK_SIZE / 2,
        this.y + BLOCK_SIZE / 2,
        BULLET_SPEED * Math.cos(angle),
        BULLET_SPEED * Math.sin(angle)
      );
      send("bullet_spawned", {
        type: b.type,
        x: b.x,
        y: b.y,
        xVel: b.xVel,
        yVel: b.yVel,
      });
      bullets.push(b);
    }

    this.lastExplosive = Date.now();
  }
}

class Bullet {
  constructor(type, x, y, xVel, yVel) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.xVel = xVel;
    this.yVel = yVel;
    this.damage = 10;
    this.myBullet = true;
  }

  update() {
    this.x += this.xVel;
    this.y += this.yVel;

    for (var w in walls) {
      if (walls[w].intersects(this.x, this.y)) {
        walls[w].health -= this.damage;
        if (this.type == "explosive") this.explode();
        return true;
      }
    }
    for (var p in players) {
      if (
        players[p].intersects(this.x, this.y) &&
        this.playerId != players[p].id
      ) {
        if (this.type == "explosive") this.explode();
        return true;
      }
    }
    if (!this.myBullet && player.intersects(this.x, this.y)) {
      player.health -= this.damage;
      if (this.type == "explosive") this.explode();
      return true;
    }

    return this.x < 0 || this.y < 0 || this.x > WIDTH || this.y > HEIGHT;
  }

  draw() {
    cxt.drawImage(
      document.getElementById("bullet" + (this.type == "explosive" ? "2" : "0")),
      this.x - BULLET_SIZE / 2,
      this.y - BULLET_SIZE / 2,
      BULLET_SIZE,
      BULLET_SIZE
    );
    // cxt.fillRect(
    //   this.x - BULLET_SIZE / 2,
    //   this.y - BULLET_SIZE / 2,
    //   BULLET_SIZE,
    //   BULLET_SIZE
    // );
  }

  explode() {
    explosions.push(new Explosion(this.x, this.y));
  }
}

class Explosion {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.lifetime = 30;
  }

  draw() {
    var r = (EXPLOSIVE_RADIUS * this.lifetime) / 30;
    cxt.fillRect(this.x - r, this.y - r, r * 2, r * 2);
  }
  update() {
    if (this.lifetime == 30) {
      var dist = Math.sqrt(
        Math.pow(player.x - this.x, 2) + Math.pow(player.y - this.y, 2)
      );
      if (dist < EXPLOSIVE_RADIUS) {
        player.health -= EXPLOSION_DAMAGE * (1 - dist / EXPLOSIVE_RADIUS);
      }

      for (var w in walls) {
        var dist = Math.sqrt(
          Math.pow(walls[w].x + BLOCK_SIZE / 2 - this.x, 2) +
            Math.pow(walls[w].y + BLOCK_SIZE / 2 - this.y, 2)
        );
        if (dist < EXPLOSIVE_RADIUS) {
          walls[w].health -= EXPLOSION_DAMAGE * (1 - dist / EXPLOSIVE_RADIUS);
        }
      }
    }

    this.lifetime--;
    if (this.lifetime == 0) {
      return true;
    }
  }
}

const BLOCK_SIZE = 50;
const WALL_REGEN_TIME = 10000;
const BULLET_SIZE = 30;

const BULLET_SPEED = 460 / 60;
const PLAYER_SPEED = 160 / 60;

var WIDTH = 4000,
  HEIGHT = 4000;
var camera = { x: WIDTH / 2, y: HEIGHT / 2 };
var player = new Rect(WIDTH / 2, HEIGHT / 2, BLOCK_SIZE*PLAYER_SCALE, BLOCK_SIZE*PLAYER_SCALE);
player.id = Math.round(Math.random() * 100000000);
var canvas = document.getElementById("canvas");
var cxt = canvas.getContext("2d");

var keys = {};
function handleKeyDown(event) {
  keys[event.code] = true;
}

function handleKeyUp(event) {
  keys[event.code] = false;
}
function handleMouseDown(event) {
  if (event.button == 0) keys["click"] = true;
  if (event.button == 2) keys["right click"] = true;
  event.preventDefault();
}

function handleMouseUp(event) {
  if (event.button == 0) keys["click"] = false;
  if (event.button == 2) keys["right click"] = false;
  event.preventDefault();
}
function handleMouseMove(event) {
  var canvasRect = canvas.getBoundingClientRect();
  keys["mouse x"] = event.clientX - canvasRect.left;
  keys["mouse y"] = event.clientY - canvasRect.top;
}

canvas.addEventListener("mousedown", handleMouseDown);
canvas.addEventListener("mousemove", handleMouseMove);
canvas.addEventListener("mouseup", handleMouseUp);
canvas.addEventListener("keydown", handleKeyDown);
canvas.addEventListener("keyup", handleKeyUp);
canvas.oncontextmenu = function (e) {
  e.preventDefault();
};
canvas.setAttribute("tabindex", "0");
canvas.focus();

var players = [];
var bullets = [];
var walls = [];
var explosions = [];
var powerups = [];

const generateWalls = () => {
  for (var i = 0; i < 2; i++) generatePowerups()
  var newWalls = [];
  for (var i = 0; i < 30; i++) {
    var incX = Math.round(Math.random() * 2 - 1);
    var incY = incX ? 0 : Math.random() > 0.5 ? 1 : -1;
    var len = Math.random() * 30;
    var startX = Math.round((Math.random() * WIDTH) / BLOCK_SIZE) * BLOCK_SIZE;
    var startY = Math.round((Math.random() * WIDTH) / BLOCK_SIZE) * BLOCK_SIZE;

    for (var j = 0; j < len; j++) {
      var wall = new Rect(
        startX + j * incX * BLOCK_SIZE,
        startY + j * incY * BLOCK_SIZE,
        BLOCK_SIZE,
        BLOCK_SIZE
      );
      if (!wall.hitsRect(player)) walls.push(wall);
    }
  }
};

const generatePowerups = () => {
  for (let i = 0; i <= 10; i++) {
    var power = new Rect(
      Math.random() * WIDTH,
      Math.random() * HEIGHT,
      BLOCK_SIZE,
      BLOCK_SIZE,
      Math.floor(Math.random() * 3 + 1)
    );

    powerups.push(power);
  }
};

const gameUpdate = () => {
  if (!connected) return;
  cxt.clearRect(0, 0, canvas.width, canvas.height);

  for (var i = 0; i < bullets.length; i++) {
    if (bullets[i].update()) {
      bullets.splice(i, 1);
      i--;
    }
  }
  for (var i = 0; i < explosions.length; i++) {
    if (explosions[i].update()) {
      explosions.splice(i, 1);
      i--;
    }
  }
  for (var i = 0; i < walls.length; i++) {
    if (walls[i].health <= 0) {
      walls.splice(i, 1);
      i--;
    }
  }
  for (var i = 0; i < powerups.length; i++) {
    powerups[i].update();
  }

  player.update();

  send("player_moved", { x: player.x, y: player.y });

  camera.x = player.x;
  camera.y = player.y;

  gameDraw();
};

const send = (req, data) => {
  if (connected) {
    socket.send(stringify({ req: req, data: { id: player.id, ...data } }));
  }
};

const HEALTHBAR_X = 40,
  HEALTH_BAR_Y = 40,
  HEALTHBAR_HEIGHT = 30,
  HEALTHBAR_WIDTH = 450;

const drawPlayer = (x, y, a, e = false) => {
  cxt.save();

  cxt.translate(
    x + (player.width) / 2,
    y + (player.height) / 2
  );
  cxt.rotate(a);
  cxt.drawImage(
    document.getElementById(e ? "p2" : "p1"),
    (-player.width) / 2,
    (-player.height) / 2,
    player.width,
    player.height
  );

  cxt.restore();
};

const drawWall = (wall) => {
  var dist = Math.sqrt(
    Math.pow(wall.x - camera.x, 2) + Math.pow(wall.y - camera.y, 2)
  );

  if (dist > WIDTH / 2 + BLOCK_SIZE) return;
  var s = wall.health / 100;
  cxt.fillStyle = `rgb(${(190 * s) / 2 + 50}, 0, ${190 * s})`;
  cxt.drawImage(
    document.getElementById("tile"),
    wall.x,
    wall.y,
    BLOCK_SIZE,
    BLOCK_SIZE
  );
  cxt.globalAlpha = 1 - s;
  cxt.fillRect(wall.x, wall.y, BLOCK_SIZE, BLOCK_SIZE);
  cxt.globalAlpha = 1;
};

const gameDraw = () => {
  cxt.save();
  cxt.translate(
    Math.round(-camera.x - BLOCK_SIZE / 2 + canvas.width / 2),
    Math.round(-camera.y - BLOCK_SIZE / 2 + canvas.height / 2)
  );

  cxt.fillStyle = "blue";
  drawPlayer(player.x, player.y, player.getAngle(), true);

  cxt.fillStyle = "green";
  for (var p in players) {
    drawPlayer(players[p].x, players[p].y, 0);
  }

  cxt.fillStyle = "red";
  for (var b in bullets) {
    bullets[b].draw();
  }
  for (var w in walls) {
    drawWall(walls[w]);
  }
  for (var p in powerups) {
    powerups[p].drawPowerup();
  }

  cxt.fillStyle = "orange";
  for (var e in explosions) {
    explosions[e].draw();
  }

  cxt.restore();

  // UI

  cxt.fillStyle = "green";
  cxt.fillRect(
    HEALTHBAR_X - 2,
    HEALTH_BAR_Y - 2,
    HEALTHBAR_WIDTH + 4,
    HEALTHBAR_HEIGHT + 4
  );

  cxt.fillStyle = "rgb(0,160,0)";
  cxt.fillRect(
    HEALTHBAR_X,
    HEALTH_BAR_Y,
    (HEALTHBAR_WIDTH * player.health) / 100,
    HEALTHBAR_HEIGHT
  );
};
setInterval(gameUpdate, 1000 / 60);
for (var i = 0; i < 10; i++) generateWalls();

var lastGeneratedWalls = Date.now();

var connected = false;
const socket = new WebSocket("ws://192.168.1.22:3000");
const stringify = (data) => JSON.stringify(data);
const parseJson = (data) => JSON.parse(data);

socket.onopen = () => {
  connected = true;
  send("player_spawned", { x: player.x, y: player.y });
};

socket.onmessage = async (res) => {
  var d = res.data;
  if (d.text) d = await d.text();
  d = parseJson(d);

  const { req, data } = d;

  if (req == "bullet_spawned") {
    onBulletSpawn(data);
  }
  if (req == "host_request") {
    hostUpdate();
  }
  if (req == "init") {
    loadInitData(data);
  }

  if (req == "player_spawned") {
    onPlayerSpawn(data);
  }
  if (req == "player_moved") {
    onPlayerMove(data);
  }
  if (req == "host") {
    synchroninizeWithHost(data);
  }
};

const hostUpdate = () => {
  if (Date.now() - lastGeneratedWalls > WALL_REGEN_TIME) {
    generateWalls();
    lastGeneratedWalls = Date.now();
  }

  var data = {};
  data.walls = [];
  data.powerups = [];
  data.bullets = [];
  for (var b in bullets) {
  }
  for (var w in walls) {
    w = walls[w];
    data.walls.push(w.toObject());
  }
  for (var p in powerups) {
    p = powerups[p];
    data.powerups.push(p.toObject());
  }
  send("host", data);
};
const synchroninizeWithHost = (data) => {
  var newWalls = [];
  powerups = [];
  for (w in data.walls) {
    w = data.walls[w];
    newWalls.push(new Rect(w.x, w.y, BLOCK_SIZE, BLOCK_SIZE));
    newWalls[newWalls.length - 1].health = w.h;
  }
  for (p in data.powerups) {
    p = data.powerups[p];
    powerups.push(new Rect(p.x, p.y, BLOCK_SIZE, BLOCK_SIZE, p.p));
  }
  walls = newWalls;
};

const loadInitData = (data) => {
  player.id = data.id;
};

const onBulletSpawn = (data) => {
  bullets.push(new Bullet(data.type, data.x, data.y, data.xVel, data.yVel));
  bullets[bullets.length - 1].myBullet = false;
  bullets[bullets.length - 1].playerId = data.id;
};

const onPlayerSpawn = (data) => {
  var p =
    players.find((pl) => pl.id == data.id) ||
    new Rect(data.x, data.y, BLOCK_SIZE, BLOCK_SIZE);
  p.id = data.id;

  if (players.findIndex((pl) => p == pl) == -1) players.push(p);
};
const onPlayerMove = (data) => {
  var p = players.find((pl) => pl.id == data.id);
  if (p) {
    if (p.id != player.id) {
      p.x = data.x;
      p.y = data.y;
    }
  } else {
    onPlayerSpawn(data);
  }
};

/*
on message {

  send to all other player

}

on timer {
  create new blocks
  create new power ups
}



*/

// connect to server
/* listen for events {
  if bullet spawned, add bullet
  if player moved, update or add player
}

game loop {
  update movements (send)
  shoot bullets (send)

  check if walls are being destroyed
  check if bullets hit you

}

*/

/*const player_cam = document.getElementById("player-cam");
const player_ground = document.getElementById("playground");
const view_port = {
  width: document.documentElement.clientWidth,
  height: document.documentElement.clientHeight,
};
let cam_moving_value = 100;
const max_scale = view_port.width * 2;
player_ground.style.width = `${max_scale}px`;
player_ground.style.height = `${max_scale}px`;

const [up, down, left, right] = [
  ["W", "w", "ArrowUp"],
  ["S", "s", "ArrowDown"],
  ["A", "a", "ArrowLeft"],
  ["D", "d", "ArrowRight"],
];

const cam_pos = {
  top: 0,
  left: 0,
};

const player_ground_rect = player_ground.getBoundingClientRect();
const player_cam_rect = player_cam.getBoundingClientRect();

document.onmousemove = (e) => e.preventDefault();

document.onkeydown = (e) => {
  const { key } = e;
  const max_vertical =
    player_cam_rect.height + cam_moving_value + cam_pos.top > max_scale;
  const max_horizontal =
    player_cam_rect.width + cam_moving_value + cam_pos.left > max_scale;
  e.preventDefault();

  if (down.includes(key)) {
    if (cam_pos.top == max_scale || max_vertical) return;
    cam_pos.top += cam_moving_value;
  } else if (up.includes(key)) {
    if (cam_pos.top == 0) return;
    cam_pos.top -= cam_moving_value;
  } else if (left.includes(key)) {
    if (cam_pos.left == 0) return;
    cam_pos.left -= cam_moving_value;
  } else if (right.includes(key)) {
    if (cam_pos.left == max_scale || max_horizontal) return;
    cam_pos.left += cam_moving_value;
  }

  player_cam.style.top = `${cam_pos.top}px`;
  player_cam.style.left = `${cam_pos.left}px`;
  window.scroll(cam_pos);
  console.log(cam_pos);
};
*/
