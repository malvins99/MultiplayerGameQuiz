import { Room, Client } from "colyseus";
import { GameState, Player, Enemy, Chest, SubRoom } from "./GameState";
import { QUESTIONS } from "../dummyQuestions";
import { MapParser } from "../utils/MapParser";

const ROOM_CONFIG = {
    mudah: { maxPlayers: 4, targetQuestions: 5, enemiesPerPlayer: 10 },
    sedang: { maxPlayers: 5, targetQuestions: 10, enemiesPerPlayer: 20 },
    sulit: { maxPlayers: 6, targetQuestions: 20, enemiesPerPlayer: 40 }
};

const LOBBY_MAX_PLAYERS = 20;

export class GameRoom extends Room<GameState> {
    // Track which spawn points have been used
    private usedSpawnIndices: Set<number> = new Set();

    onCreate(options: any) {
        this.setState(new GameState());

        this.state.difficulty = options.difficulty || "mudah";
        this.state.subject = options.subject || "matematika";
        this.state.roomCode = this.generateRoomCode();

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
            }
        });

        this.onMessage("startGame", (client) => {
            if (this.state.isGameStarted) return;
            this.state.isGameStarted = true;
            this.state.gameStartTime = Date.now();

            this.initializeGameElements();
            this.startGameTimer(); // Start 5-minute countdown
            this.broadcast("gameStarted");
        });

        this.onMessage("hostEndGame", (client) => {
            if (client.sessionId === this.state.hostId) {
                console.log("[Host] Ending game for all rooms...");
                this.endGame();
            }
        });

        this.onMessage("correctAnswer", (client, data) => {
            const player = this.state.players.get(client.sessionId);
            if (player && !player.isFinished) {
                player.correctAnswers++;
                player.answeredQuestions++;

                // Target SPECIFIC enemy by index to avoid sync issues
                const enemyIndex = data.enemyIndex;
                if (enemyIndex !== undefined) {
                    const enemy = this.state.enemies[enemyIndex];
                    // Validate ownership and liveness
                    if (enemy && enemy.ownerId === client.sessionId && enemy.isAlive) {
                        enemy.isAlive = false;
                    }
                }

                // Check if player finished all required questions
                const config = ROOM_CONFIG[this.state.difficulty as keyof typeof ROOM_CONFIG];
                if (player.answeredQuestions >= config.targetQuestions && !player.isFinished) {
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

                // Check if player finished all required questions (even with wrong answers)
                const config = ROOM_CONFIG[this.state.difficulty as keyof typeof ROOM_CONFIG];
                if (player.answeredQuestions >= config.targetQuestions && !player.isFinished) {
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
                // Calculate points based on difficulty (max 100 total)
                // mudah: 5 questions = 20 pts each
                const config = ROOM_CONFIG[this.state.difficulty as keyof typeof ROOM_CONFIG];
                const pointsPerCorrect = Math.floor(100 / config.targetQuestions); // 20 pts

                player.score = Math.min(100, player.score + pointsPerCorrect);
            }
        });

        this.onMessage("addScoreFromChest", (client, data) => {
            const player = this.state.players.get(client.sessionId);
            if (player) {
                // Chest gives half points of a normal question
                const config = ROOM_CONFIG[this.state.difficulty as keyof typeof ROOM_CONFIG];
                const pointsPerCorrect = Math.floor(100 / config.targetQuestions);
                const chestPoints = Math.floor(pointsPerCorrect / 2); // 10 pts for easy

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

        // --- Switch Room Handler ---
        this.onMessage("switchRoom", (client, data) => {
            const roomId = data.roomId;
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
    }

    update(deltaTime: number) {
        if (!this.state.isGameStarted) return;

        const ENEMY_SPEED = 110; // px/sec
        const FLEE_RADIUS = 180; // Distance to trigger flee
        const REST_DURATION_MIN = 2000; // 2 seconds
        const REST_DURATION_MAX = 3000; // 3 seconds
        const ARRIVAL_THRESHOLD = 20; // px - considered "arrived" at waypoint

        const now = Date.now();

        // Process each enemy
        this.state.enemies.forEach(enemy => {
            if (!enemy.isAlive) return;

            // If busy (in quiz), DO NOT MOVE
            if (enemy.isBusy) return;

            const owner = this.state.players.get(enemy.ownerId);
            if (!owner) return;

            // Check if resting
            if (enemy.restUntil > 0) {
                if (now < enemy.restUntil) {
                    // Still resting
                    enemy.isFleeing = false;
                    return;
                } else {
                    // Rest period over
                    enemy.restUntil = 0;
                }
            }

            // Calculate distance to owner
            const dx = enemy.x - owner.x;
            const dy = enemy.y - owner.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < FLEE_RADIUS) {
                // Need to flee!
                enemy.isFleeing = true;

                // If no target waypoint set, pick one
                if (enemy.targetX === 0 && enemy.targetY === 0) {
                    const waypoint = this.pickWaypointAwayFromPlayer(enemy, owner);
                    enemy.targetX = waypoint.x;
                    enemy.targetY = waypoint.y;
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
                } else {
                    // Move toward target
                    const vx = toTargetX / distToTarget;
                    const vy = toTargetY / distToTarget;
                    const moveDist = (ENEMY_SPEED * deltaTime) / 1000;

                    let nextX = enemy.x + vx * moveDist;
                    let nextY = enemy.y + vy * moveDist;

                    // Boundary check
                    if (nextX < 50) nextX = 50;
                    if (nextX > 1550) nextX = 1550;
                    if (nextY < 50) nextY = 50;
                    if (nextY > 1550) nextY = 1550;

                    enemy.x = nextX;
                    enemy.y = nextY;
                }
            } else {
                // Player far away - idle
                enemy.isFleeing = false;
                enemy.targetX = 0;
                enemy.targetY = 0;
            }
        });
    }

    // Pick a waypoint that's away from the player
    private pickWaypointAwayFromPlayer(enemy: Enemy, player: Player): { x: number, y: number } {
        // Generate waypoints from enemy's spawn zone (simple random in bounds)
        const candidates: { x: number, y: number, dist: number }[] = [];

        // Load map data to get zone info
        const mapData = MapParser.loadMapData(this.state.difficulty);
        let zone = { x: 50, y: 50, width: 1500, height: 1500 }; // Default global bounds

        // If enemy has a valid spawn zone index, use that zone
        if (enemy.spawnZoneIndex !== -1 && mapData && mapData.enemySpawnZones && mapData.enemySpawnZones[enemy.spawnZoneIndex]) {
            zone = mapData.enemySpawnZones[enemy.spawnZoneIndex];
        }

        // Generate 5 random candidate waypoints in the zone
        for (let i = 0; i < 5; i++) {
            // Generate point directly in zone
            const wx = zone.x + Math.random() * (zone.width || 200);
            const wy = zone.y + Math.random() * (zone.height || 200);

            // Calculate distance from player (prefer farther)
            const distFromPlayer = Math.sqrt(
                Math.pow(wx - player.x, 2) +
                Math.pow(wy - player.y, 2)
            );

            candidates.push({ x: wx, y: wy, dist: distFromPlayer });
        }

        // Sort by distance from player (farthest first)
        candidates.sort((a, b) => b.dist - a.dist);

        // Return farthest waypoint
        return { x: candidates[0].x, y: candidates[0].y };
    }

    onJoin(client: Client, options: any) {
        console.log(client.sessionId, "joined!");
        const player = new Player();
        player.sessionId = client.sessionId;
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
            // But for safety, if we genuinely can't find a spot, we might just pick a random one 
            // or circle back, but WITHOUT clearing the set (which causes the bug).
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
        } else {
            console.error("[Spawn] No spawn points found in map data! Using fallback 400,300.");
            player.x = 400;
            player.y = 300;
        }

        this.state.players.set(client.sessionId, player);

        // First player to join is the host — BEFORE sub-room assignment
        if (!this.state.hostId || this.state.players.size === 1) {
            this.state.hostId = client.sessionId;
            player.isHost = true;
            player.subRoomId = ""; // Host doesn't join any sub-room
            console.log(`[Host] ${player.name} is the host. Skipping sub-room assignment.`);
            return;
        }

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

    onLeave(client: Client, consented: boolean) {
        console.log(client.sessionId, "left!");
        const player = this.state.players.get(client.sessionId);
        if (player) {
            // Free up spawn index for reuse
            if (player.spawnIndex !== -1) {
                this.usedSpawnIndices.delete(player.spawnIndex);
                console.log(`[Spawn] Freed spawn point ${player.spawnIndex} for player ${player.name}`);
            }

            // Remove from sub-room
            const subRoom = this.state.subRooms.find(r => r.id === player.subRoomId);
            if (subRoom) {
                const idx = subRoom.playerIds.indexOf(client.sessionId);
                if (idx > -1) subRoom.playerIds.splice(idx, 1);
            }
        }
        this.state.players.delete(client.sessionId);
    }

    onDispose() {
        console.log("room", this.roomId, "disposing...");
    }

    generateRoomCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    initializeGameElements() {
        const config = ROOM_CONFIG[this.state.difficulty as keyof typeof ROOM_CONFIG];
        const mapData = MapParser.loadMapData(this.state.difficulty);

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

        // Create Enemies Per Player
        this.state.players.forEach(player => {
            // Host gets NO enemies
            if (player.isHost) return;

            // Use decaying radius logic for enemy placement
            // Consolidate enemy creation to try strict distance first -> then relax if needed
            let enemiesSpawnedForPlayer = 0;

            // We want 'config.enemiesPerPlayer' enemies
            for (let i = 0; i < config.enemiesPerPlayer; i++) {
                const enemy = new Enemy();
                enemy.ownerId = player.sessionId;
                enemy.questionId = Math.floor(Math.random() * 10) + 1;
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
        this.state.players.forEach(player => {
            if (!player.isHost && !player.isFinished) {
                allFinished = false;
            }
        });

        if (allFinished && this.state.players.size > 0) {
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
                wrongAnswers: player.wrongAnswers
            }));

        this.broadcast("gameEnded", { rankings });
    }
}
