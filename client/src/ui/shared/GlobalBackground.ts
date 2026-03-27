/**
 * GlobalBackground — Shared background component for all green-themed pages.
 * Provides: gradient, pixel grid, 3-layer pixel clouds, firefly particles, walking characters.
 *
 * Usage:
 *   import { GlobalBackground } from '../../ui/shared/GlobalBackground';
 *
 *   // In your template:
 *   ${GlobalBackground.getHTML('mypage')}
 *
 *   // After rendering:
 *   GlobalBackground.startCharacterSpawner('mypage');
 *
 *   // On cleanup (optional):
 *   GlobalBackground.stopCharacterSpawner('mypage');
 */
export class GlobalBackground {
    private static spawnerIntervals: Map<string, ReturnType<typeof setInterval>> = new Map();

    /**
     * Returns the full background HTML string.
     * @param id — Unique page identifier (e.g. 'lobby', 'selectquiz'). Used for walking-chars container ID.
     */
    static getHTML(id: string): string {
        return `
            <!-- Full-Screen Background — palette gradient -->
            <div class="absolute inset-0" style="background: linear-gradient(180deg, #6CC452 0%, #478D47 100%);"></div>

            <!-- Pixel-art Background Decorations -->
            <div class="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <!-- Subtle pixel grid pattern -->
                <div class="absolute inset-0 opacity-[0.06]" style="background-image: radial-gradient(#2d5a30 1px, transparent 1px); background-size: 24px 24px;"></div>

                <!-- Diverse Pixel Clouds (Varying sizes, colors, speeds) -->
                
                <!-- L1: Back Layer (Small/Medium, Slow) -->
                <div class="absolute top-[10%] opacity-20 animate-[drift_80s_linear_infinite]" style="transform: scale(1.0); left: -10%;">
                    <div class="relative w-10 h-3 bg-white">
                        <div class="absolute -top-1 left-2 w-3 h-1 bg-white"></div>
                    </div>
                </div>
                <div class="absolute top-[45%] opacity-15 animate-[drift_95s_linear_infinite_reverse]" style="transform: scale(0.8); left: 80%;">
                    <div class="relative w-12 h-4 bg-[#D3EE98]">
                        <div class="absolute -top-2 left-3 w-4 h-2 bg-[#D3EE98]"></div>
                    </div>
                </div>
                <div class="absolute top-[15%] opacity-15 animate-[drift_110s_linear_infinite]" style="transform: scale(1.2); left: 40%;">
                    <div class="relative w-14 h-4 bg-white">
                        <div class="absolute -top-2 left-4 w-5 h-2 bg-white"></div>
                    </div>
                </div>

                <!-- L2: Mid Layer (Medium) -->
                <div class="absolute top-[25%] opacity-40 animate-[drift_45s_linear_infinite]" style="transform: scale(1.8); left: 15%;">
                    <div class="relative w-16 h-5 bg-[#D3EE98]">
                        <div class="absolute -top-3 left-4 w-6 h-3 bg-[#D3EE98]"></div>
                        <div class="absolute -top-5 left-8 w-4 h-5 bg-[#D3EE98]"></div>
                    </div>
                </div>
                <div class="absolute top-[65%] opacity-35 animate-[drift_55s_linear_infinite_reverse]" style="transform: scale(1.5); left: 60%;">
                    <div class="relative w-14 h-4 bg-white">
                        <div class="absolute -top-2 left-4 w-5 h-2 bg-white"></div>
                        <div class="absolute -top-4 left-7 w-3 h-4 bg-white"></div>
                    </div>
                </div>
                <div class="absolute top-[5%] opacity-25 animate-[drift_70s_linear_infinite]" style="transform: scale(1.7); left: 75%;">
                    <div class="relative w-16 h-5 bg-[#D3EE98]">
                        <div class="absolute -top-3 left-5 w-6 h-3 bg-[#D3EE98]"></div>
                    </div>
                </div>

                <!-- L3: Front Layer (Large, Faster) -->
                <div class="absolute top-[40%] opacity-30 animate-[drift_35s_linear_infinite]" style="transform: scale(2.5); left: -20%;">
                    <div class="relative w-12 h-4 bg-[#FEFF9F]">
                        <div class="absolute -top-2 left-2 w-4 h-2 bg-[#FEFF9F]"></div>
                        <div class="absolute -top-4 left-5 w-4 h-4 bg-[#FEFF9F]"></div>
                    </div>
                </div>
                <div class="absolute top-[75%] opacity-25 animate-[drift_40s_linear_infinite_reverse]" style="transform: scale(2.2); left: 40%;">
                    <div class="relative w-18 h-6 bg-white">
                        <div class="absolute -top-3 left-5 w-7 h-3 bg-white"></div>
                        <div class="absolute -top-6 left-10 w-5 h-6 bg-white"></div>
                    </div>
                </div>
                <div class="absolute top-[50%] opacity-20 animate-[drift_30s_linear_infinite]" style="transform: scale(3.0); left: 10%;">
                    <div class="relative w-14 h-4 bg-[#FEFF9F]">
                        <div class="absolute -top-2 left-4 w-5 h-2 bg-[#FEFF9F]"></div>
                    </div>
                </div>

                <!-- Floating Particles -->
                <div class="firefly !bg-[#FEFF9F] !shadow-[0_0_15px_rgba(254,255,159,0.9)]" style="top: 25%; left: 15%; animation-delay: 0s;"></div>
                <div class="firefly !bg-white !shadow-[0_0_15px_rgba(255,255,255,0.8)]" style="top: 65%; left: 80%; animation-delay: 1.5s;"></div>
                <div class="firefly !bg-[#D3EE98] !shadow-[0_0_15px_rgba(211,238,152,0.9)]" style="top: 45%; left: 45%; animation-delay: 3s;"></div>
                <div class="firefly !bg-[#FEFF9F] !shadow-[0_0_15px_rgba(254,255,159,0.9)]" style="top: 85%; left: 20%; animation-delay: 4.5s;"></div>
                <div class="firefly !bg-white !shadow-[0_0_15px_rgba(255,255,255,0.8)]" style="top: 15%; left: 70%; animation-delay: 6s;"></div>
            </div>

            <!-- Walking Characters Container -->
            <div id="${id}-walking-characters-container" class="absolute inset-0 z-0 overflow-hidden pointer-events-none"></div>
        `;
    }

