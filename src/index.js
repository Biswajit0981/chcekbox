import http from "node:http";
import path from "node:path";
import express from "express";
import { Server } from "socket.io";

async function main() {
  const app = express();
  const server = http.createServer(app);
  const PORT = process.env.PORT ?? 8000;
  const state = Array.from({ length: 1e5 }, (_, id) => ({
    id,
    checked: false,
  }));

  // ! create socket server
  const io = new Server();
  // attach io with server.

  io.attach(server);

  // listen from client

  io.on("connection", (socket) => {
    socket.broadcast.emit('user:join', socket.id);
    socket.on("toogle", (data) => {
      state[data.id] = {
        id: data.id,
        checked: data.checked,
      };
      socket.broadcast.emit("onToggle", state[data.id]);
    });
  });

  app.use(express.static(path.resolve("./public")));

  app.get("/health", (req, res) => {
    res.status(200).send(`Good`);
  });

  app.get("/state", (req, res) => {
    let { page = "1", limit = "100" } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const paginatedState = state.slice(startIndex, endIndex);

    return res.status(200).json({ state:paginatedState, totalPages: state.length});
  });

  server.listen(PORT, () => console.log(`http://localhost:${PORT}`));
}

main();
