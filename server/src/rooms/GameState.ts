import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";

export class Enemy extends Schema {
    @type("number") x!: number;
    @type("number") y!: number;
    @type("string") ownerId!: string;
    @type("number") questionId!: number;
    @type("string") type!: string; // 'skeleton' | 'goblin'
    @type("boolean") isAlive: boolean = true;
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
    @type("number") score: number = 0;
    @type("number") correctAnswers: number = 0;
    @type("number") wrongAnswers: number = 0;
    @type("boolean") hasUsedChest: boolean = false;
    @type("boolean") hasWrongAnswer: boolean = false;
    @type("number") lastWrongQuestionId: number = 0;
    @type("string") sessionId!: string;
}

export class GameState extends Schema {
    @type({ map: Player }) players = new MapSchema<Player>();
    @type([Enemy]) enemies = new ArraySchema<Enemy>();
    @type([Chest]) chests = new ArraySchema<Chest>();
    @type("string") difficulty!: string;
    @type("string") subject!: string;
    @type("number") gameStartTime: number = 0;
    @type("boolean") isGameStarted: boolean = false;
    @type("boolean") isGameOver: boolean = false;
    @type("string") roomCode!: string;
}
