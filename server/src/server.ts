import http from "http";
import express from "express";
import cors from "cors";
import { Server } from "colyseus";
import { monitor } from "@colyseus/monitor";
import { GameRoom } from "./rooms/GameRoom";

import path from "path";

const port = Number(process.env.PORT || 2567);
const app = express();

app.use(cors());
app.use(express.json());

// Serve Static Files (Client Build)
const clientBuildPath = path.join(__dirname, "../public");
app.use(express.static(clientBuildPath));

const server = http.createServer(app);
const gameServer = new Server({
    server,
});

// Register Room Handlers
gameServer.define("game_room", GameRoom);

// Register Colyseus monitor
app.use("/colyseus", monitor());

// Fallback to index.html for SPA routing
app.get("*", (req, res) => {
    res.sendFile(path.join(clientBuildPath, "index.html"));
});

gameServer.listen(port);
console.log(`Listening on ws://localhost:${port}`);
