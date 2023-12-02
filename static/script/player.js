const player_cam = document.getElementById("player-cam");
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
