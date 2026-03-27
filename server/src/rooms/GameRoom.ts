import { Room, Client } from "colyseus";
import { GameState, Player, Enemy, Chest, SubRoom, Question } from "./GameState";
import { supabaseUtama, supabaseB } from "../utils/supabase";
import { QUESTIONS } from "../dummyQuestions";
import { MapParser } from "../utils/MapParser";

const ROOM_CONFIG = {
    mudah: { 
        maxPlayers: 50, targetQuestions: 5, enemiesPerPlayer: 10, enemySpeed: 110,
        fleeRadius: 180, minEnemyDist: 80, recalcInterval: 500, restDurationMin: 2000, restDurationMax: 3000,
        waypointCandidates: 12
    },
    sedang: { 
        maxPlayers: 50, targetQuestions: 10, enemiesPerPlayer: 20, enemySpeed: 150,
        fleeRadius: 180, minEnemyDist: 120, recalcInterval: 200, restDurationMin: 1000, restDurationMax: 2000,
        waypointCandidates: 24
    },
    sulit: { 
        maxPlayers: 50, targetQuestions: 20, enemiesPerPlayer: 40, enemySpeed: 165,
        fleeRadius: 180, minEnemyDist: 150, recalcInterval: 100, restDurationMin: 500, restDurationMax: 1000,
        waypointCandidates: 36
    }
};

const LOBBY_MAX_PLAYERS = 51; // 50 players + 1 host

export class GameRoom extends Room<GameState> {
    // Track which spawn points have been used
    // Track which spawn points have been used
    private usedSpawnIndices: Set<number> = new Set();
    private cachedMapData: any = null;
    private reallyReallyDisconnect: boolean = false;
    // Base config properties for main database
    private originalQuizId: string = "";
    private originalHostId: string = "";
    private originalDifficulty: string = "easy";
    private gamePin: string = "";
    private sessionId: string = "";
    private totalTimeMinutes: number = 5;
    private questionLimit: string = "all";
    private quizDetail: any = {};
    private enemyCountOption: number = 0;

    // Local storage for detailed answers (not synced)
    playerAnswers: Map<string, any[]> = new Map();

