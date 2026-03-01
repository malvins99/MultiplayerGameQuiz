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
console.log("Serving static files from:", clientBuildPath);
console.log("__dirname is:", __dirname);

// Verify public directory exists
import fs from "fs";
if (!fs.existsSync(clientBuildPath)) {
    console.error(`ERROR: Public directory not found at: ${clientBuildPath}`);
    console.log("Current directory:", process.cwd());
    console.log("Directory contents:", fs.readdirSync(path.dirname(clientBuildPath)));
} else {
    console.log("✓ Public directory found");
    const indexPath = path.join(clientBuildPath, "index.html");
    if (!fs.existsSync(indexPath)) {
        console.error(`ERROR: index.html not found at: ${indexPath}`);
    } else {
        console.log("✓ index.html found");
    }
}

app.use(express.static(clientBuildPath));

const server = http.createServer(app);
const gameServer = new Server({
    server,
});

// Register Room Handlers
gameServer.define("game_room", GameRoom).filterBy(['roomCode']);

// Register Colyseus monitor
app.use("/colyseus", monitor());

// Fallback to index.html for SPA routing
app.get("*", (req, res) => {
    res.sendFile(path.join(clientBuildPath, "index.html"));
});

gameServer.listen(port);
console.log(`Listening on ws://localhost:${port}`);
