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
    private static draggedElement: HTMLElement | null = null;
    private static dragOffset = { x: 0, y: 0 };
    private static lastPointerPos = { x: 0, y: 0 };
    private static velocity = { x: 0, y: 0 };
    private static isInitialized = false;

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

    private static initGlobalListeners() {
        if (this.isInitialized) return;
        this.isInitialized = true;

        window.addEventListener('resize', () => {
            // Update destination for characters that are currently resuming walk
            const characters = document.querySelectorAll('.walking-char-container:not(.is-dragged)');
            characters.forEach((char: any) => {
                const speed = parseFloat(char.dataset.speed || '25');
                const fromRight = char.dataset.fromRight === 'true';
                
                // If it has a manual left transition active
                if (char.style.transition.includes('left')) {
                    const currentLeft = char.getBoundingClientRect().left;
                    const targetLeft = fromRight ? -240 : window.innerWidth;
                    const totalDist = window.innerWidth + 240;
                    const remainingDist = Math.abs(targetLeft - currentLeft);
                    const remainingTime = (remainingDist / totalDist) * speed;

                    char.style.transition = `left ${remainingTime}s linear, bottom 0.3s ease-out`;
                    char.style.left = `${targetLeft}px`;
                }
            });
        });

        window.addEventListener('pointermove', (e) => {
            if (!this.draggedElement) return;
            
            // Calculate velocity
            this.velocity.x = e.clientX - this.lastPointerPos.x;
            this.velocity.y = e.clientY - this.lastPointerPos.y;
            this.lastPointerPos.x = e.clientX;
            this.lastPointerPos.y = e.clientY;

            const x = e.clientX - this.dragOffset.x;
            const y = e.clientY - this.dragOffset.y;
            
            this.draggedElement.style.left = `${x}px`;
            this.draggedElement.style.top = `${y}px`;
            this.draggedElement.style.bottom = 'auto';
            
            const fromRight = this.draggedElement.dataset.fromRight === 'true';
            this.draggedElement.style.transform = fromRight ? 'scale(-1, 1)' : 'none';
        });

        window.addEventListener('pointerup', () => {
            if (!this.draggedElement) return;
            
            const char = this.draggedElement;
            char.classList.remove('is-dragged');
            char.style.cursor = 'grab';
            const fromRight = char.dataset.fromRight === 'true';
            
            // Re-enable walking animation
            const sprite = char.querySelector('.walking-char-sprite') as HTMLElement;
            if (sprite) sprite.style.animationPlayState = 'running';
            char.style.transform = fromRight ? 'scale(-1, 1)' : 'none';
            
            // 1. Momentum & Gravity Effect (Throwing)
            const throwX = this.velocity.x * 20;
            const throwY = this.velocity.y < 0 ? this.velocity.y * 10 : 0; // Only jump up if vy is negative
            const currentLeft = char.getBoundingClientRect().left;
            const currentTop = char.getBoundingClientRect().top;
            
            const targetX = currentLeft + throwX;
            const floorTop = window.innerHeight - 100;
            const peakTop = currentTop + throwY;

            // Apply consistent rotation/scale
            char.style.transform = fromRight ? 'scale(-1, 1)' : 'none';

            if (throwY < -10) { // Lower threshold for "upward" feel
                // Parabolic: Up then Down
                char.style.transition = 'top 0.4s cubic-bezier(0.33, 1, 0.68, 1), left 1.2s cubic-bezier(0.1, 0, 0.2, 1)';
                char.style.left = `${targetX}px`;
                char.style.top = `${peakTop}px`;
                
                setTimeout(() => {
                    if (char.parentElement && this.draggedElement !== char) {
                        char.style.transition = 'top 0.8s cubic-bezier(0.5, 0, 0.75, 0), left 0.8s linear';
                        char.style.top = `${floorTop}px`;
                    }
                }, 400);

                setTimeout(() => {
                    this.resumeWalking(char, targetX);
                }, 1200);
            } else {
                // Normal fall - but still with momentum!
                char.style.transition = 'top 0.8s cubic-bezier(0.4, 0, 0.2, 1), left 0.8s cubic-bezier(0.1, 0, 0.2, 1)';
                char.style.left = `${targetX}px`;
                char.style.top = `${floorTop}px`;

                setTimeout(() => {
                    this.resumeWalking(char, targetX);
                }, 800);
            }

            this.draggedElement = null;
        });
    }

    private static resumeWalking(char: HTMLElement, lastTargetX: number) {
        if (!char.parentElement) return;
        
        const speed = parseFloat(char.dataset.speed || '25');
        const fromRight = char.dataset.fromRight === 'true';
        const currentLeft = char.getBoundingClientRect().left;
        
        const targetLeft = fromRight ? -240 : window.innerWidth;
        const totalDist = window.innerWidth + 240;
        const remainingDist = Math.abs(targetLeft - currentLeft);
        const remainingTime = (remainingDist / totalDist) * speed;

        // Re-anchor to bottom for responsiveness
        char.style.transition = `left ${remainingTime}s linear, bottom 0.3s ease-out`;
        char.style.top = 'auto';
        char.style.bottom = '-60px'; 
        char.style.left = `${targetLeft}px`;
        char.style.transform = fromRight ? 'scale(-1, 1)' : 'none';
        
        // Re-enable walking sprite animation (if not already)
        const sprite = char.querySelector('.walking-char-sprite') as HTMLElement;
        if (sprite) sprite.style.animationPlayState = 'running';
    }

    /**
     * Starts the walking character spawner for a given container.
     */
    static startCharacterSpawner(id: string): void {
        this.initGlobalListeners();
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
            const hairTypes = ['bowlhair', 'curlyhair', 'longhair', 'mophair', 'shorthair', 'spikeyhair'];
            const selectedHair = hairTypes[Math.floor(Math.random() * hairTypes.length)];
            const humanPath = '/assets/characters/Human/WALKING';
            sprite.style.backgroundImage = `url('${humanPath}/${selectedHair}_walk_strip8.png'), url('${humanPath}/tools_walk_strip8.png'), url('${humanPath}/base_walk_strip8.png')`;
            sprite.style.animation = `base-walk-cycle 0.8s steps(8) infinite`;
        }

        const moveAnim = fromRight ? 'walk-across-left-flipped' : 'walk-across-right';
        charContainer.style.animation = `${moveAnim} ${speed}s linear forwards`;
        
        // Metadata for interaction
        charContainer.dataset.speed = speed.toString();
        charContainer.dataset.fromRight = fromRight.toString();

        // Interaction logic
        charContainer.style.pointerEvents = 'auto';
        charContainer.style.cursor = 'grab';

        charContainer.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            this.draggedElement = charContainer;
            
            // Reset velocity tracking
            this.lastPointerPos.x = e.clientX;
            this.lastPointerPos.y = e.clientY;
            this.velocity.x = 0;
            this.velocity.y = 0;
            
            // 1. Get current physical position (including any animation or transition)
            const rect = charContainer.getBoundingClientRect();
            
            // 2. Set absolute position to match current visual position
            charContainer.style.left = `${rect.left}px`;
            charContainer.style.top = `${rect.top}px`;
            charContainer.style.bottom = 'auto'; // Remove any relative positioning
            
            // 3. Remove animations and transitions so it's fully manual
            const fromRight = charContainer.dataset.fromRight === 'true';
            charContainer.style.animation = 'none';
            charContainer.style.transition = 'none';
            charContainer.style.transform = fromRight ? 'scale(-1, 1)' : 'none'; // CRITICAL: Keep flip if fromRight
            
            // 4. Record mouse offset relative to this frozen position
            this.dragOffset.x = e.clientX - rect.left;
            this.dragOffset.y = e.clientY - rect.top;
            
            charContainer.classList.add('is-dragged');
            charContainer.style.cursor = 'grabbing';
            charContainer.style.zIndex = '1000';
            
            if (sprite) sprite.style.animationPlayState = 'paused';
        });

        container.appendChild(charContainer);

        // Cleanup only when it actually reaches the screen edge
        const cleanup = () => {
            if (charContainer.parentElement && this.draggedElement !== charContainer) {
                const rect = charContainer.getBoundingClientRect();
                const isOffLeft = rect.right <= 5;
                const isOffRight = rect.left >= window.innerWidth - 5;
                
                if (isOffLeft || isOffRight) {
                    charContainer.remove();
                }
            }
        };
        charContainer.addEventListener('animationend', cleanup);
        charContainer.addEventListener('transitionend', (e) => {
            if (e.propertyName === 'left') cleanup();
        });
    }
}
