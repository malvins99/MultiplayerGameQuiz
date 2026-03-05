export class WaitingRoomUI {
    static render() {
        let waitingUI = document.getElementById('waiting-ui');
        if (!waitingUI) {
            waitingUI = document.createElement('div');
            waitingUI.id = 'waiting-ui';
            waitingUI.className = 'bg-background-dark hidden fixed top-0 left-0 w-full h-screen z-20 overflow-hidden font-display';
            waitingUI.innerHTML = `
                <div class="fixed inset-0 pointer-events-none overflow-hidden pixel-bg-pattern opacity-15"></div>

                <div class="relative z-10 flex h-screen w-full flex-col p-6">

                <!-- Back Button (Matched Style) -->
                <button id="waiting-back-btn"
                    class="absolute top-6 left-6 w-12 h-12 bg-black/40 border-2 border-white/10 hover:border-primary rounded-full flex items-center justify-center transition-all z-50 group shadow-lg">
                    <span class="material-symbols-outlined text-white/50 group-hover:text-white transition-colors">arrow_back</span>
                </button>

                <main class="flex-1 flex gap-6 overflow-hidden max-w-[1600px] mx-auto w-full pt-12">
                    <!-- LEFT: Character & Profile - Adjusted Width -->
                    <section class="w-96 shrink-0 flex flex-col gap-3">
                    <div id="sidebar-card"
                        class="bg-surface-dark border-4 border-black p-5 rounded-2xl flex flex-col gap-4 shadow-xl relative overflow-hidden">

                        <!-- 1. Character Selection -->
                        <div id="character-selection-section" class="space-y-2 shrink-0 w-full">
                        <p class="text-[10px] font-bold text-white/40 uppercase tracking-widest text-center">Selected Character
                        </p>

                        <div class="flex items-center gap-2">
                            <button
                            class="w-8 h-8 bg-black/40 border-2 border-white/10 hover:border-primary flex items-center justify-center transition-colors rounded-lg">
                            <span class="material-symbols-outlined text-white/50">chevron_left</span>
                            </button>

                            <!-- Preview Box -->
                            <div id="character-preview-box"
                            class="flex-1 h-40 bg-black/40 border-2 border-white/10 rounded-xl flex items-center justify-center relative overflow-hidden group hover:border-primary transition-colors cursor-pointer ring-1 ring-white/5 shadow-inner">
                            <div class="absolute inset-0 bg-[url('/assets/bg_pattern.png')] opacity-20"></div>
                            </div>

                            <button
                            class="w-8 h-8 bg-black/40 border-2 border-white/10 hover:border-primary flex items-center justify-center transition-colors rounded-lg">
                            <span class="material-symbols-outlined text-white/50">chevron_right</span>
                            </button>
                        </div>
                        </div>

                        <!-- 2. Name Input -->
                        <div id="player-name-section" class="space-y-1 shrink-0">
                        <p class="text-[9px] font-bold text-white/40 uppercase tracking-widest text-center">Your Name</p>
                        <div class="relative group">
                            <input id="player-name-input"
                            class="w-full h-11 bg-black/60 border-2 border-white/10 focus:border-primary focus:ring-0 px-4 font-bold tracking-widest uppercase text-white text-[11px] placeholder:text-white/20 font-['Retro_Gaming'] text-center rounded-xl transition-all hover:border-white/20"
                            placeholder="PLAYER" type="text" maxlength="12" />
                            <div
                            class="absolute right-3 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none group-focus-within:opacity-100 transition-opacity">
                            <span class="material-symbols-outlined text-primary text-sm">edit</span>
                            </div>
                        </div>
                        </div>

                        <!-- 3. Room Code (Absolute Copy Icon) -->
                        <div
                        class="shrink-0 relative bg-black/40 border-2 border-primary/50 p-5 rounded-xl flex flex-col items-center justify-center gap-1 group hover:border-primary transition-colors">
                        <span id="display-room-code"
                            class="text-3xl font-bold tracking-[0.2em] text-primary font-['Retro_Gaming'] drop-shadow-md text-center">------</span>

                        <button id="copy-code-btn"
                            class="absolute top-2 right-2 p-1.5 text-white/20 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                            title="Copy Code">
                            <span id="copy-icon" class="material-symbols-outlined text-sm">content_copy</span>
                        </button>
                        </div>

                        <!-- 4. QR Code -->
                        <div class="mt-0.5 flex flex-col items-center w-full">
                        <div
                            class="bg-black/40 p-4 rounded-xl w-full flex items-center justify-center border-2 border-primary shadow-[0_0_15px_rgba(0,255,85,0.1)]">
                            <div class="w-48 h-48 bg-white p-2 rounded-lg">
                            <img src="" class="w-full h-full object-contain mix-blend-multiply" alt="QR" id="room-qr-code" />
                            </div>
                        </div>
                        </div>

                        <!-- 5. Host-only Start Button Container -->
                        <div id="host-start-btn-container" class="mt-2 w-full hidden">
                        <!-- Re-injected here via JS for host -->
                        </div>
                    </div>
                    </section>

                    <!-- CENTER: Connected Players -->
                    <section class="flex-1 flex flex-col gap-4 min-w-0">
                    <div
                        class="bg-surface-dark border-4 border-black p-6 rounded-2xl flex-1 flex flex-col relative overflow-hidden shadow-xl">
                        <div class="flex justify-between items-center mb-6 border-b-2 border-white/5 pb-4">
                        <!-- Header Font Fix -->
                        <h3 id="waiting-header-text"
                            class="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-3 font-['Retro_Gaming']">
                            <span class="flex size-3 relative">
                            <span
                                class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span class="relative inline-flex rounded-full size-3 bg-primary"></span>
                            </span>
                            Connected Players
                        </h3>
                        <div id="player-count"
                            class="px-3 py-1 bg-primary/20 text-primary border border-primary/30 rounded text-[10px] font-bold font-['Retro_Gaming']">
                            0/4</div>
                        </div>

                        <!-- Grid: Tall Cards -->
                        <div id="player-grid" class="grid grid-cols-4 gap-4 flex-1 h-full max-h-[400px]">
                        <!-- Content injected via JS -->
                        </div>
                    </div>

                    <!-- Start Button Area -->
                    <div class="shrink-0 relative">
                        <button id="start-game-btn"
                        class="w-full py-6 bg-primary text-background-dark font-bold text-xl uppercase pixel-btn-green border-4 border-black active:translate-y-1 transition-transform hidden font-['Retro_Gaming'] shadow-[0_10px_0_#000] hover:brightness-110 mb-2">
                        START GAME
                        </button>
                        <div id="waiting-msg"
                        class="w-full py-6 flex items-center justify-center bg-black/20 border-4 border-black/20 rounded-xl">
                        <p class="text-white/30 text-xs font-bold uppercase tracking-widest animate-pulse font-['Retro_Gaming']">
                            Waiting for host...</p>
                        </div>
                    </div>
                    </section>
                </main>
                </div>
            `;
            document.body.appendChild(waitingUI);
        }
    }
}
