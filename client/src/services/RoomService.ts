import { Client } from 'colyseus.js';
import { supabaseB, SESSION_TABLE, PARTICIPANT_TABLE } from '../lib/supabaseB';
import { authService } from './AuthService';
import { Quiz } from '../data/QuizData';

export interface RoomCreationOptions {
    difficulty: string;
    questionCount: number;
    timer: number;
    quiz: Quiz;
}

export class RoomService {
    static async createRoom(client: Client, options: RoomCreationOptions) {
        const { difficulty, questionCount, timer, quiz } = options;

        // MAP CONFIGURATION
        let mapFile = 'map_newest_easy_nomor1.tmj'; // Match GameScene default
        if (difficulty === 'sedang') mapFile = 'map_baru2.tmj';
        if (difficulty === 'sulit') mapFile = 'map_baru3.tmj';

        // ENEMY COUNT CALCULATION
        const enemyCount = questionCount === 5 ? 10 : 20;

        const roomCode = this.generateRoomCode();
        const profile = authService.getStoredProfile();
        const hostId = profile ? profile.id : null;

        try {
            // 1. Create Session in Supabase B
            const { data, error } = await supabaseB
                .from(SESSION_TABLE)
                .insert({
                    game_pin: roomCode,
                    quiz_id: quiz.id,
                    status: 'waiting',
                    question_limit: questionCount,
                    total_time_minutes: timer / 60,
                    difficulty: difficulty,
                    host_id: hostId,
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) {
                console.error("Supabase Session Error:", error);
                throw new Error("Failed to create game session.");
            }

            console.log("Session Created in Supabase B:", data);

            // 1.5 Add Host to Participants
            if (data && data.id) {
                const { error: partError } = await supabaseB
                    .from(PARTICIPANT_TABLE)
                    .insert({
                        session_id: data.id,
                        nickname: profile?.nickname || profile?.fullname || profile?.username || "Host",
                        user_id: hostId,
                        joined_at: new Date().toISOString(),
                        score: 0
                    });

                if (partError) {
                    console.error("Error adding host to participants:", partError);
                }
            }

            const colyseusOptions = {
                roomCode: roomCode,
                sessionId: data.id,
                difficulty: difficulty,
                subject: quiz.category.toLowerCase(),
                quizId: quiz.id,
                quizTitle: quiz.title,
                map: mapFile,
                questionCount: questionCount,
                enemyCount: enemyCount,
                timer: timer
            };

            // 2. Create/Join Room on Colyseus
            const room = await client.joinOrCreate("game_room", colyseusOptions);
            console.log("Room created via RoomService!", room);

            return { room, options: colyseusOptions };

        } catch (e) {
            console.error("RoomService Flow Error:", e);
            throw e;
        }
    }

    private static generateRoomCode(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
}
