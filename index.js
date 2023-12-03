require("dotenv").config;
const express = require("express");
const port = 3000 || process.env.PORT;
const app = express();
const { WebSocketServer } = require("ws");
const http = require("http");
const server = http.createServer(app);

app.use(express.json());
app.use(express.static("./static"));

const wss = new WebSocketServer({ server });

let players = [];

const randomCoordinates = () => {
  const x = Math.random() * 1000;
  const y = Math.random() * 1000;
  return { x, y };
};

const create_new_player = () => {
  let new_player = { id: [], x: 0, y: 0 };
  for (let i = 0; i <= 5; i++) {
    new_player.id.push(Math.round(Math.random() * 9));
  }
  new_player.id = `player-${new_player.id.join("")}`;
  players.forEach((player) => {
    if (player.id === new_player.id) {
      return create_new_player();
    }
  });
  players.push(new_player);
  return players;
};

var connections = {};
var host;

function hostUpdate() {
  if (host != undefined)
    host.send(JSON.stringify({ req: "host_request", data: players }));
}

setInterval(hostUpdate, 1000);

wss.on("connection", (ws) => {
  const stringify = (data) => JSON.stringify(data);
  const parseJson = (data) => JSON.parse(data);

  ws.onclose = () => {
    delete connections[
      Object.keys(connections).find((k) => connections[k] == ws)
    ];
    if (ws == host) {
      host = undefined;
    }
    if (Object.keys(connections).length > 0) {
      host =
        Object.entries(connections)[
          Math.floor(Math.random() * Object.keys(connections).length)
        ][1];
    }
  };

  ws.on("message", (msg) => {
    const { req, data } = parseJson(msg);

    if (req == "player_spawned") {
      if (host == undefined) host = ws;
      connections[data.id] = ws;
      hostUpdate();
    }

    for (var conn in connections) {
      if (conn != data.id) connections[conn].send(msg);
    }
    /*if (req == "init") {
            ws.send(stringify({ req: "init", data: create_new_player() }));
        }

        if (req == "player_pos") {
            const { x, y, id } = parseJson(data);
            players = players.map((player) => {
                if (player.id == id) {
                player.x = x;
                player.y = y;
                }
            });

            ws.send(stringify({ req: "player_pos", data: players }));
        }*/
  });

  setInterval(() => {
    ws.send(stringify({ req: "obj_pos", data: randomCoordinates() }));
  }, 5000);
});

server.listen(port, () => console.log(`server listening on port ${port}`));

module.exports = app;
