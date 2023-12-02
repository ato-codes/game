class Rect {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.health = 100;
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
    return this.intersects(r.x, r.y) || this.intersects(r.x+r.width, r.y) || this.intersects(r.x, r.y+r.height) || this.intersects(r.x+r.width, r.y+r.height);
  }

  update() {
    var xVel = (keys['ArrowRight'] || false) - (keys['ArrowLeft'] || false)
    var yVel = (keys['ArrowDown'] || false) - (keys['ArrowUp'] || false)

    this.x += xVel * PLAYER_SPEED
    for (var w in walls) {
      if (walls[w].hitsRect(new Rect(this.x+BLOCK_SIZE/4, this.y+BLOCK_SIZE/4, BLOCK_SIZE/2, BLOCK_SIZE/2))) {
        this.x -= xVel * PLAYER_SPEED
      }
    }
    this.y += yVel * PLAYER_SPEED
    for (var w in walls) {
      if (walls[w].hitsRect(new Rect(this.x+BLOCK_SIZE/4, this.y+BLOCK_SIZE/4, BLOCK_SIZE/2, BLOCK_SIZE/2))) {
        this.y -= yVel * PLAYER_SPEED
      }
    }
    this.shoot(Math.random()*canvas.width, Math.random()*canvas.height)
  }

  shoot(mouseX, mouseY) {
    var angle = Math.atan2(mouseY - canvas.height/2, mouseX-canvas.width/2)
    bullets.push(new Bullet("normal", this.x + BLOCK_SIZE/2, this.y + BLOCK_SIZE/2, BULLET_SPEED*Math.cos(angle), BULLET_SPEED*Math.sin(angle)))
  }
}

class Bullet {
  constructor(type, x, y, xVel, yVel) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.xVel = xVel;
    this.yVel = yVel
    this.damage = 10
  }

  update() {
    this.x += this.xVel;
    this.y += this.yVel;

    for (var w in walls) {
      if (walls[w].intersects(this.x, this.y)) {
        walls[w].health -= this.damage;
        return true;
      }
    }

    return this.x < 0 || this.y < 0 || this.x > WIDTH || this.y > HEIGHT
  }
}

const BLOCK_SIZE = 50;
const BULLET_SIZE = 10;

const BULLET_SPEED = 460/60;
const PLAYER_SPEED = 160/60;

var WIDTH = 3000, HEIGHT = 3000;
var camera = {x : WIDTH/2, y: HEIGHT/2}
var player = new Rect(WIDTH/2, HEIGHT/2, BLOCK_SIZE, BLOCK_SIZE)
var canvas = document.getElementById("canvas")
var cxt = canvas.getContext('2d')

var keys = {}
function handleKeyDown(event) {
  keys[event.code]= true
}

function handleKeyUp(event) {
  keys[event.code]= false
}
canvas.addEventListener('keydown', handleKeyDown);
canvas.addEventListener('keyup', handleKeyUp);
canvas.setAttribute('tabindex', '0');
canvas.focus();

var players = []
var bullets = []
var walls = []

const generateWalls = () => {
  var newWalls = []
  for (var i = 0; i < 30; i++) {
    var incX = Math.round(Math.random()*2-1)
    var incY = incX ? 0 : (Math.random() > 0.5 ? 1 : -1)
    var len = Math.random()*30
    var startX = Math.round(Math.random()*WIDTH/BLOCK_SIZE)*BLOCK_SIZE
    var startY = Math.round(Math.random()*WIDTH/BLOCK_SIZE)*BLOCK_SIZE

    for (var j = 0; j < len; j++) {
      var wall = new Rect(startX + j*incX*BLOCK_SIZE, startY + j*incY*BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE)
      if (!wall.hitsRect(player)) walls.push(wall)
    }
  }
}

const gameUpdate = () => {
  cxt.clearRect(0, 0, canvas.width, canvas.height);

  for (var i = 0; i < bullets.length; i++) {
    if(bullets[i].update()) {
      bullets.splice(i, 1);
      i--;
    }
  }
  for (var i = 0; i < walls.length; i++) {
    if(walls[i].health <= 0) {
      walls.splice(i, 1);
      i--;
    }
  }

  player.update();

  camera.x = player.x
  camera.y = player.y


  gameDraw()
}

const gameDraw = () => {
  cxt.save();
  cxt.translate(Math.round((-camera.x-BLOCK_SIZE/2)+canvas.width/2), Math.round((-camera.y-BLOCK_SIZE/2)+canvas.height/2))

  cxt.fillStyle = "blue"
  cxt.fillRect(player.x, player.y, player.width, player.height)

  cxt.fillStyle = "red"
  for (var b in bullets) {
    cxt.fillRect(bullets[b].x-BULLET_SIZE/2, bullets[b].y-BULLET_SIZE/2, BULLET_SIZE, BULLET_SIZE)
  }
  for (var w in walls) {
    var s = walls[w].health/100
    cxt.fillStyle = `rgb(${190*s/2+50}, 0, ${190*s})`;
    cxt.fillRect(walls[w].x, walls[w].y, BLOCK_SIZE, BLOCK_SIZE)
  }


  cxt.restore();
}
setInterval(gameUpdate, 1000/60);
generateWalls()
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