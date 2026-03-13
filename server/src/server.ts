import http from "http";
import express from "express";
import cors from "cors";
import { Server } from "colyseus";
import { monitor } from "@colyseus/monitor";
import { GameRoom } from "./rooms/GameRoom";

import path from "path";

// ---- Global Error Handling ----
// Safety net: prevent server crash from Colyseus internal errors (e.g. protocol edge cases)
process.on('uncaughtException', (err: any) => {
    const errorStr = String(err?.message || err || "").toLowerCase();
    // Swallow known Colyseus/WebSocket transient errors that don't need restart
    if (
        errorStr.includes('bytes is not iterable') ||
        errorStr.includes('econnreset') ||
        errorStr.includes('epipe') ||
        errorStr.includes('decode error')
    ) {
        console.warn('[Server] Caught non-fatal error (server stays alive):', err?.message || err);
        return;
    }
    // Log unknown errors but keep server running
    console.error('[Server] Uncaught exception:', err);
});

process.on('unhandledRejection', (reason: any) => {
    console.error('[Server] Unhandled rejection:', reason);
});
// --------------------------------



const port = Number(process.env.PORT || 2567);
const app = express();

app.use(cors());
app.use(express.json());

// Serve Static Files (Client Build)
const clientBuildPath = path.join(process.cwd(), "public");
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
    pingInterval: 5000, // 5 detik — cukup untuk deteksi disconnect tanpa mengganggu initial handshake
    pingMaxRetries: 3,
});

// Register Room Handlers
gameServer.define("game_room", GameRoom).filterBy(['roomCode']);

// Register Colyseus monitor
app.use("/colyseus", monitor());

// Fallback to index.html for SPA routing
app.get("*", (req, res) => {
    res.sendFile(path.join(clientBuildPath, "index.html"));
});

gameServer.listen(port, "0.0.0.0");
console.log(`Listening on ws://localhost:${port}`);
// trigger reload
// trigger reload
