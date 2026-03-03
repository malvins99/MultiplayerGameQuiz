import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";

export class Enemy extends Schema {
    @type("number") x: number = 0;
    @type("number") y: number = 0;
    @type("string") ownerId: string = "";
    @type("number") questionId: number = 0;
    @type("string") type: string = "skeleton";
    @type("boolean") isAlive: boolean = true;
    @type("boolean") isFleeing: boolean = false;

    // Waypoint flee system
    @type("number") targetX: number = 0;
    @type("number") targetY: number = 0;
    @type("number") restUntil: number = 0;
    @type("number") spawnZoneIndex: number = -1;
    @type("boolean") isBusy: boolean = false;
    @type("number") lastRecalc: number = 0;
}

export class Question extends Schema {
    @type("number") id: number = 0;
    @type("string") text: string = "";
    @type("string") imageUrl: string = "";
    @type("string") answerType: string = "text";
    @type(["string"]) options = new ArraySchema<string>();
    @type("number") correctAnswer: number = 0;
}

export class Chest extends Schema {
    @type("number") x: number = 0;
    @type("number") y: number = 0;
    @type("boolean") isCollected: boolean = false;
    @type("string") collectedBy: string = "";
}

export class Player extends Schema {
    @type("number") x: number = 0;
    @type("number") y: number = 0;
    @type("number") targetX: number = 0;
    @type("number") targetY: number = 0;
    @type("string") name: string = "";
    @type("number") hairId: number = 0;
    @type("number") score: number = 0;
    @type("number") correctAnswers: number = 0;
    @type("number") wrongAnswers: number = 0;
    @type("number") answeredQuestions: number = 0;
    @type("boolean") isFinished: boolean = false;
    @type("number") finishTime: number = 0;
    @type("boolean") hasUsedChest: boolean = false;
    @type("boolean") hasWrongAnswer: boolean = false;
    @type("number") lastWrongQuestionId: number = 0;
    @type("string") userId: string = "";
    @type("string") sessionId: string = "";
    @type("string") subRoomId: string = "";
    @type("number") spawnIndex: number = -1;
    @type("boolean") isHost: boolean = false;
    @type(["number"]) questionOrder = new ArraySchema<number>();
}

export class SubRoom extends Schema {
    @type("string") id: string = "";
    @type("number") capacity: number = 0;
    @type(["string"]) playerIds = new ArraySchema<string>();
}

export class GameState extends Schema {
    @type({ map: Player }) players = new MapSchema<Player>();
    @type([Enemy]) enemies = new ArraySchema<Enemy>();
    @type([Chest]) chests = new ArraySchema<Chest>();
    @type([Question]) questions = new ArraySchema<Question>();
    @type([SubRoom]) subRooms = new ArraySchema<SubRoom>();
    @type("string") difficulty: string = "";
    @type("string") subject: string = "";
    @type("number") gameStartTime: number = 0;
    @type("boolean") isGameStarted: boolean = false;
    @type("boolean") isGameOver: boolean = false;
    @type("string") roomCode: string = "";
    @type("string") hostId: string = "";
    @type("number") countdown: number = 0;
    @type("number") totalTimeMinutes: number = 0;
    @type("string") questionLimit: string = "all";
}