    onCreate(options: any) {
        this.setState(new GameState());

        // Mencegah Colyseus OTOMATIS menghapus room saat kosong (saat host refresh)
        // Room hanya akan dihapus jika this.disconnect() dipanggil secara manual
        this.autoDispose = false;
        // @ts-ignore - HACK PERMANEN untuk mencekik autoDispose dari sistem dalam Colyseus
        this._disposeIfEmpty = () => false;

        // Wrap disconnect with a safety flag
        const originalDisconnect = this.disconnect.bind(this);
        this.disconnect = () => {
            if (this.reallyReallyDisconnect) {
                return originalDisconnect();
            }
            console.log("[GameRoom] disconnect() called but IGNORED. Use manualLeave message to dispose.");
            return Promise.resolve();
        };


        this.state.subject = options.subject || "matematika";
        this.state.difficulty = options.difficulty || "mudah";
        // Use provided room code from client (which matches Supabase session) or generate one
        this.state.roomCode = options.roomCode || this.generateRoomCode();

        // Load Questions from Options
        if (options.questions && Array.isArray(options.questions)) {
            console.log(`[GameRoom] Loading ${options.questions.length} questions from options.`);
            options.questions.forEach((q: any, i: number) => {
                const newQ = new Question();
                newQ.id = i;
                // Flexible mapping for various potential schemas
                newQ.text = q.pertanyaan || q.question || q.text || "No Question Text";
                newQ.imageUrl = q.image || q.image_url || "";
                newQ.answerType = q.answerType || 'text';

                // Determine Correct Answer Index
                if (typeof q.correctAnswer === 'number') {
                    newQ.correctAnswer = q.correctAnswer;
                } else if (typeof q.kunci_jawaban === 'string') {
                    // Map 'a','b','c','d' to 0,1,2,3
                    const map: { [key: string]: number } = { 'a': 0, 'b': 1, 'c': 2, 'd': 3 };
                    newQ.correctAnswer = map[q.kunci_jawaban.toLowerCase()] ?? 0;
                } else {
                    newQ.correctAnswer = 0;
                }

                // Options
                let rawOptions: string[] = [];
                if (Array.isArray(q.options)) {
                    // Standard array of strings
                    rawOptions = q.options;
                } else if (Array.isArray(q.answers)) {
                    // JSON format provided by user: array of objects { id, answer, ... }
                    // Sort by ID to ensure order if necessary, but usually just map 'answer' property
                    rawOptions = q.answers.map((ans: any) => ans.answer || "");

                    // Re-evaluate correct answer if 'correct' is string index in this format
                    if (q.correct !== undefined) {
                        newQ.correctAnswer = parseInt(String(q.correct)) || 0;
                    }
                } else {
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

        // Store Basic Match Variables inside instance
        this.originalQuizId = options.quizId || "no_quiz_id";
        this.originalHostId = options.hostId || "no_host_id";
        this.originalDifficulty = options.difficulty || "easy";
        this.gamePin = this.state.roomCode;
        this.sessionId = options.sessionId || "";
        this.totalTimeMinutes = options.timer ? Math.round(options.timer / 60) : 5;
        this.questionLimit = options.questionCount?.toString() || "all";
        this.quizDetail = options.quizDetail || {};
        this.enemyCountOption = options.enemyCount || 0;

        // Sync to state so all clients see it
        this.state.totalTimeMinutes = this.totalTimeMinutes;
        this.state.questionLimit = this.questionLimit;

        // Store Supabase Session ID in metadata
        this.setMetadata({
            roomCode: this.state.roomCode,
            sessionId: options.sessionId
        });

        // --- NEW: Simpan data "Masuk" ke Supabase Utama dan Supabase B saat sesi dibuat ---
        // Fire and forget to avoid blocking room creation
        this.saveInitialSessionToMainSupabase().catch(e => console.error("Initial Main Sync Error:", e));
        this.syncSessionToSupabaseB().catch(e => console.error("Initial Sync B Error:", e));

        // Set max clients for the entire lobby
        this.maxClients = LOBBY_MAX_PLAYERS;

        // Get config based on difficulty
        const config = ROOM_CONFIG[this.state.difficulty as keyof typeof ROOM_CONFIG];

        // Initialize Sub-Rooms
        const subRoomCapacity = config ? config.maxPlayers : 4;
        const totalSubRooms = Math.ceil(LOBBY_MAX_PLAYERS / subRoomCapacity);

        for (let i = 1; i <= totalSubRooms; i++) {
            const sub = new SubRoom();
            sub.id = `Room ${i}`;
            sub.capacity = subRoomCapacity;
            this.state.subRooms.push(sub);
        }

        this.onMessage("movePlayer", (client, data) => {
            const player = this.state.players.get(client.sessionId);
            if (player) {
                player.x = data.x;
                player.y = data.y;
                if (data.targetX !== undefined) player.targetX = data.targetX;
                if (data.targetY !== undefined) player.targetY = data.targetY;
            }
        });

        this.onMessage("startGame", (client) => {
            if (this.state.isGameStarted || this.state.countdown > 0) return;

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

                    // SYNC ALL PARTICIPANTS started_at to Supabase B
                    this.syncAllParticipantsStartedAt();
                    this.state.gameStartTime = Date.now();

                    // Host adalah spectator murni → tidak ada di state.players, tidak perlu di-mark

                    // Start the gameplay timer only when game officially starts
                    this.startGameTimer();
                    this.broadcast("gameStarted");

                    // UPDATE STATUS TO ACTIVE IN SUPABASE UTAMA
                    this.updateSessionToActive();
                }
            }, 1000);
        });

        this.onMessage("manualLeave", (client) => {
            (client as any).manualLeave = true;
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

                // Update Score (Authoritative & Dynamic)
                const qLimit = parseInt(this.questionLimit);
                let totalQuestions = isNaN(qLimit) ? (this.state.questions.length || 1) : qLimit;
                const pointsPerCorrect = 100 / (totalQuestions || 1);
                player.score = Math.min(100, player.score + pointsPerCorrect);

                // Real-time sync to Supabase B

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
                const finalQLimit = parseInt(this.questionLimit);
                totalQuestions = isNaN(finalQLimit) ? this.state.questions.length : finalQLimit;
                if (player.answeredQuestions >= totalQuestions && !player.isFinished) {
                    player.isFinished = true;
                    player.finishTime = Date.now();
                    
                    const playerPayload = {
                        rank: -1,
                        sessionId: player.sessionId,
                        userId: player.userId,
                        name: player.name,
                        hairId: player.hairId || 0,
                        score: player.score,
                        finishTime: player.finishTime,
                        duration: player.finishTime > 0 ? (player.finishTime - this.state.gameStartTime) : 0,
                        correctAnswers: player.correctAnswers,
                        wrongAnswers: player.wrongAnswers,
                        currentQuestion: player.answeredQuestions,
                        answers: this.playerAnswers ? (this.playerAnswers.get(player.sessionId) || []) : []
                    };
                    client.send("playerFinished", playerPayload);
                    this.checkGameEnd();
                }

                // Real-time sync to Supabase B (After potential status change)
                this.syncParticipantToSupabaseB(client);
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

                // Real-time sync to Supabase B


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
                const qLimit = parseInt(this.questionLimit);
                const totalQuestions = isNaN(qLimit) ? this.state.questions.length : qLimit;
                if (player.answeredQuestions >= totalQuestions && !player.isFinished) {
                    player.isFinished = true;
                    player.finishTime = Date.now();
                    
                    const playerPayload = {
                        rank: -1,
                        sessionId: player.sessionId,
                        userId: player.userId,
                        name: player.name,
                        hairId: player.hairId || 0,
                        score: player.score,
                        finishTime: player.finishTime,
                        duration: player.finishTime > 0 ? (player.finishTime - this.state.gameStartTime) : 0,
                        correctAnswers: player.correctAnswers,
                        wrongAnswers: player.wrongAnswers,
                        currentQuestion: player.answeredQuestions,
                        answers: this.playerAnswers ? (this.playerAnswers.get(player.sessionId) || []) : []
                    };
                    client.send("playerFinished", playerPayload);
                    this.checkGameEnd();
                }

                // Real-time sync to Supabase B
                this.syncParticipantToSupabaseB(client);
            }
        });


        // Redundant score handler removed (Moved to correctAnswer for authority)

        this.onMessage("addScoreFromChest", (client, data) => {
            const player = this.state.players.get(client.sessionId);
            if (player) {
                // Chest gives a small bonus (e.g., 5 points fixed or 25% of a question)
                const qLimit = parseInt(this.questionLimit);
                const totalQuestions = isNaN(qLimit) ? (this.state.questions.length || 1) : qLimit;
                const pointsPerCorrect = 100 / (totalQuestions || 1);
                const chestPoints = pointsPerCorrect * 0.5; // Bonus set at half a question value

                player.score = Math.min(100, player.score + chestPoints);

                // Real-time sync to Supabase B
                this.syncParticipantToSupabaseB(client);
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
            // Hanya host (berdasarkan state.hostId) yang bisa kick
            if (client.sessionId !== this.state.hostId) return;

            const targetSessionId = payload.sessionId;
            const targetClient = this.clients.find(c => c.sessionId === targetSessionId);

            if (targetClient) {
                console.log(`[GameRoom] Host kicked player ${targetSessionId}`);
                targetClient.send("kicked", { message: "You have been kicked by the host." });

                // Tandai client sebagai kicked agar onLeave tidak menunggu reconnect
                (targetClient as any).kicked = true;

                targetClient.leave(); // Force leave
            } else {
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
                        if (idx > -1) currentRoom.playerIds.splice(idx, 1);
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
            } else {
                console.log(`[GameRoom] Non-host ${client.sessionId} attempted to end game. Ignored.`);
            }
        });
    }

    update(deltaTime: number) {
        if (!this.state.isGameStarted) return;

        // Ambil config berdasarkan tingkat kesulitan
        const config = ROOM_CONFIG[this.state.difficulty as keyof typeof ROOM_CONFIG] || ROOM_CONFIG.mudah;
        const ENEMY_SPEED = config.enemySpeed; 
        const FLEE_RADIUS = config.fleeRadius; // Jarak untuk memicu melarikan diri
        const REST_DURATION_MIN = config.restDurationMin; 
        const REST_DURATION_MAX = config.restDurationMax;
        const ARRIVAL_THRESHOLD = 20; // px - dianggap "sampai" di titik tujuan

        const now = Date.now();

        // Process each enemy
        this.state.enemies.forEach(enemy => {
            if (!enemy.isAlive || enemy.isBusy) return;

            const owner = this.state.players.get(enemy.ownerId);
            if (!owner) return;

            // Rest logic (If active, still don't move)
            if (enemy.restUntil > 0 && now < enemy.restUntil) {
                enemy.isFleeing = false;
                return;
            } else {
                enemy.restUntil = 0;
            }

            // 1. Calculate Distances
            const dx = enemy.x - owner.x;
            const dy = enemy.y - owner.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // 2. Intent-Based Check (If player is moving towards enemy)
            let distToTarget = Infinity;
            if (owner.targetX > 0 && owner.targetY > 0) {
                const tdx = enemy.x - owner.targetX;
                const tdy = enemy.y - owner.targetY;
                distToTarget = Math.sqrt(tdx * tdx + tdy * tdy);
            }

            // 3. Trigger Fleeing (Sensitivity)
            if (dist < FLEE_RADIUS || distToTarget < (FLEE_RADIUS * 0.7) || enemy.isFleeing) {
                enemy.isFleeing = true;
                enemy.restUntil = 0; // Cancel rest if being chased

                // --- PROFESSIONAL STEERING BEHAVIOR ---
                // Flee Vector (Away from player)
                let fleeX = dx / (dist || 1);
                let fleeY = dy / (dist || 1);

                // Separation Vector (Away from other enemies)
                let sepX = 0;
                let sepY = 0;
                let neighbors = 0;
                const MIN_DIST = config.minEnemyDist;

                this.state.enemies.forEach(other => {
                    if (other === enemy || !other.isAlive || other.ownerId !== enemy.ownerId) return;
                    const sdx = enemy.x - other.x;
                    const sdy = enemy.y - other.y;
                    const sdistSq = sdx * sdx + sdy * sdy;

                    if (sdistSq < MIN_DIST * MIN_DIST) {
                        const sd = Math.sqrt(sdistSq) || 1;
                        const weight = (MIN_DIST - sd) / MIN_DIST; // More weight if closer
                        sepX += (sdx / sd) * weight;
                        sepY += (sdy / sd) * weight;
                        neighbors++;
                    }
                });

                // Combine Forces
                const sepWeight = (this.state.difficulty === 'sulit') ? 2.5 : 1.8;
                let moveX = fleeX * 1.0 + (neighbors > 0 ? (sepX / neighbors) * sepWeight : 0);
                let moveY = fleeY * 1.0 + (neighbors > 0 ? (sepY / neighbors) * sepWeight : 0);

                // Normalize Direction
                const moveMag = Math.sqrt(moveX * moveX + moveY * moveY) || 1;
                moveX /= moveMag;
                moveY /= moveMag;

                // Move with Speed
                const step = ENEMY_SPEED * (deltaTime / 1000);
                enemy.x += moveX * step;
                enemy.y += moveY * step;

                // Boundary Constraints & Spawn Zone Constraints
                const mapWidth = this.cachedMapData ? this.cachedMapData.mapWidth : 2000;
                const mapHeight = this.cachedMapData ? this.cachedMapData.mapHeight : 1120;
                
                // Keep inside spawn zone if assigned
                const mapData = this.cachedMapData || MapParser.loadMapData(this.state.difficulty);
                if (enemy.spawnZoneIndex !== -1 && mapData?.enemySpawnZones?.[enemy.spawnZoneIndex]) {
                    const zone = mapData.enemySpawnZones[enemy.spawnZoneIndex];
                    enemy.x = Math.max(zone.x, Math.min(zone.x + zone.width, enemy.x));
                    enemy.y = Math.max(zone.y, Math.min(zone.y + zone.height, enemy.y));
                } else {
                    enemy.x = Math.max(50, Math.min(mapWidth - 50, enemy.x));
                    enemy.y = Math.max(50, Math.min(mapHeight - 50, enemy.y));
                }

                // Stop fleeing if safe
                if (dist > FLEE_RADIUS * 1.5) {
                    enemy.isFleeing = false;
                    enemy.restUntil = now + REST_DURATION_MIN + Math.random() * (REST_DURATION_MAX - REST_DURATION_MIN);
                }
            } else {
                enemy.isFleeing = false;
            }
        });
    }

    // Pick a waypoint that's away from the player AND other enemies
    private pickWaypointAwayFromPlayer(enemy: Enemy, player: Player): { x: number, y: number } {
        const config = ROOM_CONFIG[this.state.difficulty as keyof typeof ROOM_CONFIG] || ROOM_CONFIG.mudah;
        const numCandidates = config.waypointCandidates || 12;
        const minEnemyDist = config.minEnemyDist || 80;

        const candidates: { x: number, y: number, score: number }[] = [];

        // Load map data to get zone info
        const mapData = this.cachedMapData || MapParser.loadMapData(this.state.difficulty);
        let zone = { x: 50, y: 50, width: 1500, height: 1500 };

        if (enemy.spawnZoneIndex !== -1 && mapData && mapData.enemySpawnZones && mapData.enemySpawnZones[enemy.spawnZoneIndex]) {
            zone = mapData.enemySpawnZones[enemy.spawnZoneIndex];
        }

        // Generate candidate waypoints in the zone
        for (let i = 0; i < numCandidates; i++) {
            const wx = zone.x + Math.random() * (zone.width || 200);
            const wy = zone.y + Math.random() * (zone.height || 200);

            // Distance calculations
            const dx = wx - player.x;
            const dy = wy - player.y;
            const distFromPlayer = Math.sqrt(dx * dx + dy * dy);
            const distFromEnemy = Math.sqrt(Math.pow(wx - enemy.x, 2) + Math.pow(wy - enemy.y, 2));

            // Base score: Favor points far from player and relatively close to current pos for efficiency
            let score = distFromPlayer * 2.0 - distFromEnemy * 0.1;

            // Penalty 1: Stay away from other enemies (Avoid clumping/trapping)
            this.state.enemies.forEach(other => {
                if (other === enemy || !other.isAlive || other.ownerId !== enemy.ownerId) return;
                const d = Math.sqrt(Math.pow(wx - other.x, 2) + Math.pow(wy - other.y, 2));
                if (d < minEnemyDist * 1.2) {
                    score -= 1000 * (1 - d / (minEnemyDist * 1.2));
                }
            });

            // Penalty 2: Don't stay exactly where we are
            if (distFromEnemy < 40) score -= 2000;

            // Penalty 3: Prefer points that are "behind" the enemy relative to the player
            // (Vector dot product could be used, but let's keep it simple for now)

            candidates.push({ x: wx, y: wy, score: score });
        }

        // Sort by score (highest first)
        candidates.sort((a, b) => b.score - a.score);

        return { x: candidates[0].x, y: candidates[0].y };
    }

    onJoin(client: Client, options: any) {
        console.log(client.sessionId, "joined!");

        const isRejoiningHost = options.isHost === true;
        const isFirstPlayer = !this.state.hostId;

        if (isFirstPlayer || isRejoiningHost) {
            // Jika rejoining: update hostId ke session baru, hapus entry lama jika ada
            if (isRejoiningHost && this.state.hostId && this.state.hostId !== client.sessionId) {
                console.log(`[Host] Removing old host session (${this.state.hostId}), replacing with (${client.sessionId}).`);
                // Pastikan tidak ada sisa entry di players (safety)
                this.state.players.delete(this.state.hostId);
            }

            // Host hanya disimpan di state.hostId — TIDAK masuk ke state.players
            // Host adalah spectator murni, bukan player
            this.state.hostId = client.sessionId;

            console.log(`[Host] ${options.nickname || options.name || 'Host'} registered as spectator/host (${client.sessionId}).`);
            return;
        }

        // --- NON-HOST PLAYERS ONLY ---
        const player = new Player();
        player.sessionId = client.sessionId;
        player.userId = options.userId || "";
        player.name = options.name || "Player " + (this.state.players.size + 1);

        // Assign spawn position from Map Data
        const mapData = MapParser.loadMapData(this.state.difficulty);
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
                // If all unique spawns are taken (more players than spawn points),
                // randomly pick any spawn point so they spread evenly instead of piling up at index 0.
                console.warn("[Spawn] No empty spawn points left! Randomly picking an occupied spawn point.");
                spawnIndex = Math.floor(Math.random() * mapData.playerSpawns.length);
            }

            this.usedSpawnIndices.add(spawnIndex);
            const spawn = mapData.playerSpawns[spawnIndex];
            player.x = spawn.x;
            player.y = spawn.y;
            player.spawnIndex = spawnIndex;
            console.log(`[Spawn] Player ${player.name} assigned spawn point ${spawnIndex} at (${spawn.x}, ${spawn.y}).`);
        } else {
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

    async onLeave(client: Client, consented: boolean) {
        console.log(client.sessionId, "left! consented:", consented);

        const isHostLeave = this.state.hostId === client.sessionId;
        const player = this.state.players.get(client.sessionId);

        // Cek jika di-kick secara paksa
        const isKicked = (client as any).kicked === true;
        // manualLeave = true hanya jika host eksplisit klik tombol EXIT
        const isManualLeave = (client as any).manualLeave === true;

        if (isHostLeave) {
            if (isManualLeave) {
                console.log(`[GameRoom] Host clicked EXIT. Disposing room.`);
                this.reallyReallyDisconnect = true;
                this.disconnect();
                return;
            } else {
                // Host disconnect tak terduga (refresh browser, koneksi putus, dll).
                // Tidak perlu menunggu — client akan langsung joinById kembali.
                // onJoin() sudah handle host rejoin via isHost:true.
                console.log(`[Host] ${client.sessionId} disconnected. Waiting for rejoin via joinById...`);
                return;
            }
        }

        // --- NON-HOST PLAYERS ONLY ---
        // Beri window reconnect untuk player biasa (kecuali jika di-kick)
        if (!isKicked) {
            console.log(`[GameRoom] Player ${client.sessionId} disconnected. Allowing 10s reconnection...`);
            try {
                await this.allowReconnection(client, 10);
                console.log(`[GameRoom] Player ${client.sessionId} reconnected!`);
                return;
            } catch (e) {
                console.log(`[GameRoom] Player ${client.sessionId} reconnection timed out.`);
                // Continue to cleanup
            }
        }

        // Hapus player dari state (timeout atau di-kick)
        // Host tidak ada di state.players, jadi hanya delete untuk non-host
        if (player) {
            if (player.spawnIndex !== -1) {
                this.usedSpawnIndices.delete(player.spawnIndex);
                console.log(`[Spawn] Freed spawn point ${player.spawnIndex} for player ${player.name}`);
            }
            const subRoom = this.state.subRooms.find(r => r.id === player.subRoomId);
            if (subRoom) {
                const idx = subRoom.playerIds.indexOf(client.sessionId);
                if (idx > -1) subRoom.playerIds.splice(idx, 1);
            }
        }
        this.state.players.delete(client.sessionId);

        if (this.state.isGameStarted && !this.state.isGameOver) {
            this.checkGameEnd();
        }
    }

    onDispose() {
        console.log("room", this.roomId, "disposing...");
    }

    generateRoomCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    initializeGameElements() {
        if (!this.state.difficulty || !ROOM_CONFIG[this.state.difficulty as keyof typeof ROOM_CONFIG]) {
            console.warn(`[GameRoom] Invalid difficulty: ${this.state.difficulty}. Defaulting to 'mudah'.`);
            this.state.difficulty = 'mudah';
        }

        const config = ROOM_CONFIG[this.state.difficulty as keyof typeof ROOM_CONFIG];

        // Dynamically calculate enemies per player based on actual question count
        // 1 enemy per question to prevent overcrowding
        const actualQuestionCount = this.state.questions.length > 0 ? this.state.questions.length : config.targetQuestions;
        const enemiesPerPlayer = actualQuestionCount;

        this.cachedMapData = MapParser.loadMapData(this.state.difficulty);
        const mapData = this.cachedMapData;

        // Minimum distance between enemies to prevent overlap (in pixels)
        const MIN_ENEMY_DISTANCE = 96; // Increased from 48px to 96px
        const MAX_SPAWN_ATTEMPTS = 100; // Max attempts to find valid position

        // Helper function to check distance from existing enemies and players
        const isValidSpawnPosition = (x: number, y: number, minDist: number = 96): boolean => {
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

        // 1:1 ratio: Exact matching or fallback to array length/5
        const qLimit = parseInt(this.questionLimit);
        const enemiesPerPlayerToSpawn = !isNaN(qLimit) ? qLimit : (this.state.questions.length || 5);

        console.log(`[GameRoom] Spawning ${enemiesPerPlayerToSpawn} enemies per player (1:1 with questions)`);

        this.state.players.forEach(player => {

            // SAFETY: Ensure questions exist
            if (this.state.questions.length === 0) {
                console.warn("[GameRoom] No questions found! Adding a fallback question.");
                const fallbackQ = new Question();
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
            let questionIndices: number[] = [];
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

            for (let i = 0; i < enemiesPerPlayerToSpawn; i++) {
                const enemy = new Enemy();
                enemy.ownerId = player.sessionId;

                // Assign Question Index from shuffled order (Cyclic)
                if (questionIndices.length > 0) {
                    const orderIndex = i % questionIndices.length;
                    enemy.questionId = questionIndices[orderIndex];
                } else {
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
                        } else {
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
                    if (foundPosition) break;
                }

                if (foundPosition) {
                    this.state.enemies.push(enemy);
                    enemiesSpawnedForPlayer++;
                } else {
                    console.warn(`[Spawn] Could not find valid position for enemy belonging to ${player.name} even with relaxed rules.`);
                }
            }
        });

        // Create Chests from Map Data
        console.log("[Debug] mapData.chests:", mapData?.chests);
        if (mapData && mapData.chests.length > 0) {
            mapData.chests.forEach((c: any) => {
                const chest = new Chest();
                chest.x = c.x;
                chest.y = c.y;
                this.state.chests.push(chest);
                console.log(`[Debug] Created chest at (${c.x}, ${c.y})`);
            });
        }
        console.log(`[Debug] Total chests created: ${this.state.chests.length}`);
    }

    // --- Game Timer & End Logic ---
    private gameTimerInterval: NodeJS.Timeout | null = null;
    private GAME_DURATION_MS = 5 * 60 * 1000; // 5 minutes

    startGameTimer() {
        // Use configurable duration (minutes -> ms)
        const durationMs = (this.totalTimeMinutes || 5) * 60 * 1000;
        const endTime = Date.now() + durationMs;

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
        // state.players hanya berisi player biasa (host tidak ada di sini)
        let allFinished = true;
        let finishedCount = 0;
        const totalPlayers = this.state.players.size;

        this.state.players.forEach(player => {
            if (player.isFinished) {
                finishedCount++;
            } else {
                allFinished = false;
            }
        });

        console.log(`[CheckGameEnd] Total players: ${totalPlayers}, Finished: ${finishedCount}, AllFinished: ${allFinished}`);

        if (allFinished && totalPlayers > 0) {
            console.log("[CheckGameEnd] All players finished! Ending game...");
            this.endGame();
        }
    }

    endGame() {
        if (this.state.isGameOver) return; // Prevent double-end
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
        // state.players hanya berisi player biasa, tidak perlu filter isHost
        const rankings = Array.from(this.state.players.values())
            .sort((a, b) => {
                if (b.score !== a.score) {
                    return b.score - a.score; // Higher score first
                }
                return a.finishTime - b.finishTime; // Earlier finish time first
            })
            .map((player, index) => ({
                rank: index + 1,
                sessionId: player.sessionId,
                userId: player.userId,
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

        // --- SAVE TO SUPABASE UTAMA ---
        this.saveSessionToMainSupabase(rankings);

        // --- UPDATE STATUS IN SUPABASE B ---
        this.updateSessionToFinishedInSupabaseB();
    }

    private async saveSessionToMainSupabase(rankings: any[]) {
        try {
            console.log("[Supabase Utama] Starting data transfer for session: ", this.sessionId);

            // Construct 'participants' Array of JSON matching the target schema
            const participantsDataArray = rankings.map((r) => {
                return {
                    id: r.userId || r.sessionId,
                    user_id: r.userId || r.sessionId, // Actually use the correct Supabase Auth ID
                    nickname: r.name,
                    score: Math.round(r.score),
                    correct: r.correctAnswers,
                    accuracy: r.correctAnswers + r.wrongAnswers > 0
                        ? ((r.correctAnswers / (r.correctAnswers + r.wrongAnswers)) * 100).toFixed(2)
                        : "0.00",
                    started: new Date(this.state.gameStartTime).toISOString(),
                    ended: r.finishTime > 0 ? new Date(r.finishTime).toISOString() : new Date().toISOString(),
                    eliminated: false,
                    spacecraft: r.hairId ? `hair_${r.hairId}.png` : "galaksi1.webp", // Mocking spacecraft visual 
                    total_question: !isNaN(parseInt(this.questionLimit)) ? parseInt(this.questionLimit) : this.state.questions.length,
                    current_question: r.currentQuestion
                }
            });

            // Construct 'responses' Array of JSON
            const responsesDataArray = rankings.map((r) => {
                return {
                    id: (r.userId || r.sessionId) + "_resp",
                    participant: r.userId || r.sessionId,
                    answers: r.answers || [] // from playerAnswers
                }
            });

            // Reconstruct 'current_questions' JSON
            const questionsDataArray = this.state.questions.map((q) => {
                return {
                    id: q.id.toString(),
                    type: q.answerType || "multiple_choice",
                    image: q.imageUrl || null,
                    answers: q.options.map((opt, idx) => ({
                        id: idx.toString(),
                        image: null,
                        answer: opt
                    })),
                    correct: q.correctAnswer.toString(),
                    question: q.text
                }
            });

            const finalSessionData = {
                id: this.sessionId, // Maintain same ID to avoid duplicates if possible, assuming Supabase Utama allows setting ID
                quiz_id: this.originalQuizId,
                host_id: this.originalHostId,
                game_pin: this.gamePin,
                status: "finished",
                total_time_minutes: this.totalTimeMinutes,
                question_limit: this.questionLimit,
                game_end_mode: "manual",
                allow_join_after_start: false,
                participants: participantsDataArray,
                responses: responsesDataArray,
                current_questions: questionsDataArray,
                created_at: new Date(this.state.gameStartTime - 1000).toISOString(),
                started_at: new Date(this.state.gameStartTime).toISOString(),
                ended_at: new Date().toISOString(),
                application: "zigma",
                quiz_detail: this.quizDetail,
                difficulty: this.originalDifficulty
            };

            const { data, error } = await supabaseUtama
                .from('game_sessions')
                .upsert(finalSessionData, { onConflict: 'id' });

            if (error) {
                console.error("[Supabase Utama] Gagal menyimpan ke Supabase Utama:", JSON.stringify(error));
            } else {
                console.log("[Supabase Utama] Berhasil merekam history di Supabase Utama!");
            }

        } catch (e: any) {
            console.error("[Supabase Utama] Exception on save:", e.message || e);
        }
    }

    private async saveInitialSessionToMainSupabase() {
        try {
            console.log("[Supabase Utama] Recording Initial Session (MASUK DATA):", this.sessionId);

            if (this.originalHostId === "no_host_id" || this.originalQuizId === "no_quiz_id") {
                console.warn("[Supabase Utama] Skipping initial sync: Invalid host_id or quiz_id provided in options.");
                return;
            }

            // Reconstruct 'current_questions' JSON
            const questionsDataArray = this.state.questions.map((q: any) => {
                return {
                    id: q.id.toString(),
                    type: q.answerType || "multiple_choice",
                    image: q.imageUrl || null,
                    answers: q.options.map((opt: any, idx: number) => ({
                        id: idx.toString(),
                        image: null,
                        answer: opt
                    })),
                    correct: q.correctAnswer.toString(),
                    question: q.text
                }
            });

            const initialData = {
                id: this.sessionId,
                quiz_id: this.originalQuizId,
                host_id: this.originalHostId,
                game_pin: this.gamePin,
                status: "waiting", // Awal masuk statusnya waiting
                total_time_minutes: this.totalTimeMinutes,
                question_limit: this.questionLimit,
                game_end_mode: "manual",
                allow_join_after_start: false,
                participants: [], // Belum ada peserta saat room baru dibuat
                responses: [],
                current_questions: questionsDataArray,
                created_at: new Date().toISOString(),
                application: "zigma",
                quiz_detail: this.quizDetail,
                difficulty: this.originalDifficulty
            };

            const { error } = await supabaseUtama
                .from('game_sessions')
                .upsert(initialData, { onConflict: 'id' });

            if (error) {
                console.error("[Supabase Utama] GAGAL MENCATAT DATA AWAL!");
                console.error("[Supabase Utama] Error Code:", error.code);
                console.error("[Supabase Utama] Error Message:", error.message);
                console.error("[Supabase Utama] Error Details:", error.details);
                console.error("[Supabase Utama] Payload used:", JSON.stringify(initialData, null, 2));
            } else {
                console.log("[Supabase Utama] Data 'MASUK' (Waiting) berhasil dicatat untuk Session ID:", this.sessionId);
            }
        } catch (e: any) {
            console.error("[Supabase Utama] Exception on initial save:", e.message);
        }
    }

    private async syncSessionToSupabaseB() {
        if (!this.sessionId) return;
        try {
            console.log("[Supabase B] Syncing Session Data:", this.sessionId);

            const sessionData = {
                id: this.sessionId,
                quiz_id: this.originalQuizId,
                host_id: this.originalHostId,
                game_pin: this.gamePin,
                total_time_minutes: this.totalTimeMinutes,
                question_limit: this.questionLimit,
                status: "waiting",
                created_at: new Date().toISOString()
            };

            const { error } = await supabaseB
                .from('sessions')
                .upsert(sessionData, { onConflict: 'id' });

            if (error) {
                console.error("[Supabase B] GAGAL SYNC SESSI KE B:", error.message);
            } else {
                console.log("[Supabase B] Sesi berhasil sinkron ke database realtime.");
            }
        } catch (e: any) {
            console.error("[Supabase B] Exception on syncSessionToSupabaseB:", e.message);
        }
    }

    private async syncParticipantToSupabaseB(client: Client) {
        const player = this.state.players.get(client.sessionId);
        console.log(`[Supabase B] syncParticipantToSupabaseB called for client: ${client.sessionId}. Player exists: ${!!player}. Session ID: ${this.sessionId}`);

        if (!player) {
            console.log(`[Supabase B] Missing player object for client: ${client.sessionId}`);
            return;
        }
        if (!player.userId) {
            console.log(`[Supabase B] Missing player.userId for client: ${client.sessionId} (Player Name: ${player.name})`);
            return;
        }
        if (!this.sessionId) {
            console.log(`[Supabase B] Missing this.sessionId in room`);
            return;
        }

        try {
            const answers = this.playerAnswers.get(client.sessionId) || [];
            console.log(`[Supabase B] Updating stats for ${player.userId} in session ${this.sessionId}. Answers so far:`, answers.length);

            const updateData = {
                current_question: player.answeredQuestions,
                correct: player.correctAnswers,
                score: Math.round(player.score),
                answers: answers,
                completion: player.isFinished,
                finished_at: player.isFinished ? new Date(player.finishTime).toISOString() : null,
                duration: player.isFinished ? Math.round((player.finishTime - this.state.gameStartTime) / 1000) : 0
            };

            const { data, error } = await supabaseB
                .from('participants')
                .update(updateData)
                .eq('session_id', this.sessionId)
                .eq('user_id', player.userId)
                .select();

            if (error) {
                console.error(`[Supabase B] Sync failed for ${player.name}:`, error.message, error);
            } else {
                console.log(`[Supabase B] Sync Success for ${player.name}. Affected rows:`, data?.length);
            }
        } catch (e: any) {
            console.error(`[Supabase B] Sync Exception for ${player.name}:`, e.message);
        }
    }

    private async syncAllParticipantsStartedAt() {
        if (!this.sessionId) return;

        try {
            const startTimeString = new Date(this.state.gameStartTime).toISOString();

            const { error } = await supabaseB
                .from('participants')
                .update({ started_at: startTimeString })
                .eq('session_id', this.sessionId);

            if (error) {
                console.error("[Supabase B] Failed to sync started_at for all participants:", error.message);
            } else {
                console.log("[Supabase B] All participants started_at synced successfully.");
            }
        } catch (e: any) {
            console.error("[Supabase B] Exception syncing started_at:", e.message);
        }
    }

    private async updateSessionToFinishedInSupabaseB() {
        if (!this.sessionId) return;
        try {
            console.log("[Supabase B] Updating Session Status to FINISHED:", this.sessionId);

            const { error } = await supabaseB
                .from('sessions')
                .update({ status: "finished" })
                .eq('id', this.sessionId);

            if (error) {
                console.error("[Supabase B] GAGAL UPDATE STATUS KE FINISHED:", error.message);
            } else {
                console.log("[Supabase B] Status 'FINISHED' Berhasil Diperbarui.");
            }
        } catch (e: any) {
            console.error("[Supabase B] Exception on updateSessionToFinishedInSupabaseB:", e.message);
        }
    }

    private async updateSessionToActive() {
        try {
            console.log("[Supabase Utama] Updating Session Status to ACTIVE:", this.sessionId);

            const { error } = await supabaseUtama
                .from('game_sessions')
                .update({
                    status: "active",
                    started_at: new Date(this.state.gameStartTime).toISOString()
                })
                .eq('id', this.sessionId);

            if (error) {
                console.error("[Supabase Utama] GAGAL UPDATE STATUS KE ACTIVE!");
                console.error("[Supabase Utama] Error:", error.message);
            } else {
                console.log("[Supabase Utama] Status 'ACTIVE' Berhasil Diperbarui.");
            }
        } catch (e: any) {
            console.error("[Supabase Utama] Exception on updateSessionToActive:", e.message);
        }
    }
}


//ikan