    /**
     * Starts the walking character spawner for a given container.
     */
    static startCharacterSpawner(id: string): void {
        if (this.spawnerIntervals.has(id)) return;

        const container = document.getElementById(`${id}-walking-characters-container`);
        if (!container) return;

        this.checkAndSpawn(container);

        const interval = setInterval(() => {
            this.checkAndSpawn(container);
        }, 5000);

        this.spawnerIntervals.set(id, interval);
    }

    /**
     * Stops the walking character spawner for a given container.
     */
    static stopCharacterSpawner(id: string): void {
        const interval = this.spawnerIntervals.get(id);
        if (interval) {
            clearInterval(interval);
            this.spawnerIntervals.delete(id);
        }
    }

    private static checkAndSpawn(container: HTMLElement): void {
        const hCount = container.querySelectorAll('.walking-char-container[data-type="human"]').length;
        const sCount = container.querySelectorAll('.walking-char-container[data-type="skeleton"]').length;
        const gCount = container.querySelectorAll('.walking-char-container[data-type="goblin"]').length;

        if (hCount + sCount + gCount >= 5) return;

        const rand = Math.random();
        if (sCount === 0 && rand < 0.15) {
            this.spawnCharacter(container, 'skeleton');
        } else if (gCount === 0 && rand < 0.3) {
            this.spawnCharacter(container, 'goblin');
        } else if (hCount < 3) {
            this.spawnCharacter(container, 'human');
        }
    }

    private static spawnCharacter(container: HTMLElement, type: 'human' | 'skeleton' | 'goblin' = 'human'): void {
        const charContainer = document.createElement('div');
        charContainer.className = 'walking-char-container';
        charContainer.setAttribute('data-type', type);

        const sprite = document.createElement('div');
        sprite.className = 'walking-char-sprite';
        charContainer.appendChild(sprite);

        const fromRight = Math.random() > 0.5;
        let speed = 20 + Math.random() * 10;
        
        if (type === 'skeleton') {
            sprite.style.backgroundImage = `url('/assets/characters/Skeleton/PNG/skeleton_walk_strip8.png')`;
            speed = 10 + Math.random() * 5;
            sprite.style.animation = `base-walk-cycle 0.6s steps(8) infinite`;
        } else if (type === 'goblin') {
            sprite.style.backgroundImage = `url('/assets/characters/Goblin/PNG/spr_walk_strip8.png')`;
            speed = 22 + Math.random() * 6;
            sprite.style.animation = `base-walk-cycle 0.8s steps(8) infinite`;
        } else {
            const hairTypes = ['longhair', 'shorthair', 'curlyhair'];
            const selectedHair = hairTypes[Math.floor(Math.random() * hairTypes.length)];
            sprite.style.backgroundImage = `url('/assets/${selectedHair}_walk_strip8.png'), url('/assets/base_walk_strip8.png')`;
            sprite.style.animation = `base-walk-cycle 0.8s steps(8) infinite`;
        }

        const moveAnim = fromRight ? 'walk-across-left-flipped' : 'walk-across-right';
        charContainer.style.animation = `${moveAnim} ${speed}s linear forwards`;

        container.appendChild(charContainer);

        setTimeout(() => {
            if (charContainer.parentElement) charContainer.remove();
        }, speed * 1000 + 500);
    }
}
