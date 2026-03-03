"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameState = exports.SubRoom = exports.Player = exports.Chest = exports.Question = exports.Enemy = void 0;
const schema_1 = require("@colyseus/schema");
let Enemy = (() => {
    var _a;
    let _classSuper = schema_1.Schema;
    let _x_decorators;
    let _x_initializers = [];
    let _x_extraInitializers = [];
    let _y_decorators;
    let _y_initializers = [];
    let _y_extraInitializers = [];
    let _ownerId_decorators;
    let _ownerId_initializers = [];
    let _ownerId_extraInitializers = [];
    let _questionId_decorators;
    let _questionId_initializers = [];
    let _questionId_extraInitializers = [];
    let _type_decorators;
    let _type_initializers = [];
    let _type_extraInitializers = [];
    let _isAlive_decorators;
    let _isAlive_initializers = [];
    let _isAlive_extraInitializers = [];
    let _isFleeing_decorators;
    let _isFleeing_initializers = [];
    let _isFleeing_extraInitializers = [];
    let _targetX_decorators;
    let _targetX_initializers = [];
    let _targetX_extraInitializers = [];
    let _targetY_decorators;
    let _targetY_initializers = [];
    let _targetY_extraInitializers = [];
    let _restUntil_decorators;
    let _restUntil_initializers = [];
    let _restUntil_extraInitializers = [];
    let _spawnZoneIndex_decorators;
    let _spawnZoneIndex_initializers = [];
    let _spawnZoneIndex_extraInitializers = [];
    let _isBusy_decorators;
    let _isBusy_initializers = [];
    let _isBusy_extraInitializers = [];
    let _lastRecalc_decorators;
    let _lastRecalc_initializers = [];
    let _lastRecalc_extraInitializers = [];
    return _a = class Enemy extends _classSuper {
            constructor() {
                super(...arguments);
                this.x = __runInitializers(this, _x_initializers, void 0);
                this.y = (__runInitializers(this, _x_extraInitializers), __runInitializers(this, _y_initializers, void 0));
                this.ownerId = (__runInitializers(this, _y_extraInitializers), __runInitializers(this, _ownerId_initializers, void 0));
                this.questionId = (__runInitializers(this, _ownerId_extraInitializers), __runInitializers(this, _questionId_initializers, void 0));
                this.type = (__runInitializers(this, _questionId_extraInitializers), __runInitializers(this, _type_initializers, void 0)); // 'skeleton' | 'goblin'
                this.isAlive = (__runInitializers(this, _type_extraInitializers), __runInitializers(this, _isAlive_initializers, true));
                this.isFleeing = (__runInitializers(this, _isAlive_extraInitializers), __runInitializers(this, _isFleeing_initializers, false));
                // Waypoint flee system
                this.targetX = (__runInitializers(this, _isFleeing_extraInitializers), __runInitializers(this, _targetX_initializers, 0)); // Waypoint destination X
                this.targetY = (__runInitializers(this, _targetX_extraInitializers), __runInitializers(this, _targetY_initializers, 0)); // Waypoint destination Y
                this.restUntil = (__runInitializers(this, _targetY_extraInitializers), __runInitializers(this, _restUntil_initializers, 0)); // Timestamp when rest ends (0 = not resting)
                this.spawnZoneIndex = (__runInitializers(this, _restUntil_extraInitializers), __runInitializers(this, _spawnZoneIndex_initializers, -1)); // Index of the spawn zone this enemy belongs to
                this.isBusy = (__runInitializers(this, _spawnZoneIndex_extraInitializers), __runInitializers(this, _isBusy_initializers, false)); // True if engaged in a quiz
                this.lastRecalc = (__runInitializers(this, _isBusy_extraInitializers), __runInitializers(this, _lastRecalc_initializers, 0)); // Timestamp of last flee waypoint recalculation
                __runInitializers(this, _lastRecalc_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _x_decorators = [(0, schema_1.type)("number")];
            _y_decorators = [(0, schema_1.type)("number")];
            _ownerId_decorators = [(0, schema_1.type)("string")];
            _questionId_decorators = [(0, schema_1.type)("number")];
            _type_decorators = [(0, schema_1.type)("string")];
            _isAlive_decorators = [(0, schema_1.type)("boolean")];
            _isFleeing_decorators = [(0, schema_1.type)("boolean")];
            _targetX_decorators = [(0, schema_1.type)("number")];
            _targetY_decorators = [(0, schema_1.type)("number")];
            _restUntil_decorators = [(0, schema_1.type)("number")];
            _spawnZoneIndex_decorators = [(0, schema_1.type)("number")];
            _isBusy_decorators = [(0, schema_1.type)("boolean")];
            _lastRecalc_decorators = [(0, schema_1.type)("number")];
            __esDecorate(null, null, _x_decorators, { kind: "field", name: "x", static: false, private: false, access: { has: obj => "x" in obj, get: obj => obj.x, set: (obj, value) => { obj.x = value; } }, metadata: _metadata }, _x_initializers, _x_extraInitializers);
            __esDecorate(null, null, _y_decorators, { kind: "field", name: "y", static: false, private: false, access: { has: obj => "y" in obj, get: obj => obj.y, set: (obj, value) => { obj.y = value; } }, metadata: _metadata }, _y_initializers, _y_extraInitializers);
            __esDecorate(null, null, _ownerId_decorators, { kind: "field", name: "ownerId", static: false, private: false, access: { has: obj => "ownerId" in obj, get: obj => obj.ownerId, set: (obj, value) => { obj.ownerId = value; } }, metadata: _metadata }, _ownerId_initializers, _ownerId_extraInitializers);
            __esDecorate(null, null, _questionId_decorators, { kind: "field", name: "questionId", static: false, private: false, access: { has: obj => "questionId" in obj, get: obj => obj.questionId, set: (obj, value) => { obj.questionId = value; } }, metadata: _metadata }, _questionId_initializers, _questionId_extraInitializers);
            __esDecorate(null, null, _type_decorators, { kind: "field", name: "type", static: false, private: false, access: { has: obj => "type" in obj, get: obj => obj.type, set: (obj, value) => { obj.type = value; } }, metadata: _metadata }, _type_initializers, _type_extraInitializers);
            __esDecorate(null, null, _isAlive_decorators, { kind: "field", name: "isAlive", static: false, private: false, access: { has: obj => "isAlive" in obj, get: obj => obj.isAlive, set: (obj, value) => { obj.isAlive = value; } }, metadata: _metadata }, _isAlive_initializers, _isAlive_extraInitializers);
            __esDecorate(null, null, _isFleeing_decorators, { kind: "field", name: "isFleeing", static: false, private: false, access: { has: obj => "isFleeing" in obj, get: obj => obj.isFleeing, set: (obj, value) => { obj.isFleeing = value; } }, metadata: _metadata }, _isFleeing_initializers, _isFleeing_extraInitializers);
            __esDecorate(null, null, _targetX_decorators, { kind: "field", name: "targetX", static: false, private: false, access: { has: obj => "targetX" in obj, get: obj => obj.targetX, set: (obj, value) => { obj.targetX = value; } }, metadata: _metadata }, _targetX_initializers, _targetX_extraInitializers);
            __esDecorate(null, null, _targetY_decorators, { kind: "field", name: "targetY", static: false, private: false, access: { has: obj => "targetY" in obj, get: obj => obj.targetY, set: (obj, value) => { obj.targetY = value; } }, metadata: _metadata }, _targetY_initializers, _targetY_extraInitializers);
            __esDecorate(null, null, _restUntil_decorators, { kind: "field", name: "restUntil", static: false, private: false, access: { has: obj => "restUntil" in obj, get: obj => obj.restUntil, set: (obj, value) => { obj.restUntil = value; } }, metadata: _metadata }, _restUntil_initializers, _restUntil_extraInitializers);
            __esDecorate(null, null, _spawnZoneIndex_decorators, { kind: "field", name: "spawnZoneIndex", static: false, private: false, access: { has: obj => "spawnZoneIndex" in obj, get: obj => obj.spawnZoneIndex, set: (obj, value) => { obj.spawnZoneIndex = value; } }, metadata: _metadata }, _spawnZoneIndex_initializers, _spawnZoneIndex_extraInitializers);
            __esDecorate(null, null, _isBusy_decorators, { kind: "field", name: "isBusy", static: false, private: false, access: { has: obj => "isBusy" in obj, get: obj => obj.isBusy, set: (obj, value) => { obj.isBusy = value; } }, metadata: _metadata }, _isBusy_initializers, _isBusy_extraInitializers);
            __esDecorate(null, null, _lastRecalc_decorators, { kind: "field", name: "lastRecalc", static: false, private: false, access: { has: obj => "lastRecalc" in obj, get: obj => obj.lastRecalc, set: (obj, value) => { obj.lastRecalc = value; } }, metadata: _metadata }, _lastRecalc_initializers, _lastRecalc_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
exports.Enemy = Enemy;
let Question = (() => {
    var _a;
    let _classSuper = schema_1.Schema;
    let _id_decorators;
    let _id_initializers = [];
    let _id_extraInitializers = [];
    let _text_decorators;
    let _text_initializers = [];
    let _text_extraInitializers = [];
    let _imageUrl_decorators;
    let _imageUrl_initializers = [];
    let _imageUrl_extraInitializers = [];
    let _answerType_decorators;
    let _answerType_initializers = [];
    let _answerType_extraInitializers = [];
    let _options_decorators;
    let _options_initializers = [];
    let _options_extraInitializers = [];
    let _correctAnswer_decorators;
    let _correctAnswer_initializers = [];
    let _correctAnswer_extraInitializers = [];
    return _a = class Question extends _classSuper {
            constructor() {
                super(...arguments);
                this.id = __runInitializers(this, _id_initializers, void 0);
                this.text = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _text_initializers, void 0));
                this.imageUrl = (__runInitializers(this, _text_extraInitializers), __runInitializers(this, _imageUrl_initializers, "")); // URL for question image
                this.answerType = (__runInitializers(this, _imageUrl_extraInitializers), __runInitializers(this, _answerType_initializers, "text")); // 'text' or 'image'
                this.options = (__runInitializers(this, _answerType_extraInitializers), __runInitializers(this, _options_initializers, new schema_1.ArraySchema()));
                this.correctAnswer = (__runInitializers(this, _options_extraInitializers), __runInitializers(this, _correctAnswer_initializers, void 0));
                __runInitializers(this, _correctAnswer_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _id_decorators = [(0, schema_1.type)("number")];
            _text_decorators = [(0, schema_1.type)("string")];
            _imageUrl_decorators = [(0, schema_1.type)("string")];
            _answerType_decorators = [(0, schema_1.type)("string")];
            _options_decorators = [(0, schema_1.type)(["string"])];
            _correctAnswer_decorators = [(0, schema_1.type)("number")];
            __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id, set: (obj, value) => { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
            __esDecorate(null, null, _text_decorators, { kind: "field", name: "text", static: false, private: false, access: { has: obj => "text" in obj, get: obj => obj.text, set: (obj, value) => { obj.text = value; } }, metadata: _metadata }, _text_initializers, _text_extraInitializers);
            __esDecorate(null, null, _imageUrl_decorators, { kind: "field", name: "imageUrl", static: false, private: false, access: { has: obj => "imageUrl" in obj, get: obj => obj.imageUrl, set: (obj, value) => { obj.imageUrl = value; } }, metadata: _metadata }, _imageUrl_initializers, _imageUrl_extraInitializers);
            __esDecorate(null, null, _answerType_decorators, { kind: "field", name: "answerType", static: false, private: false, access: { has: obj => "answerType" in obj, get: obj => obj.answerType, set: (obj, value) => { obj.answerType = value; } }, metadata: _metadata }, _answerType_initializers, _answerType_extraInitializers);
            __esDecorate(null, null, _options_decorators, { kind: "field", name: "options", static: false, private: false, access: { has: obj => "options" in obj, get: obj => obj.options, set: (obj, value) => { obj.options = value; } }, metadata: _metadata }, _options_initializers, _options_extraInitializers);
            __esDecorate(null, null, _correctAnswer_decorators, { kind: "field", name: "correctAnswer", static: false, private: false, access: { has: obj => "correctAnswer" in obj, get: obj => obj.correctAnswer, set: (obj, value) => { obj.correctAnswer = value; } }, metadata: _metadata }, _correctAnswer_initializers, _correctAnswer_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
exports.Question = Question;
let Chest = (() => {
    var _a;
    let _classSuper = schema_1.Schema;
    let _x_decorators;
    let _x_initializers = [];
    let _x_extraInitializers = [];
    let _y_decorators;
    let _y_initializers = [];
    let _y_extraInitializers = [];
    let _isCollected_decorators;
    let _isCollected_initializers = [];
    let _isCollected_extraInitializers = [];
    let _collectedBy_decorators;
    let _collectedBy_initializers = [];
    let _collectedBy_extraInitializers = [];
    return _a = class Chest extends _classSuper {
            constructor() {
                super(...arguments);
                this.x = __runInitializers(this, _x_initializers, void 0);
                this.y = (__runInitializers(this, _x_extraInitializers), __runInitializers(this, _y_initializers, void 0));
                this.isCollected = (__runInitializers(this, _y_extraInitializers), __runInitializers(this, _isCollected_initializers, false));
                this.collectedBy = (__runInitializers(this, _isCollected_extraInitializers), __runInitializers(this, _collectedBy_initializers, ""));
                __runInitializers(this, _collectedBy_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _x_decorators = [(0, schema_1.type)("number")];
            _y_decorators = [(0, schema_1.type)("number")];
            _isCollected_decorators = [(0, schema_1.type)("boolean")];
            _collectedBy_decorators = [(0, schema_1.type)("string")];
            __esDecorate(null, null, _x_decorators, { kind: "field", name: "x", static: false, private: false, access: { has: obj => "x" in obj, get: obj => obj.x, set: (obj, value) => { obj.x = value; } }, metadata: _metadata }, _x_initializers, _x_extraInitializers);
            __esDecorate(null, null, _y_decorators, { kind: "field", name: "y", static: false, private: false, access: { has: obj => "y" in obj, get: obj => obj.y, set: (obj, value) => { obj.y = value; } }, metadata: _metadata }, _y_initializers, _y_extraInitializers);
            __esDecorate(null, null, _isCollected_decorators, { kind: "field", name: "isCollected", static: false, private: false, access: { has: obj => "isCollected" in obj, get: obj => obj.isCollected, set: (obj, value) => { obj.isCollected = value; } }, metadata: _metadata }, _isCollected_initializers, _isCollected_extraInitializers);
            __esDecorate(null, null, _collectedBy_decorators, { kind: "field", name: "collectedBy", static: false, private: false, access: { has: obj => "collectedBy" in obj, get: obj => obj.collectedBy, set: (obj, value) => { obj.collectedBy = value; } }, metadata: _metadata }, _collectedBy_initializers, _collectedBy_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
exports.Chest = Chest;
let Player = (() => {
    var _a;
    let _classSuper = schema_1.Schema;
    let _x_decorators;
    let _x_initializers = [];
    let _x_extraInitializers = [];
    let _y_decorators;
    let _y_initializers = [];
    let _y_extraInitializers = [];
    let _targetX_decorators;
    let _targetX_initializers = [];
    let _targetX_extraInitializers = [];
    let _targetY_decorators;
    let _targetY_initializers = [];
    let _targetY_extraInitializers = [];
    let _name_decorators;
    let _name_initializers = [];
    let _name_extraInitializers = [];
    let _hairId_decorators;
    let _hairId_initializers = [];
    let _hairId_extraInitializers = [];
    let _score_decorators;
    let _score_initializers = [];
    let _score_extraInitializers = [];
    let _correctAnswers_decorators;
    let _correctAnswers_initializers = [];
    let _correctAnswers_extraInitializers = [];
    let _wrongAnswers_decorators;
    let _wrongAnswers_initializers = [];
    let _wrongAnswers_extraInitializers = [];
    let _answeredQuestions_decorators;
    let _answeredQuestions_initializers = [];
    let _answeredQuestions_extraInitializers = [];
    let _isFinished_decorators;
    let _isFinished_initializers = [];
    let _isFinished_extraInitializers = [];
    let _finishTime_decorators;
    let _finishTime_initializers = [];
    let _finishTime_extraInitializers = [];
    let _hasUsedChest_decorators;
    let _hasUsedChest_initializers = [];
    let _hasUsedChest_extraInitializers = [];
    let _hasWrongAnswer_decorators;
    let _hasWrongAnswer_initializers = [];
    let _hasWrongAnswer_extraInitializers = [];
    let _lastWrongQuestionId_decorators;
    let _lastWrongQuestionId_initializers = [];
    let _lastWrongQuestionId_extraInitializers = [];
    let _sessionId_decorators;
    let _sessionId_initializers = [];
    let _sessionId_extraInitializers = [];
    let _subRoomId_decorators;
    let _subRoomId_initializers = [];
    let _subRoomId_extraInitializers = [];
    let _spawnIndex_decorators;
    let _spawnIndex_initializers = [];
    let _spawnIndex_extraInitializers = [];
    let _isHost_decorators;
    let _isHost_initializers = [];
    let _isHost_extraInitializers = [];
    let _questionOrder_decorators;
    let _questionOrder_initializers = [];
    let _questionOrder_extraInitializers = [];
    return _a = class Player extends _classSuper {
            constructor() {
                super(...arguments);
                this.x = __runInitializers(this, _x_initializers, void 0);
                this.y = (__runInitializers(this, _x_extraInitializers), __runInitializers(this, _y_initializers, void 0));
                this.targetX = (__runInitializers(this, _y_extraInitializers), __runInitializers(this, _targetX_initializers, 0)); // Where the player is moving to
                this.targetY = (__runInitializers(this, _targetX_extraInitializers), __runInitializers(this, _targetY_initializers, 0));
                this.name = (__runInitializers(this, _targetY_extraInitializers), __runInitializers(this, _name_initializers, void 0));
                this.hairId = (__runInitializers(this, _name_extraInitializers), __runInitializers(this, _hairId_initializers, 0));
                this.score = (__runInitializers(this, _hairId_extraInitializers), __runInitializers(this, _score_initializers, 0));
                this.correctAnswers = (__runInitializers(this, _score_extraInitializers), __runInitializers(this, _correctAnswers_initializers, 0));
                this.wrongAnswers = (__runInitializers(this, _correctAnswers_extraInitializers), __runInitializers(this, _wrongAnswers_initializers, 0));
                this.answeredQuestions = (__runInitializers(this, _wrongAnswers_extraInitializers), __runInitializers(this, _answeredQuestions_initializers, 0)); // Total questions answered
                this.isFinished = (__runInitializers(this, _answeredQuestions_extraInitializers), __runInitializers(this, _isFinished_initializers, false)); // Player finished all questions
                this.finishTime = (__runInitializers(this, _isFinished_extraInitializers), __runInitializers(this, _finishTime_initializers, 0)); // Timestamp when player finished (for tie-breaker)
                this.hasUsedChest = (__runInitializers(this, _finishTime_extraInitializers), __runInitializers(this, _hasUsedChest_initializers, false));
                this.hasWrongAnswer = (__runInitializers(this, _hasUsedChest_extraInitializers), __runInitializers(this, _hasWrongAnswer_initializers, false));
                this.lastWrongQuestionId = (__runInitializers(this, _hasWrongAnswer_extraInitializers), __runInitializers(this, _lastWrongQuestionId_initializers, 0));
                this.sessionId = (__runInitializers(this, _lastWrongQuestionId_extraInitializers), __runInitializers(this, _sessionId_initializers, void 0));
                this.subRoomId = (__runInitializers(this, _sessionId_extraInitializers), __runInitializers(this, _subRoomId_initializers, void 0)); // Track which sub-room the player is in
                this.spawnIndex = (__runInitializers(this, _subRoomId_extraInitializers), __runInitializers(this, _spawnIndex_initializers, -1)); // Track assigned spawn point index
                this.isHost = (__runInitializers(this, _spawnIndex_extraInitializers), __runInitializers(this, _isHost_initializers, false));
                this.questionOrder = (__runInitializers(this, _isHost_extraInitializers), __runInitializers(this, _questionOrder_initializers, new schema_1.ArraySchema())); // Personalized randomized question order
                __runInitializers(this, _questionOrder_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _x_decorators = [(0, schema_1.type)("number")];
            _y_decorators = [(0, schema_1.type)("number")];
            _targetX_decorators = [(0, schema_1.type)("number")];
            _targetY_decorators = [(0, schema_1.type)("number")];
            _name_decorators = [(0, schema_1.type)("string")];
            _hairId_decorators = [(0, schema_1.type)("number")];
            _score_decorators = [(0, schema_1.type)("number")];
            _correctAnswers_decorators = [(0, schema_1.type)("number")];
            _wrongAnswers_decorators = [(0, schema_1.type)("number")];
            _answeredQuestions_decorators = [(0, schema_1.type)("number")];
            _isFinished_decorators = [(0, schema_1.type)("boolean")];
            _finishTime_decorators = [(0, schema_1.type)("number")];
            _hasUsedChest_decorators = [(0, schema_1.type)("boolean")];
            _hasWrongAnswer_decorators = [(0, schema_1.type)("boolean")];
            _lastWrongQuestionId_decorators = [(0, schema_1.type)("number")];
            _sessionId_decorators = [(0, schema_1.type)("string")];
            _subRoomId_decorators = [(0, schema_1.type)("string")];
            _spawnIndex_decorators = [(0, schema_1.type)("number")];
            _isHost_decorators = [(0, schema_1.type)("boolean")];
            _questionOrder_decorators = [(0, schema_1.type)(["number"])];
            __esDecorate(null, null, _x_decorators, { kind: "field", name: "x", static: false, private: false, access: { has: obj => "x" in obj, get: obj => obj.x, set: (obj, value) => { obj.x = value; } }, metadata: _metadata }, _x_initializers, _x_extraInitializers);
            __esDecorate(null, null, _y_decorators, { kind: "field", name: "y", static: false, private: false, access: { has: obj => "y" in obj, get: obj => obj.y, set: (obj, value) => { obj.y = value; } }, metadata: _metadata }, _y_initializers, _y_extraInitializers);
            __esDecorate(null, null, _targetX_decorators, { kind: "field", name: "targetX", static: false, private: false, access: { has: obj => "targetX" in obj, get: obj => obj.targetX, set: (obj, value) => { obj.targetX = value; } }, metadata: _metadata }, _targetX_initializers, _targetX_extraInitializers);
            __esDecorate(null, null, _targetY_decorators, { kind: "field", name: "targetY", static: false, private: false, access: { has: obj => "targetY" in obj, get: obj => obj.targetY, set: (obj, value) => { obj.targetY = value; } }, metadata: _metadata }, _targetY_initializers, _targetY_extraInitializers);
            __esDecorate(null, null, _name_decorators, { kind: "field", name: "name", static: false, private: false, access: { has: obj => "name" in obj, get: obj => obj.name, set: (obj, value) => { obj.name = value; } }, metadata: _metadata }, _name_initializers, _name_extraInitializers);
            __esDecorate(null, null, _hairId_decorators, { kind: "field", name: "hairId", static: false, private: false, access: { has: obj => "hairId" in obj, get: obj => obj.hairId, set: (obj, value) => { obj.hairId = value; } }, metadata: _metadata }, _hairId_initializers, _hairId_extraInitializers);
            __esDecorate(null, null, _score_decorators, { kind: "field", name: "score", static: false, private: false, access: { has: obj => "score" in obj, get: obj => obj.score, set: (obj, value) => { obj.score = value; } }, metadata: _metadata }, _score_initializers, _score_extraInitializers);
            __esDecorate(null, null, _correctAnswers_decorators, { kind: "field", name: "correctAnswers", static: false, private: false, access: { has: obj => "correctAnswers" in obj, get: obj => obj.correctAnswers, set: (obj, value) => { obj.correctAnswers = value; } }, metadata: _metadata }, _correctAnswers_initializers, _correctAnswers_extraInitializers);
            __esDecorate(null, null, _wrongAnswers_decorators, { kind: "field", name: "wrongAnswers", static: false, private: false, access: { has: obj => "wrongAnswers" in obj, get: obj => obj.wrongAnswers, set: (obj, value) => { obj.wrongAnswers = value; } }, metadata: _metadata }, _wrongAnswers_initializers, _wrongAnswers_extraInitializers);
            __esDecorate(null, null, _answeredQuestions_decorators, { kind: "field", name: "answeredQuestions", static: false, private: false, access: { has: obj => "answeredQuestions" in obj, get: obj => obj.answeredQuestions, set: (obj, value) => { obj.answeredQuestions = value; } }, metadata: _metadata }, _answeredQuestions_initializers, _answeredQuestions_extraInitializers);
            __esDecorate(null, null, _isFinished_decorators, { kind: "field", name: "isFinished", static: false, private: false, access: { has: obj => "isFinished" in obj, get: obj => obj.isFinished, set: (obj, value) => { obj.isFinished = value; } }, metadata: _metadata }, _isFinished_initializers, _isFinished_extraInitializers);
            __esDecorate(null, null, _finishTime_decorators, { kind: "field", name: "finishTime", static: false, private: false, access: { has: obj => "finishTime" in obj, get: obj => obj.finishTime, set: (obj, value) => { obj.finishTime = value; } }, metadata: _metadata }, _finishTime_initializers, _finishTime_extraInitializers);
            __esDecorate(null, null, _hasUsedChest_decorators, { kind: "field", name: "hasUsedChest", static: false, private: false, access: { has: obj => "hasUsedChest" in obj, get: obj => obj.hasUsedChest, set: (obj, value) => { obj.hasUsedChest = value; } }, metadata: _metadata }, _hasUsedChest_initializers, _hasUsedChest_extraInitializers);
            __esDecorate(null, null, _hasWrongAnswer_decorators, { kind: "field", name: "hasWrongAnswer", static: false, private: false, access: { has: obj => "hasWrongAnswer" in obj, get: obj => obj.hasWrongAnswer, set: (obj, value) => { obj.hasWrongAnswer = value; } }, metadata: _metadata }, _hasWrongAnswer_initializers, _hasWrongAnswer_extraInitializers);
            __esDecorate(null, null, _lastWrongQuestionId_decorators, { kind: "field", name: "lastWrongQuestionId", static: false, private: false, access: { has: obj => "lastWrongQuestionId" in obj, get: obj => obj.lastWrongQuestionId, set: (obj, value) => { obj.lastWrongQuestionId = value; } }, metadata: _metadata }, _lastWrongQuestionId_initializers, _lastWrongQuestionId_extraInitializers);
            __esDecorate(null, null, _sessionId_decorators, { kind: "field", name: "sessionId", static: false, private: false, access: { has: obj => "sessionId" in obj, get: obj => obj.sessionId, set: (obj, value) => { obj.sessionId = value; } }, metadata: _metadata }, _sessionId_initializers, _sessionId_extraInitializers);
            __esDecorate(null, null, _subRoomId_decorators, { kind: "field", name: "subRoomId", static: false, private: false, access: { has: obj => "subRoomId" in obj, get: obj => obj.subRoomId, set: (obj, value) => { obj.subRoomId = value; } }, metadata: _metadata }, _subRoomId_initializers, _subRoomId_extraInitializers);
            __esDecorate(null, null, _spawnIndex_decorators, { kind: "field", name: "spawnIndex", static: false, private: false, access: { has: obj => "spawnIndex" in obj, get: obj => obj.spawnIndex, set: (obj, value) => { obj.spawnIndex = value; } }, metadata: _metadata }, _spawnIndex_initializers, _spawnIndex_extraInitializers);
            __esDecorate(null, null, _isHost_decorators, { kind: "field", name: "isHost", static: false, private: false, access: { has: obj => "isHost" in obj, get: obj => obj.isHost, set: (obj, value) => { obj.isHost = value; } }, metadata: _metadata }, _isHost_initializers, _isHost_extraInitializers);
            __esDecorate(null, null, _questionOrder_decorators, { kind: "field", name: "questionOrder", static: false, private: false, access: { has: obj => "questionOrder" in obj, get: obj => obj.questionOrder, set: (obj, value) => { obj.questionOrder = value; } }, metadata: _metadata }, _questionOrder_initializers, _questionOrder_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
exports.Player = Player;
let SubRoom = (() => {
    var _a;
    let _classSuper = schema_1.Schema;
    let _id_decorators;
    let _id_initializers = [];
    let _id_extraInitializers = [];
    let _capacity_decorators;
    let _capacity_initializers = [];
    let _capacity_extraInitializers = [];
    let _playerIds_decorators;
    let _playerIds_initializers = [];
    let _playerIds_extraInitializers = [];
    return _a = class SubRoom extends _classSuper {
            constructor() {
                super(...arguments);
                this.id = __runInitializers(this, _id_initializers, void 0); // "Room 1"
                this.capacity = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _capacity_initializers, void 0));
                this.playerIds = (__runInitializers(this, _capacity_extraInitializers), __runInitializers(this, _playerIds_initializers, new schema_1.ArraySchema()));
                __runInitializers(this, _playerIds_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _id_decorators = [(0, schema_1.type)("string")];
            _capacity_decorators = [(0, schema_1.type)("number")];
            _playerIds_decorators = [(0, schema_1.type)(["string"])];
            __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id, set: (obj, value) => { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
            __esDecorate(null, null, _capacity_decorators, { kind: "field", name: "capacity", static: false, private: false, access: { has: obj => "capacity" in obj, get: obj => obj.capacity, set: (obj, value) => { obj.capacity = value; } }, metadata: _metadata }, _capacity_initializers, _capacity_extraInitializers);
            __esDecorate(null, null, _playerIds_decorators, { kind: "field", name: "playerIds", static: false, private: false, access: { has: obj => "playerIds" in obj, get: obj => obj.playerIds, set: (obj, value) => { obj.playerIds = value; } }, metadata: _metadata }, _playerIds_initializers, _playerIds_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
exports.SubRoom = SubRoom;
let GameState = (() => {
    var _a;
    let _classSuper = schema_1.Schema;
    let _players_decorators;
    let _players_initializers = [];
    let _players_extraInitializers = [];
    let _enemies_decorators;
    let _enemies_initializers = [];
    let _enemies_extraInitializers = [];
    let _chests_decorators;
    let _chests_initializers = [];
    let _chests_extraInitializers = [];
    let _questions_decorators;
    let _questions_initializers = [];
    let _questions_extraInitializers = [];
    let _subRooms_decorators;
    let _subRooms_initializers = [];
    let _subRooms_extraInitializers = [];
    let _difficulty_decorators;
    let _difficulty_initializers = [];
    let _difficulty_extraInitializers = [];
    let _subject_decorators;
    let _subject_initializers = [];
    let _subject_extraInitializers = [];
    let _gameStartTime_decorators;
    let _gameStartTime_initializers = [];
    let _gameStartTime_extraInitializers = [];
    let _isGameStarted_decorators;
    let _isGameStarted_initializers = [];
    let _isGameStarted_extraInitializers = [];
    let _isGameOver_decorators;
    let _isGameOver_initializers = [];
    let _isGameOver_extraInitializers = [];
    let _roomCode_decorators;
    let _roomCode_initializers = [];
    let _roomCode_extraInitializers = [];
    let _hostId_decorators;
    let _hostId_initializers = [];
    let _hostId_extraInitializers = [];
    let _countdown_decorators;
    let _countdown_initializers = [];
    let _countdown_extraInitializers = [];
    return _a = class GameState extends _classSuper {
            constructor() {
                super(...arguments);
                this.players = __runInitializers(this, _players_initializers, new schema_1.MapSchema());
                this.enemies = (__runInitializers(this, _players_extraInitializers), __runInitializers(this, _enemies_initializers, new schema_1.ArraySchema()));
                this.chests = (__runInitializers(this, _enemies_extraInitializers), __runInitializers(this, _chests_initializers, new schema_1.ArraySchema()));
                this.questions = (__runInitializers(this, _chests_extraInitializers), __runInitializers(this, _questions_initializers, new schema_1.ArraySchema()));
                this.subRooms = (__runInitializers(this, _questions_extraInitializers), __runInitializers(this, _subRooms_initializers, new schema_1.ArraySchema()));
                this.difficulty = (__runInitializers(this, _subRooms_extraInitializers), __runInitializers(this, _difficulty_initializers, void 0));
                this.subject = (__runInitializers(this, _difficulty_extraInitializers), __runInitializers(this, _subject_initializers, void 0));
                this.gameStartTime = (__runInitializers(this, _subject_extraInitializers), __runInitializers(this, _gameStartTime_initializers, 0));
                this.isGameStarted = (__runInitializers(this, _gameStartTime_extraInitializers), __runInitializers(this, _isGameStarted_initializers, false));
                this.isGameOver = (__runInitializers(this, _isGameStarted_extraInitializers), __runInitializers(this, _isGameOver_initializers, false));
                this.roomCode = (__runInitializers(this, _isGameOver_extraInitializers), __runInitializers(this, _roomCode_initializers, void 0));
                this.hostId = (__runInitializers(this, _roomCode_extraInitializers), __runInitializers(this, _hostId_initializers, void 0)); // Track who is the host
                this.countdown = (__runInitializers(this, _hostId_extraInitializers), __runInitializers(this, _countdown_initializers, 0)); // Countdown timer (0 = not running)
                __runInitializers(this, _countdown_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _players_decorators = [(0, schema_1.type)({ map: Player })];
            _enemies_decorators = [(0, schema_1.type)([Enemy])];
            _chests_decorators = [(0, schema_1.type)([Chest])];
            _questions_decorators = [(0, schema_1.type)([Question])];
            _subRooms_decorators = [(0, schema_1.type)([SubRoom])];
            _difficulty_decorators = [(0, schema_1.type)("string")];
            _subject_decorators = [(0, schema_1.type)("string")];
            _gameStartTime_decorators = [(0, schema_1.type)("number")];
            _isGameStarted_decorators = [(0, schema_1.type)("boolean")];
            _isGameOver_decorators = [(0, schema_1.type)("boolean")];
            _roomCode_decorators = [(0, schema_1.type)("string")];
            _hostId_decorators = [(0, schema_1.type)("string")];
            _countdown_decorators = [(0, schema_1.type)("number")];
            __esDecorate(null, null, _players_decorators, { kind: "field", name: "players", static: false, private: false, access: { has: obj => "players" in obj, get: obj => obj.players, set: (obj, value) => { obj.players = value; } }, metadata: _metadata }, _players_initializers, _players_extraInitializers);
            __esDecorate(null, null, _enemies_decorators, { kind: "field", name: "enemies", static: false, private: false, access: { has: obj => "enemies" in obj, get: obj => obj.enemies, set: (obj, value) => { obj.enemies = value; } }, metadata: _metadata }, _enemies_initializers, _enemies_extraInitializers);
            __esDecorate(null, null, _chests_decorators, { kind: "field", name: "chests", static: false, private: false, access: { has: obj => "chests" in obj, get: obj => obj.chests, set: (obj, value) => { obj.chests = value; } }, metadata: _metadata }, _chests_initializers, _chests_extraInitializers);
            __esDecorate(null, null, _questions_decorators, { kind: "field", name: "questions", static: false, private: false, access: { has: obj => "questions" in obj, get: obj => obj.questions, set: (obj, value) => { obj.questions = value; } }, metadata: _metadata }, _questions_initializers, _questions_extraInitializers);
            __esDecorate(null, null, _subRooms_decorators, { kind: "field", name: "subRooms", static: false, private: false, access: { has: obj => "subRooms" in obj, get: obj => obj.subRooms, set: (obj, value) => { obj.subRooms = value; } }, metadata: _metadata }, _subRooms_initializers, _subRooms_extraInitializers);
            __esDecorate(null, null, _difficulty_decorators, { kind: "field", name: "difficulty", static: false, private: false, access: { has: obj => "difficulty" in obj, get: obj => obj.difficulty, set: (obj, value) => { obj.difficulty = value; } }, metadata: _metadata }, _difficulty_initializers, _difficulty_extraInitializers);
            __esDecorate(null, null, _subject_decorators, { kind: "field", name: "subject", static: false, private: false, access: { has: obj => "subject" in obj, get: obj => obj.subject, set: (obj, value) => { obj.subject = value; } }, metadata: _metadata }, _subject_initializers, _subject_extraInitializers);
            __esDecorate(null, null, _gameStartTime_decorators, { kind: "field", name: "gameStartTime", static: false, private: false, access: { has: obj => "gameStartTime" in obj, get: obj => obj.gameStartTime, set: (obj, value) => { obj.gameStartTime = value; } }, metadata: _metadata }, _gameStartTime_initializers, _gameStartTime_extraInitializers);
            __esDecorate(null, null, _isGameStarted_decorators, { kind: "field", name: "isGameStarted", static: false, private: false, access: { has: obj => "isGameStarted" in obj, get: obj => obj.isGameStarted, set: (obj, value) => { obj.isGameStarted = value; } }, metadata: _metadata }, _isGameStarted_initializers, _isGameStarted_extraInitializers);
            __esDecorate(null, null, _isGameOver_decorators, { kind: "field", name: "isGameOver", static: false, private: false, access: { has: obj => "isGameOver" in obj, get: obj => obj.isGameOver, set: (obj, value) => { obj.isGameOver = value; } }, metadata: _metadata }, _isGameOver_initializers, _isGameOver_extraInitializers);
            __esDecorate(null, null, _roomCode_decorators, { kind: "field", name: "roomCode", static: false, private: false, access: { has: obj => "roomCode" in obj, get: obj => obj.roomCode, set: (obj, value) => { obj.roomCode = value; } }, metadata: _metadata }, _roomCode_initializers, _roomCode_extraInitializers);
            __esDecorate(null, null, _hostId_decorators, { kind: "field", name: "hostId", static: false, private: false, access: { has: obj => "hostId" in obj, get: obj => obj.hostId, set: (obj, value) => { obj.hostId = value; } }, metadata: _metadata }, _hostId_initializers, _hostId_extraInitializers);
            __esDecorate(null, null, _countdown_decorators, { kind: "field", name: "countdown", static: false, private: false, access: { has: obj => "countdown" in obj, get: obj => obj.countdown, set: (obj, value) => { obj.countdown = value; } }, metadata: _metadata }, _countdown_initializers, _countdown_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
exports.GameState = GameState;
