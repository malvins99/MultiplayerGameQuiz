"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameRoom = void 0;
const colyseus_1 = require("colyseus");
const GameState_1 = require("./GameState");
const MapParser_1 = require("../utils/MapParser");
const ROOM_CONFIG = {
    mudah: { maxPlayers: 4, targetQuestions: 5, enemiesPerPlayer: 10 },
    sedang: { maxPlayers: 5, targetQuestions: 10, enemiesPerPlayer: 20 },
    sulit: { maxPlayers: 6, targetQuestions: 20, enemiesPerPlayer: 40 }
};
const LOBBY_MAX_PLAYERS = 20;
class GameRoom extends colyseus_1.Room {
    constructor() {
        super(...arguments);
        // Track which spawn points have been used
        // Track which spawn points have been used
        this.usedSpawnIndices = new Set();
        this.cachedMapData = null;
        // Local storage for detailed answers (not synced)
        this.playerAnswers = new Map();
        // --- Game Timer & End Logic ---
        this.gameTimerInterval = null;
        this.GAME_DURATION_MS = 5 * 60 * 1000; // 5 minutes
    }
    onCreate(options) {
        this.setState(new GameState_1.GameState());
        // Mencegah Colyseus OTOMATIS menghapus room saat kosong (saat host refresh)
        // Room hanya akan dihapus jika this.disconnect() dipanggil secara manual
        this.autoDispose = false;
        console.log(`[GameRoom] onCreate - autoDispose set to: ${this.autoDispose}`);
        this.state.subject = options.subject || "matematika";
        this.state.difficulty = options.difficulty || "mudah";
        // Use provided room code from client (which matches Supabase session) or generate one
        this.state.roomCode = options.roomCode || this.generateRoomCode();
        // Load Questions from Options
        if (options.questions && Array.isArray(options.questions)) {
            console.log(`[GameRoom] Loading ${options.questions.length} questions from options.`);
            options.questions.forEach((q, i) => {
                const newQ = new GameState_1.Question();
                newQ.id = i;
                // Flexible mapping for various potential schemas
                newQ.text = q.pertanyaan || q.question || q.text || "No Question Text";
                newQ.imageUrl = q.image || q.image_url || "";
                newQ.answerType = q.answerType || 'text';
                // Determine Correct Answer Index
                if (typeof q.correctAnswer === 'number') {
                    newQ.correctAnswer = q.correctAnswer;
                }
                else if (typeof q.kunci_jawaban === 'string') {
                    // Map 'a','b','c','d' to 0,1,2,3
                    const map = { 'a': 0, 'b': 1, 'c': 2, 'd': 3 };
                    newQ.correctAnswer = map[q.kunci_jawaban.toLowerCase()] ?? 0;
                }
                else {
                    newQ.correctAnswer = 0;
                }
                // Options
                let rawOptions = [];
                if (Array.isArray(q.options)) {
                    // Standard array of strings
                    rawOptions = q.options;
                }
                else if (Array.isArray(q.answers)) {
                    // JSON format provided by user: array of objects { id, answer, ... }
                    // Sort by ID to ensure order if necessary, but usually just map 'answer' property
                    rawOptions = q.answers.map((ans) => ans.answer || "");
                    // Re-evaluate correct answer if 'correct' is string index in this format
                    if (q.correct !== undefined) {
                        newQ.correctAnswer = parseInt(String(q.correct)) || 0;
                    }
                }
                else {
                    // Try multiple possible keys for options (Legacy/Other formats)
                    rawOptions = [
                        q.jawaban_a || q.option_a || q.pil_a || q.a || "",
                        q.jawaban_b || q.option_b || q.pil_b || q.b || "",
                        q.jawaban_c || q.option_c || q.pil_c || q.c || "",
                        q.jawaban_d || q.option_d || q.pil_d || q.d || ""
                    ];
                }
                rawOptions.forEach(opt => newQ.options.push(String(opt || "")));
                this.state.questions.push(newQ);
            });
        }
        // Store Supabase Session ID in metadata
        this.setMetadata({
            roomCode: this.state.roomCode,
            sessionId: options.sessionId
        });
        // Set max clients for the entire lobby
        this.maxClients = LOBBY_MAX_PLAYERS;
        // Get config based on difficulty
        const config = ROOM_CONFIG[this.state.difficulty];
        // Initialize Sub-Rooms
        const subRoomCapacity = config ? config.maxPlayers : 4;
        const totalSubRooms = Math.ceil(LOBBY_MAX_PLAYERS / subRoomCapacity);
        for (let i = 1; i <= totalSubRooms; i++) {
            const sub = new GameState_1.SubRoom();
            sub.id = `Room ${i}`;
            sub.capacity = subRoomCapacity;
            this.state.subRooms.push(sub);
        }
        this.onMessage("movePlayer", (client, data) => {
            const player = this.state.players.get(client.sessionId);
            if (player) {
                player.x = data.x;
                player.y = data.y;
                if (data.targetX !== undefined)
                    player.targetX = data.targetX;
                if (data.targetY !== undefined)
                    player.targetY = data.targetY;
            }
        });
        this.onMessage("startGame", (client) => {
            if (this.state.isGameStarted || this.state.countdown > 0)
                return;
            // Start Countdown
            this.state.countdown = 10;
            console.log("[GameRoom] Starting countdown: 10");
            // Initialize game elements (map, enemies, etc.) immediately so clients can preload
            console.log("[GameRoom] Pre-initializing game elements during countdown...");
            this.initializeGameElements();
            const countdownInterval = setInterval(() => {
                if (this.state.countdown > 0) {
                    this.state.countdown--;
                    console.log(`[GameRoom] Countdown: ${this.state.countdown}`);
                }
                // If it hit 0 (or somehow less), Start Game
                if (this.state.countdown <= 0) {
                    clearInterval(countdownInterval);
                    this.state.countdown = 0;
                    console.log("[GameRoom] Countdown finished, activating game state.");
                    this.state.isGameStarted = true;
                    this.state.gameStartTime = Date.now();
                    // Mark host as finished automatically (host doesn't play)
                    this.state.players.forEach(player => {
                        if (player.isHost) {
                            player.isFinished = true;
                            player.finishTime = Date.now();
                            console.log("[GameRoom] Host auto-marked as finished.");
                        }
                    });
                    // Start the gameplay timer only when game officially starts
                    this.startGameTimer();
                    this.broadcast("gameStarted");
                }
            }, 1000);
        });
        this.onMessage("manualLeave", (client) => {
            client.manualLeave = true;
        });
        this.onMessage("correctAnswer", (client, data) => {
            const player = this.state.players.get(client.sessionId);
            if (player && !player.isFinished) {
                player.correctAnswers++;
                player.answeredQuestions++;
                // Track Answer
                let answers = this.playerAnswers.get(client.sessionId);
                if (!answers) {
                    answers = [];
                    this.playerAnswers.set(client.sessionId, answers);
                }
                answers.push({
                    question_id: data.questionId,
                    answer_id: data.answerId, // Client needs to send this
                    correct: true,
                    timestamp: Date.now()
                });
                // Target SPECIFIC enemy by index to avoid sync issues
                const enemyIndex = data.enemyIndex;
                if (enemyIndex !== undefined) {
                    const enemy = this.state.enemies[enemyIndex];
                    // Validate ownership and liveness
                    if (enemy && enemy.ownerId === client.sessionId && enemy.isAlive) {
                        enemy.isAlive = false;
                        enemy.isBusy = false;
                        enemy.isFleeing = false;
                        enemy.targetX = 0;
                        enemy.targetY = 0;
                    }
                }
                // Check if player finished all required questions
                const totalQuestions = this.state.questions.length;
                if (player.answeredQuestions >= totalQuestions && !player.isFinished) {
                    player.isFinished = true;
                    player.finishTime = Date.now();
                    client.send("playerFinished");
                    this.checkGameEnd();
                }
            }
        });
        this.onMessage("wrongAnswer", (client, data) => {
            const player = this.state.players.get(client.sessionId);
            if (player && !player.isFinished) {
                player.hasWrongAnswer = true;
                player.lastWrongQuestionId = data.questionId;
                player.wrongAnswers++;
                player.answeredQuestions++;
                // Track Answer
                let answers = this.playerAnswers.get(client.sessionId);
                if (!answers) {
                    answers = [];
                    this.playerAnswers.set(client.sessionId, answers);
                }
                answers.push({
                    question_id: data.questionId,
                    answer_id: data.answerId,
                    correct: false,
                    timestamp: Date.now()
                });
                // 2. Fitur Reset Enemy (Dari Versi Teman/Incoming)
                const enemyIndex = data.enemyIndex;
                if (enemyIndex !== undefined) {
                    const enemy = this.state.enemies[enemyIndex];
                    if (enemy) {
                        enemy.isBusy = false;
                        enemy.isFleeing = false;
                        enemy.targetX = 0;
                        enemy.targetY = 0;
                    }
                }
                // Cek apakah player selesai menjawab semua soal
                const totalQuestions = this.state.questions.length;
                if (player.answeredQuestions >= totalQuestions && !player.isFinished) {
                    player.isFinished = true;
                    player.finishTime = Date.now();
                    client.send("playerFinished");
                    this.checkGameEnd();
                }
            }
        });
        this.onMessage("addScore", (client, data) => {
            const player = this.state.players.get(client.sessionId);
            if (player) {
                // Calculate points dynamic based on total questions (Max 100)
                const totalQuestions = this.state.questions.length || 1;
                const pointsPerCorrect = 100 / totalQuestions;
                player.score = Math.min(100, player.score + pointsPerCorrect);
            }
        });
        this.onMessage("addScoreFromChest", (client, data) => {
            const player = this.state.players.get(client.sessionId);
            if (player) {
                // Chest gives half points of a normal question
                const totalQuestions = this.state.questions.length || 1;
                const pointsPerCorrect = 100 / totalQuestions;
                const chestPoints = pointsPerCorrect / 2;
                player.score = Math.min(100, player.score + chestPoints);
            }
        });
        // Kill enemy without counting as answered (for wrong answer case)
        this.onMessage("killEnemy", (client, data) => {
            const enemyIndex = data.enemyIndex;
            if (enemyIndex !== undefined) {
                const enemy = this.state.enemies[enemyIndex];
                if (enemy && enemy.ownerId === client.sessionId && enemy.isAlive) {
                    enemy.isAlive = false;
                    enemy.isBusy = false;
                    enemy.isFleeing = false;
                    enemy.targetX = 0;
                    enemy.targetY = 0;
                }
            }
        });
        this.onMessage("collectChest", (client, data) => {
            const player = this.state.players.get(client.sessionId);
            const chestIndex = data.chestIndex;
            const chest = this.state.chests[chestIndex];
            if (player && chest && !chest.isCollected && !player.hasUsedChest && player.hasWrongAnswer) {
                chest.isCollected = true;
                chest.collectedBy = client.sessionId;
                player.hasUsedChest = true;
                client.send("retryQuestion", { questionId: player.lastWrongQuestionId });
            }
        });
        // --- Name Update Handler ---
        this.onMessage("updateName", (client, data) => {
            const player = this.state.players.get(client.sessionId);
            if (player && data.name && typeof data.name === "string") {
                player.name = data.name.substring(0, 20); // Limit to 20 chars
            }
        });
        // --- Hair Update Handler ---
        this.onMessage("updateHair", (client, data) => {
            const player = this.state.players.get(client.sessionId);
            if (player && data.hairId !== undefined) {
                player.hairId = Number(data.hairId);
            }
        });
        // --- Kick Player Handler ---
        this.onMessage("kickPlayer", (client, payload) => {
            const player = this.state.players.get(client.sessionId);
            if (!player || !player.isHost)
                return; // Hanya host bisa kick
            const targetSessionId = payload.sessionId;
            const targetClient = this.clients.find(c => c.sessionId === targetSessionId);
            if (targetClient) {
                console.log(`[GameRoom] Host kicked player ${targetSessionId}`);
                targetClient.send("kicked", { message: "You have been kicked by the host." });
                // Tandai client sebagai kicked agar onLeave tidak menunggu reconnect
                targetClient.kicked = true;
                targetClient.leave(); // Force leave
            }
            else {
                // Handle ghost player (state ada tapi client putus)
                const targetPlayer = this.state.players.get(targetSessionId);
                // Jika player offline tapi masih di state, kita bisa force remove atau biarkan timeout
                // Untuk amannya, biarkan timeout/reconnection logic handle (atau force remove jika perlu)
            }
        });
        // --- Switch Room Handler ---
        this.onMessage("switchRoom", (client, message) => {
            const roomId = message.roomId;
            const player = this.state.players.get(client.sessionId);
            if (player && roomId && roomId !== player.subRoomId) {
                const targetRoom = this.state.subRooms.find(r => r.id === roomId);
                const currentRoom = this.state.subRooms.find(r => r.id === player.subRoomId);
                if (targetRoom && targetRoom.playerIds.length < targetRoom.capacity) {
                    // Remove from old room
                    if (currentRoom) {
                        const idx = currentRoom.playerIds.indexOf(client.sessionId);
                        if (idx > -1)
                            currentRoom.playerIds.splice(idx, 1);
                    }
                    // Add to new room
                    targetRoom.playerIds.push(client.sessionId);
                    player.subRoomId = roomId;
                    console.log(`Player ${player.name} switched from ${currentRoom?.id} to ${roomId}`);
                }
            }
        });
        // Monitor Enemy Flee Logic (10 FPS is enough)
        this.setSimulationInterval((deltaTime) => this.update(deltaTime));
        // --- Engage Enemy Handler ---
        this.onMessage("engageEnemy", (client, data) => {
            const enemyIndex = data.enemyIndex;
            // Map key is string, but sometimes passed as number index if array
            // Our state.enemies is ArraySchema, so index is correct
            if (enemyIndex !== undefined) {
                const enemy = this.state.enemies[enemyIndex];
                if (enemy && enemy.isAlive) {
                    enemy.isBusy = true;
                    enemy.isFleeing = false;
                    enemy.targetX = 0;
                    enemy.targetY = 0;
                    console.log(`Enemy ${enemyIndex} engaged by ${client.sessionId}. Movement halted.`);
                }
            }
        });
        // --- Host End Game Handler ---
        this.onMessage("hostEndGame", (client) => {
            // Verify that the client is the host
            if (client.sessionId === this.state.hostId) {
                console.log(`[GameRoom] Host ${client.sessionId} manually ended the game.`);
                this.endGame();
            }
            else {
                console.log(`[GameRoom] Non-host ${client.sessionId} attempted to end game. Ignored.`);
            }
        });
    }
    update(deltaTime) {
        if (!this.state.isGameStarted)
            return;
        const ENEMY_SPEED = 110; // px/sec
        const FLEE_RADIUS = 180; // Distance to trigger flee
        const REST_DURATION_MIN = 2000; // 2 seconds
        const REST_DURATION_MAX = 3000; // 3 seconds
        const ARRIVAL_THRESHOLD = 20; // px - considered "arrived" at waypoint
        const now = Date.now();
        // Process each enemy
        this.state.enemies.forEach(enemy => {
            if (!enemy.isAlive)
                return;
            // If busy (in quiz), DO NOT MOVE
            if (enemy.isBusy)
                return;
            const owner = this.state.players.get(enemy.ownerId);
            if (!owner)
                return;
            // Check if resting
            if (enemy.restUntil > 0) {
                if (now < enemy.restUntil) {
                    // Still resting
                    enemy.isFleeing = false;
                    return;
                }
                else {
                    // Rest period over
                    enemy.restUntil = 0;
                }
            }
            // Calculate distance to owner
            const dx = enemy.x - owner.x;
            const dy = enemy.y - owner.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            // Calculate distance to owner's target (Intent-based fleeing)
            let distToTarget = Infinity;
            if (owner.targetX > 0 && owner.targetY > 0) {
                const tdx = enemy.x - owner.targetX;
                const tdy = enemy.y - owner.targetY;
                distToTarget = Math.sqrt(tdx * tdx + tdy * tdy);
            }
            // Flee if currently near player OR if player is explicitly targeting near the enemy
            if (dist < FLEE_RADIUS || distToTarget < (FLEE_RADIUS * 0.7)) {
                // Need to flee!
                enemy.isFleeing = true;
                // Dynamic Recalculation Logic
                // If already fleeing, check if we need to change destination (e.g. cut off or too close)
                const RECALC_INTERVAL = 200; // ms (Faster reflex)
                let needsNewWaypoint = false;
                if (enemy.targetX === 0 && enemy.targetY === 0) {
                    needsNewWaypoint = true;
                }
                else if (now - enemy.lastRecalc > RECALC_INTERVAL) {
                    // 1. Intercept Check: Is player closer to our target than we are?
                    const distPlayerToTarget = Math.sqrt(Math.pow(owner.x - enemy.targetX, 2) + Math.pow(owner.y - enemy.targetY, 2));
                    const distEnemyToTarget = Math.sqrt(Math.pow(enemy.x - enemy.targetX, 2) + Math.pow(enemy.y - enemy.targetY, 2));
                    // 2. Proximity Check: Is player getting too close?
                    const isTooClose = dist < FLEE_RADIUS * 0.6;
                    // 3. Directional Check: Is our CURRENT path actually bringing us CLOSER to the player?
                    // (Check distance to player from a projected point on our path)
                    const toTargetX = enemy.targetX - enemy.x;
                    const toTargetY = enemy.targetY - enemy.y;
                    const mag = Math.sqrt(toTargetX * toTargetX + toTargetY * toTargetY);
                    const projectX = enemy.x + (toTargetX / mag) * 50;
                    const projectY = enemy.y + (toTargetY / mag) * 50;
                    const distProjectedToPlayer = Math.sqrt(Math.pow(projectX - owner.x, 2) + Math.pow(projectY - owner.y, 2));
                    const isPathUnsafe = distProjectedToPlayer < dist; // Path moves closer to player
                    if (distPlayerToTarget < distEnemyToTarget || isTooClose || isPathUnsafe) {
                        needsNewWaypoint = true;
                        // console.log(`Enemy ${enemy.questionId} escaping dynamically. Reason: ${distPlayerToTarget < distEnemyToTarget ? 'CutOff' : isTooClose ? 'TooClose' : 'UnsafePath'}`);
                    }
                }
                if (needsNewWaypoint) {
                    const waypoint = this.pickWaypointAwayFromPlayer(enemy, owner);
                    enemy.targetX = waypoint.x;
                    enemy.targetY = waypoint.y;
                    enemy.lastRecalc = now;
                }
                // Move toward waypoint
                const toTargetX = enemy.targetX - enemy.x;
                const toTargetY = enemy.targetY - enemy.y;
                const distToTarget = Math.sqrt(toTargetX * toTargetX + toTargetY * toTargetY);
                if (distToTarget < ARRIVAL_THRESHOLD) {
                    // Arrived at waypoint - rest
                    const restTime = REST_DURATION_MIN + Math.random() * (REST_DURATION_MAX - REST_DURATION_MIN);
                    enemy.restUntil = now + restTime;
                    enemy.targetX = 0;
                    enemy.targetY = 0;
                    enemy.isFleeing = false;
                }
                else {
                    // Move toward target
                    const vx = toTargetX / distToTarget;
                    const vy = toTargetY / distToTarget;
                    const moveDist = (ENEMY_SPEED * deltaTime) / 1000;
                    let nextX = enemy.x + vx * moveDist;
                    let nextY = enemy.y + vy * moveDist;
                    // Boundary check
                    const maxX = this.cachedMapData ? this.cachedMapData.mapWidth : 2000;
                    const maxY = this.cachedMapData ? this.cachedMapData.mapHeight : 1120;
                    if (nextX < 50)
                        nextX = 50;
                    if (nextX > maxX - 50)
                        nextX = maxX - 50;
                    if (nextY < 50)
                        nextY = 50;
                    if (nextY > maxY - 50)
                        nextY = maxY - 50;
                    enemy.x = nextX;
                    enemy.y = nextY;
                }
                // --- SEPARATION LOGIC (Avoid Clumping) ---
                const MIN_DIST = 80; // Maintain at least 80px distance
                this.state.enemies.forEach(otherEnemy => {
                    if (otherEnemy === enemy || !otherEnemy.isAlive || otherEnemy.ownerId !== enemy.ownerId)
                        return;
                    const sepDx = enemy.x - otherEnemy.x;
                    const sepDy = enemy.y - otherEnemy.y;
                    const sepDistSq = sepDx * sepDx + sepDy * sepDy;
                    if (sepDistSq < MIN_DIST * MIN_DIST) {
                        const d = Math.sqrt(sepDistSq) || 1;
                        const pushForce = (MIN_DIST - d) / d * 0.4; // Nudge value
                        enemy.x += sepDx * pushForce;
                        enemy.y += sepDy * pushForce;
                    }
                });
            }
            else {
                // Player far away - idle
                enemy.isFleeing = false;
                enemy.targetX = 0;
                enemy.targetY = 0;
            }
        });
    }
    // Pick a waypoint that's away from the player
    pickWaypointAwayFromPlayer(enemy, player) {
        // Generate waypoints from enemy's spawn zone
        const candidates = [];
        // Load map data to get zone info
        const mapData = this.cachedMapData || MapParser_1.MapParser.loadMapData(this.state.difficulty);
        let zone = { x: 50, y: 50, width: 1500, height: 1500 };
        if (enemy.spawnZoneIndex !== -1 && mapData && mapData.enemySpawnZones && mapData.enemySpawnZones[enemy.spawnZoneIndex]) {
            zone = mapData.enemySpawnZones[enemy.spawnZoneIndex];
        }
        // Generate 12 random candidate waypoints in the zone for better variety
        for (let i = 0; i < 12; i++) {
            const wx = zone.x + Math.random() * (zone.width || 200);
            const wy = zone.y + Math.random() * (zone.height || 200);
            // Calculate distance from player
            const dx = wx - player.x;
            const dy = wy - player.y;
            const distFromPlayer = Math.sqrt(dx * dx + dy * dy);
            // Calculate "Evasion Score"
            // We want points that are:
            // 1. Far from the player (primary goal)
            // 2. Not too far from the enemy (to avoid extreme jumps)
            // 3. Different from current target (to ensure change)
            const distFromEnemy = Math.sqrt(Math.pow(wx - enemy.x, 2) + Math.pow(wy - enemy.y, 2));
            // Weight: 70% distance from player, 30% closeness to enemy (efficiency)
            let score = distFromPlayer * 1.5 - distFromEnemy * 0.2;
            // Penalty if the point is too close to current enemy position (don't stay still)
            if (distFromEnemy < 50)
                score -= 1000;
            candidates.push({ x: wx, y: wy, score: score });
        }
        // Sort by score (highest first)
        candidates.sort((a, b) => b.score - a.score);
        return { x: candidates[0].x, y: candidates[0].y };
    }
    onJoin(client, options) {
        console.log(client.sessionId, "joined!");
        // First player to join is the host.
        // The host manages the lobby but DOES NOT participate as an in-game avatar.
        if (!this.state.hostId) {
            this.state.hostId = client.sessionId;
            console.log(`[Host] ${options.name || "System"} is the host (${client.sessionId}). Skipping added to players list.`);
            return; // EXIT EARLY: Host is not added to state.players
        }
        // --- NON-HOST PLAYERS ONLY ---
        const player = new GameState_1.Player();
        player.sessionId = client.sessionId;
        player.name = options.name || "Player " + (this.state.players.size + 1);
        // Assign spawn position from Map Data
        const mapData = MapParser_1.MapParser.loadMapData(this.state.difficulty);
        console.log(`[MapDebug] Loaded map for difficulty: ${this.state.difficulty}`);
        console.log(`[MapDebug] Player Spawns found: ${mapData?.playerSpawns?.length ?? 0}`);
        console.log(`[MapDebug] Enemy Zones found: ${mapData?.enemySpawnZones?.length ?? 0}`);
        if (mapData && mapData.playerSpawns && mapData.playerSpawns.length > 0) {
            // Find an unused spawn point
            let spawnIndex = -1;
            // Try to find a strictly unused spawn point
            for (let i = 0; i < mapData.playerSpawns.length; i++) {
                if (!this.usedSpawnIndices.has(i)) {
                    spawnIndex = i;
                    break;
                }
            }
            // DO NOT reset usedSpawnIndices here. If we are full, we are full.
            if (spawnIndex === -1) {
                console.warn("[Spawn] No empty spawn points left! Overwriting index 0.");
                spawnIndex = 0; // Fallback, but don't clear the set so duplicates stay minimized
            }
            this.usedSpawnIndices.add(spawnIndex);
            const spawn = mapData.playerSpawns[spawnIndex];
            player.x = spawn.x;
            player.y = spawn.y;
            player.spawnIndex = spawnIndex;
            console.log(`[Spawn] Player ${player.name} assigned spawn point ${spawnIndex} at (${spawn.x}, ${spawn.y}).`);
        }
        else {
            console.error("[Spawn] No spawn points found in map data! Using fallback 400,300.");
            player.x = 400;
            player.y = 300;
        }
        this.state.players.set(client.sessionId, player);
        // Auto-assign to first available sub-room (non-host players only)
        let assignedRoom = this.state.subRooms.find(r => r.playerIds.length < r.capacity);
        if (!assignedRoom) {
            // Should not happen if maxClients is correct, but fallback to first
            assignedRoom = this.state.subRooms[0];
        }
        if (assignedRoom) {
            player.subRoomId = assignedRoom.id;
            assignedRoom.playerIds.push(client.sessionId);
        }
    }
    async onLeave(client, consented) {
        console.log(client.sessionId, "left! consented:", consented);
        const isHostLeave = this.state.hostId === client.sessionId;
        const player = this.state.players.get(client.sessionId);
        // Cek jika di-kick secara paksa
        const isKicked = client.kicked === true;
        // manualLeave = true hanya jika host eksplisit klik tombol EXIT
        const isManualLeave = client.manualLeave === true;
        if (isHostLeave) {
            console.log(`[GameRoom] Host leaving. this.autoDispose is:`, this.autoDispose);
            if (isManualLeave) {
                console.log(`[GameRoom] Host clicked EXIT. Disposing room.`);
                this.disconnect();
            }
            else {
                console.log(`[GameRoom] Host disconnected (refresh/connection lost). Room stays alive.`);
            }
            return;
        }
        // --- NON-HOST PLAYERS ONLY ---
        // Beri window reconnect untuk player biasa (kecuali jika di-kick)
        if (!isKicked) {
            console.log(`[GameRoom] Player ${client.sessionId} disconnected. Allowing 10s reconnection...`);
            try {
                await this.allowReconnection(client, 10);
                console.log(`[GameRoom] Player ${client.sessionId} reconnected!`);
                return;
            }
            catch (e) {
                console.log(`[GameRoom] Player ${client.sessionId} reconnection timed out.`);
            }
        }
        // Hapus player dari state (timeout atau di-kick)
        if (player) {
            if (player.spawnIndex !== -1) {
                this.usedSpawnIndices.delete(player.spawnIndex);
                console.log(`[Spawn] Freed spawn point ${player.spawnIndex} for player ${player.name}`);
            }
            const subRoom = this.state.subRooms.find(r => r.id === player.subRoomId);
            if (subRoom) {
                const idx = subRoom.playerIds.indexOf(client.sessionId);
                if (idx > -1)
                    subRoom.playerIds.splice(idx, 1);
            }
        }
        this.state.players.delete(client.sessionId);
        // Jika host intentionally leave → tutup room
        if (player?.isHost && consented) {
            console.log(`[GameRoom] Host left intentionally. Disposing room.`);
            this.disconnect();
            return;
        }
        if (this.state.isGameStarted && !this.state.isGameOver) {
            this.checkGameEnd();
        }
    }
    onDispose() {
        console.log("room", this.roomId, "disposing...");
    }
    disconnect(closeCode) {
        console.log(`[GameRoom] disconnect() called with code ${closeCode}! Stack trace:`, new Error().stack);
        return super.disconnect(closeCode);
    }
    generateRoomCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
    initializeGameElements() {
        if (!this.state.difficulty || !ROOM_CONFIG[this.state.difficulty]) {
            console.warn(`[GameRoom] Invalid difficulty: ${this.state.difficulty}. Defaulting to 'mudah'.`);
            this.state.difficulty = 'mudah';
        }
        const config = ROOM_CONFIG[this.state.difficulty];
        this.cachedMapData = MapParser_1.MapParser.loadMapData(this.state.difficulty);
        const mapData = this.cachedMapData;
        // Minimum distance between enemies to prevent overlap (in pixels)
        const MIN_ENEMY_DISTANCE = 96; // Increased from 48px to 96px
        const MAX_SPAWN_ATTEMPTS = 100; // Max attempts to find valid position
        // Helper function to check distance from existing enemies and players
        const isValidSpawnPosition = (x, y, minDist = 96) => {
            // Check against existing enemies
            for (const existingEnemy of this.state.enemies) {
                const dx = existingEnemy.x - x;
                const dy = existingEnemy.y - y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < minDist) {
                    return false;
                }
            }
            // Check against players (prevent spawn kill)
            // Strict distance from players is always enforced (100px minimum)
            for (const player of this.state.players.values()) {
                const dx = player.x - x;
                const dy = player.y - y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < 100) {
                    return false;
                }
            }
            return true;
        };
        // Create Enemies Per Player
        this.state.players.forEach(player => {
            // Host gets NO enemies
            if (player.isHost)
                return;
            // SAFETY: Ensure questions exist
            if (this.state.questions.length === 0) {
                console.warn("[GameRoom] No questions found! Adding a fallback question.");
                const fallbackQ = new GameState_1.Question();
                fallbackQ.id = 0;
                fallbackQ.text = "Mengapa game ini tidak memiliki soal?";
                fallbackQ.options.push("Host Lupa Memilih");
                fallbackQ.options.push("Koneksi Error");
                fallbackQ.options.push("Bug Sistem");
                fallbackQ.options.push("A & C Benar");
                fallbackQ.correctAnswer = 3;
                this.state.questions.push(fallbackQ);
            }
            // Generate Randomized Question Order for this player (Indices)
            let questionIndices = [];
            if (this.state.questions.length > 0) {
                // Shuffle actual INDICES (0, 1, 2...), not IDs relative to something else
                questionIndices = Array.from({ length: this.state.questions.length }, (_, k) => k);
                // Fisher-Yates Shuffle
                for (let k = questionIndices.length - 1; k > 0; k--) {
                    const j = Math.floor(Math.random() * (k + 1));
                    [questionIndices[k], questionIndices[j]] = [questionIndices[j], questionIndices[k]];
                }
                // Store in player state
                questionIndices.forEach(idx => player.questionOrder.push(idx));
            }
            // Use decaying radius logic for enemy placement
            // Consolidate enemy creation to try strict distance first -> then relax if needed
            let enemiesSpawnedForPlayer = 0;
            // We want 'config.enemiesPerPlayer' enemies
            for (let i = 0; i < config.enemiesPerPlayer; i++) {
                const enemy = new GameState_1.Enemy();
                enemy.ownerId = player.sessionId;
                // Assign Question Index from shuffled order (Cyclic)
                if (questionIndices.length > 0) {
                    const orderIndex = i % questionIndices.length;
                    enemy.questionId = questionIndices[orderIndex];
                }
                else {
                    enemy.questionId = 0;
                }
                enemy.type = Math.random() < 0.6 ? "skeleton" : "goblin";
                let foundPosition = false;
                // Tiers of distance: 96px (ideal) -> 64px -> 32px (crowded)
                const distanceTiers = [96, 64, 32];
                for (const minDistance of distanceTiers) {
                    let attempts = 0;
                    const maxAttemptsPerTier = 20;
                    while (attempts < maxAttemptsPerTier && !foundPosition) {
                        let x = 0, y = 0;
                        let zoneIndex = -1;
                        if (mapData && mapData.enemySpawnZones && mapData.enemySpawnZones.length > 0) {
                            zoneIndex = Math.floor(Math.random() * mapData.enemySpawnZones.length);
                            const zone = mapData.enemySpawnZones[zoneIndex];
                            // Ensure zone has width/height
                            const w = zone.width || 200;
                            const h = zone.height || 200;
                            x = zone.x + Math.random() * w;
                            y = zone.y + Math.random() * h;
                        }
                        else {
                            const maxX = mapData ? mapData.mapWidth : 800;
                            const maxY = mapData ? mapData.mapHeight : 600;
                            // Avoid spawning exactly at 0,0
                            x = 50 + Math.random() * (maxX - 100);
                            y = 50 + Math.random() * (maxY - 100);
                        }
                        if (isValidSpawnPosition(x, y, minDistance)) {
                            enemy.x = x;
                            enemy.y = y;
                            enemy.spawnZoneIndex = zoneIndex; // Assign spawn zone
                            foundPosition = true;
                        }
                        attempts++;
                    }
                    if (foundPosition)
                        break;
                }
                if (foundPosition) {
                    this.state.enemies.push(enemy);
                    enemiesSpawnedForPlayer++;
                }
                else {
                    console.warn(`[Spawn] Could not find valid position for enemy belonging to ${player.name} even with relaxed rules.`);
                }
            }
        });
        // Create Chests from Map Data
        console.log("[Debug] mapData.chests:", mapData?.chests);
        if (mapData && mapData.chests.length > 0) {
            mapData.chests.forEach((c) => {
                const chest = new GameState_1.Chest();
                chest.x = c.x;
                chest.y = c.y;
                this.state.chests.push(chest);
                console.log(`[Debug] Created chest at (${c.x}, ${c.y})`);
            });
        }
        console.log(`[Debug] Total chests created: ${this.state.chests.length}`);
    }
    startGameTimer() {
        const endTime = Date.now() + this.GAME_DURATION_MS;
        // Update remaining time every second
        this.gameTimerInterval = setInterval(() => {
            const remaining = Math.max(0, endTime - Date.now());
            this.broadcast("timerUpdate", { remaining });
            if (remaining <= 0) {
                this.endGame();
            }
        }, 1000);
    }
    checkGameEnd() {
        // Check if all players are finished
        let allFinished = true;
        let nonHostCount = 0;
        let finishedCount = 0;
        this.state.players.forEach(player => {
            if (!player.isHost) {
                nonHostCount++;
                if (player.isFinished) {
                    finishedCount++;
                }
                else {
                    allFinished = false;
                }
            }
        });
        console.log(`[CheckGameEnd] Total players: ${this.state.players.size}, Non-host: ${nonHostCount}, Finished: ${finishedCount}, AllFinished: ${allFinished}`);
        if (allFinished && this.state.players.size > 0) {
            console.log("[CheckGameEnd] All players finished! Ending game...");
            this.endGame();
        }
    }
    endGame() {
        if (this.state.isGameOver)
            return; // Prevent double-end
        this.state.isGameOver = true;
        // Clear timer
        if (this.gameTimerInterval) {
            clearInterval(this.gameTimerInterval);
            this.gameTimerInterval = null;
        }
        // Mark unfinished players as finished
        this.state.players.forEach(player => {
            if (!player.isFinished) {
                player.isFinished = true;
                player.finishTime = Date.now();
            }
        });
        // Calculate Rankings: Sort by score DESC, then finishTime ASC
        const rankings = Array.from(this.state.players.values())
            .filter(p => !p.isHost)
            .sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score; // Higher score first
            }
            return a.finishTime - b.finishTime; // Earlier finish time first
        })
            .map((player, index) => ({
            rank: index + 1,
            sessionId: player.sessionId,
            name: player.name,
            hairId: player.hairId || 0, // Ensure hairId is sent
            score: player.score,
            finishTime: player.finishTime,
            duration: player.finishTime > 0 ? (player.finishTime - this.state.gameStartTime) : 0, // Calculate duration
            correctAnswers: player.correctAnswers,
            wrongAnswers: player.wrongAnswers,
            // Add Answer History for Supabase
            currentQuestion: player.answeredQuestions,
            answers: this.playerAnswers ? (this.playerAnswers.get(player.sessionId) || []) : []
        }));
        console.log("[EndGame] Broadcasting gameEnded with rankings:", rankings.length);
        this.broadcast("gameEnded", { rankings });
    }
}
exports.GameRoom = GameRoom;
//ikan
