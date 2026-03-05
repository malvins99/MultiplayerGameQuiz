export class CreateRoomUI {
    static render() {
        let createRoomUI = document.getElementById('create-room-ui');
        if (!createRoomUI) {
            createRoomUI = document.createElement('div');
            createRoomUI.id = 'create-room-ui';
            createRoomUI.className = 'bg-background-dark hidden fixed top-0 left-0 w-full h-screen z-20';
            createRoomUI.innerHTML = `
                <div class="fixed inset-0 pointer-events-none overflow-hidden pixel-bg-pattern opacity-15"></div>

                <div class="relative z-10 flex h-screen w-full flex-col items-center justify-center p-8">
                <!-- Back Button -->
                <button id="back-to-lobby-btn"
                    class="absolute top-4 left-4 flex items-center gap-2 text-white/60 hover:text-primary transition-colors">
                    <span class="material-symbols-outlined">arrow_back</span>
                    <span class="text-xs font-bold uppercase">Back</span>
                </button>

                <h1 class="text-3xl font-bold tracking-tighter uppercase italic text-white mb-8">Create New Room</h1>

                <div class="w-full max-w-md bg-surface-dark p-8 border-4 border-black space-y-6">
                    <!-- Difficulty Selection -->
                    <div class="space-y-3">
                    <p class="text-xs font-bold uppercase text-white/40 tracking-widest">Select Difficulty</p>
                    <div class="grid grid-cols-3 gap-2">
                        <button
                        class="difficulty-btn bg-black/40 border-2 border-white/10 p-3 text-center hover:border-primary transition-colors"
                        data-difficulty="mudah">
                        <span class="text-lg font-bold text-primary">Mudah</span>
                        <p class="text-[9px] text-white/40">4 Players</p>
                        </button>
                        <button
                        class="difficulty-btn bg-black/40 border-2 border-white/10 p-3 text-center hover:border-primary transition-colors"
                        data-difficulty="sedang">
                        <span class="text-lg font-bold text-secondary">Sedang</span>
                        <p class="text-[9px] text-white/40">5 Players</p>
                        </button>
                        <button
                        class="difficulty-btn bg-black/40 border-2 border-white/10 p-3 text-center hover:border-primary transition-colors"
                        data-difficulty="sulit">
                        <span class="text-lg font-bold text-accent">Sulit</span>
                        <p class="text-[9px] text-white/40">6 Players</p>
                        </button>
                    </div>
                    </div>

                    <!-- Subject Selection -->
                    <div class="space-y-3">
                    <p class="text-xs font-bold uppercase text-white/40 tracking-widest">Select Subject</p>
                    <select id="subject-select"
                        class="w-full h-12 bg-black/40 border-2 border-white/10 focus:border-primary focus:ring-0 px-3 text-primary font-bold uppercase text-sm">
                        <option value="matematika">Matematika</option>
                        <option value="biologi">Biologi</option>
                        <option value="sejarah">Sejarah</option>
                        <option value="fisika">Fisika</option>
                        <option value="kimia">Kimia</option>
                        <option value="geografi">Geografi</option>
                    </select>
                    </div>

                    <!-- Create Button -->
                    <button id="confirm-create-room-btn"
                    class="w-full h-16 bg-primary text-background-dark font-bold text-xl uppercase pixel-btn-green border-4 border-black active:translate-y-1 transition-transform">
                    Buat Room
                    </button>
                </div>
                </div>
            `;
            document.body.appendChild(createRoomUI);
        }
    }
}
