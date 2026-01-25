import { Room, Client } from "colyseus";
import { GameState, Player, Enemy, Chest } from "./GameState";
import { QUESTIONS } from "../dummyQuestions";
import { MapParser } from "../utils/MapParser";

const ROOM_CONFIG = {
    mudah: { maxPlayers: 4, targetQuestions: 5, enemiesPerPlayer: 10 },
    sedang: { maxPlayers: 5, targetQuestions: 10, enemiesPerPlayer: 20 },
    sulit: { maxPlayers: 6, targetQuestions: 20, enemiesPerPlayer: 40 }
};

export class GameRoom extends Room<GameState> {

    onCreate(options: any) {
        this.setState(new GameState());

        this.state.difficulty = options.difficulty || "mudah";
        this.state.subject = options.subject || "matematika";
        this.state.roomCode = this.generateRoomCode();

        // Set max clients based on difficulty
        const config = ROOM_CONFIG[this.state.difficulty as keyof typeof ROOM_CONFIG];
        if (config) {
            this.maxClients = config.maxPlayers;
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
            this.broadcast("gameStarted");
        });

        this.onMessage("wrongAnswer", (client, data) => {
            const player = this.state.players.get(client.sessionId);
            if (player) {
                player.hasWrongAnswer = true;
                player.lastWrongQuestionId = data.questionId;
                player.wrongAnswers++;
            }
        });

        this.onMessage("correctAnswer", (client, data) => {
            const player = this.state.players.get(client.sessionId);
            if (player) {
                player.correctAnswers++;
                // Target SPECIFIC enemy by index to avoid sync issues
                const enemyIndex = data.enemyIndex;
                if (enemyIndex !== undefined) {
                    const enemy = this.state.enemies[enemyIndex];
                    // Validate ownership and liveness
                    if (enemy && enemy.ownerId === client.sessionId && enemy.isAlive) {
                        enemy.isAlive = false;
                    }
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

        this.state.players.set(client.sessionId, player);
    }

    onLeave(client: Client, consented: boolean) {
        console.log(client.sessionId, "left!");
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
                    // Fallback
                    enemy.x = Math.random() * 800;
                    enemy.y = Math.random() * 600;
                }

                enemy.questionId = Math.floor(Math.random() * 5) + 1; // Dummy question ID

                // Assign Type: 60% Skeleton, 40% Goblin
                enemy.type = Math.random() < 0.6 ? "skeleton" : "goblin";

                this.state.enemies.push(enemy);
            }
        });

        // Create Chests from Map Data
        if (mapData && mapData.chests.length > 0) {
            mapData.chests.forEach((c: any) => {
                const chest = new Chest();
                chest.x = c.x;
                chest.y = c.y;
                this.state.chests.push(chest);
            });
        }
    }
}
