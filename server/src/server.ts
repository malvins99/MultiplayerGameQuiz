import http from "http";
import express from "express";
import cors from "cors";
import { Server } from "colyseus";
import { monitor } from "@colyseus/monitor";
import { GameRoom } from "./rooms/GameRoom";
import crypto from "crypto";
import { spawn } from "child_process";

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
app.set('trust proxy', 1);
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

// SEO Files: Serve from subfolder at root level for search engine discovery
app.get("/robots.txt", (req, res) => res.sendFile(path.join(clientBuildPath, "seo", "robots.txt")));
app.get("/sitemap.xml", (req, res) => res.sendFile(path.join(clientBuildPath, "seo", "sitemap.xml")));

const server = http.createServer(app);
const gameServer = new Server({
    server,
    publicAddress: "zigma.gameforsmart.com",
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

// GitHub Webhook for Auto Deployment
app.post("/api/githubWebhook", async (req, res) => {
    const signature = req.headers["x-hub-signature-256"];
    const SECRET = "e694k3dRoH/lbYM5Ze/2SkCpLpT9UgB6+6wGIBx0Dk0=";

    if (!signature) {
        return res.status(401).json({ error: "No signature" });
    }

    // Since app.use(express.json()) is used, we need to stringify it back for comparison
    // or use a raw-body parser. For simplicity with GitHub, we'll assume JSON match.
    const rawBody = JSON.stringify(req.body);
    const hash =
        "sha256=" +
        crypto
            .createHmac("sha256", SECRET)
            .update(rawBody)
            .digest("hex");

    // Timing safe comparison to prevent timing attacks
    const hashBuffer = Buffer.from(hash);
    const signatureBuffer = Buffer.from(signature as string);

    if (hashBuffer.length !== signatureBuffer.length || !crypto.timingSafeEqual(hashBuffer, signatureBuffer)) {
        console.warn("[Webhook] Invalid signature received");
        return res.status(403).json({ error: "Invalid signature" });
    }

    const payload = req.body;

    // Check branch
    if (payload.ref !== "refs/heads/main" && payload.ref !== "refs/heads/merge-akhir" && payload.ref !== "refs/heads/test") {
        return res.json({ message: "Not a monitored branch" });
    }

    const commit = payload.head_commit;
    const author = commit?.author?.name || "Unknown";
    const message = commit?.message || "-";
    const hashShort = commit?.id?.substring(0, 7) || "N/A";

    console.log(`[Webhook] Deployment triggered by ${author}: ${message} (${hashShort})`);

    // Path to the deployment script
    const scriptPath = "/www/wwwroot/Bot-Deploy/deploy-zigma.sh";

    spawn("bash", [scriptPath, author, hashShort, message], {
        detached: true,
        stdio: "ignore",
    }).unref();

    return res.json({ success: true });
});

gameServer.listen(port, "0.0.0.0");
console.log(`Listening on ws://localhost:${port}`);
// trigger reload
// trigger reload
