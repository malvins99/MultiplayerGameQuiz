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
    }

    onJoin(client: Client, options: any) {
        console.log(client.sessionId, "joined!");
        const player = new Player();
        player.sessionId = client.sessionId;
        player.name = options.name || "Player " + (this.state.players.size + 1);

        // Assign spawn position from Map Data
        const mapData = MapParser.loadMapData(this.state.difficulty);

        if (mapData && mapData.playerSpawns.length > 0) {
            // Round robin or random spawn selection
            // For now random is fine as multiple players can share spawn area
            const spawn = mapData.playerSpawns[Math.floor(Math.random() * mapData.playerSpawns.length)];
            player.x = spawn.x;
            player.y = spawn.y;
        } else {
            // Fallback
            player.x = 400;
            player.y = 300;
        }

        // Auto-assign to first available sub-room
        let assignedRoom = this.state.subRooms.find(r => r.playerIds.length < r.capacity);
        if (!assignedRoom) {
            // Should not happen if maxClients is correct, but fallback to first
            assignedRoom = this.state.subRooms[0];
        }

        if (assignedRoom) {
            player.subRoomId = assignedRoom.id;
            assignedRoom.playerIds.push(client.sessionId);
        }

        this.state.players.set(client.sessionId, player);

        // First player to join is the host
        if (!this.state.hostId || this.state.players.size === 1) {
            this.state.hostId = client.sessionId;
        }
    }

    onLeave(client: Client, consented: boolean) {
        console.log(client.sessionId, "left!");
        const player = this.state.players.get(client.sessionId);
        if (player) {
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

        // Create Enemies Per Player
        this.state.players.forEach(player => {
            for (let i = 0; i < config.enemiesPerPlayer; i++) {
                const enemy = new Enemy();
                enemy.ownerId = player.sessionId;

                if (mapData && mapData.enemySpawnZones.length > 0) {
                    const zone = mapData.enemySpawnZones[Math.floor(Math.random() * mapData.enemySpawnZones.length)];
                    // Random position within the spawn zone rectangle/bbox
                    enemy.x = zone.x + Math.random() * (zone.width || 0);
                    enemy.y = zone.y + Math.random() * (zone.height || 0);
                } else {
                    // Fallback: Use full map dimensions if available, otherwise default to 800x600
                    const maxX = mapData ? mapData.mapWidth : 800;
                    const maxY = mapData ? mapData.mapHeight : 600;

                    enemy.x = Math.random() * maxX;
                    enemy.y = Math.random() * maxY;
                }

                enemy.questionId = Math.floor(Math.random() * 5) + 1; // Dummy question ID

                // Assign Type: 60% Skeleton, 40% Goblin
                enemy.type = Math.random() < 0.6 ? "skeleton" : "goblin";

                this.state.enemies.push(enemy);
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
            if (!player.isFinished) {
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
                score: player.score,
                finishTime: player.finishTime,
                duration: player.finishTime > 0 ? (player.finishTime - this.state.gameStartTime) : 0, // Calculate duration
                correctAnswers: player.correctAnswers,
                wrongAnswers: player.wrongAnswers
            }));

        this.broadcast("gameEnded", { rankings });
    }
}
