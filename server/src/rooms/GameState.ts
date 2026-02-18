import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";

export class Enemy extends Schema {
    @type("number") x!: number;
    @type("number") y!: number;
    @type("string") ownerId!: string;
    @type("number") questionId!: number;
    @type("string") type!: string; // 'skeleton' | 'goblin'
    @type("boolean") isAlive: boolean = true;
    @type("boolean") isFleeing: boolean = false;

    // Waypoint flee system
    @type("number") targetX: number = 0;  // Waypoint destination X
    @type("number") targetY: number = 0;  // Waypoint destination Y
    @type("number") restUntil: number = 0; // Timestamp when rest ends (0 = not resting)
    @type("number") spawnZoneIndex: number = -1; // Index of the spawn zone this enemy belongs to
    @type("boolean") isBusy: boolean = false; // True if engaged in a quiz
}

export class Question extends Schema {
    @type("number") id!: number;
    @type("string") text!: string;
    @type("string") imageUrl: string = ""; // URL for question image
    @type("string") answerType: string = "text"; // 'text' or 'image'
    @type(["string"]) options = new ArraySchema<string>();
    @type("number") correctAnswer!: number;
}

export class Chest extends Schema {
    @type("number") x!: number;
    @type("number") y!: number;
    @type("boolean") isCollected: boolean = false;
    @type("string") collectedBy: string = "";
}

export class Player extends Schema {
    @type("number") x!: number;
    @type("number") y!: number;
    @type("string") name!: string;
    @type("number") hairId: number = 0;
    @type("number") score: number = 0;
    @type("number") correctAnswers: number = 0;
    @type("number") wrongAnswers: number = 0;
    @type("number") answeredQuestions: number = 0; // Total questions answered
    @type("boolean") isFinished: boolean = false; // Player finished all questions
    @type("number") finishTime: number = 0; // Timestamp when player finished (for tie-breaker)
    @type("boolean") hasUsedChest: boolean = false;
    @type("boolean") hasWrongAnswer: boolean = false;
    @type("number") lastWrongQuestionId: number = 0;
    @type("string") sessionId!: string;
    @type("string") subRoomId!: string; // Track which sub-room the player is in
    @type("number") spawnIndex: number = -1; // Track assigned spawn point index
    @type("boolean") isHost: boolean = false;
    @type(["number"]) questionOrder = new ArraySchema<number>(); // Personalized randomized question order
}

export class SubRoom extends Schema {
    @type("string") id!: string; // "Room 1"
    @type("number") capacity!: number;
    @type(["string"]) playerIds = new ArraySchema<string>();
}

export class GameState extends Schema {
    @type({ map: Player }) players = new MapSchema<Player>();
    @type([Enemy]) enemies = new ArraySchema<Enemy>();
    @type([Chest]) chests = new ArraySchema<Chest>();
    @type([Question]) questions = new ArraySchema<Question>();
    // Chat removed, replaced by room logic if needed, or keep for future?
    // User asked to remove chat. Removing ChatMessage schema usage here if desired, 
    // but better to just leave it unused or remove if strict.
    // Let's remove 'messages' as per request.
    @type([SubRoom]) subRooms = new ArraySchema<SubRoom>();
    @type("string") difficulty!: string;
    @type("string") subject!: string;
    @type("number") gameStartTime: number = 0;
    @type("boolean") isGameStarted: boolean = false;
    @type("boolean") isGameOver: boolean = false;
    @type("string") roomCode!: string;
    @type("string") hostId!: string; // Track who is the host
    @type("number") countdown: number = 0; // Countdown timer (0 = not running)
}
