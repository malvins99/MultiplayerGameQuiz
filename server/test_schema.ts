import { GameState, Question, SubRoom } from "../shared/state";

try {
    const state = new GameState();

    // Simulate GameRoom onCreate
    state.difficulty = "mudah";
    state.subject = "matematika";
    state.roomCode = "123456";

    // Create typical questions
    for (let i = 0; i < 5; i++) {
        const q = new Question();
        q.id = i;
        q.text = "Question " + i;
        q.imageUrl = "";
        q.answerType = "text";
        q.correctAnswer = 0;

        // Add options
        q.options.push("A");
        q.options.push("B");
        q.options.push("C");
        q.options.push("D");

        state.questions.push(q);
    }

    const sub = new SubRoom();
    sub.id = "Room 1";
    sub.capacity = 4;
    state.subRooms.push(sub);

    state.hostId = "TEST-SESSION-ID";

    const bytes = state.encodeAll();
    console.log("EncodeAll Success! Byte length:", bytes?.length);

    // Try to trigger the specific array problem
    console.log("options array:", state.questions[0].options.toJSON());

} catch (e: any) {
    console.error("ENCODE FAILED:", e);
}
