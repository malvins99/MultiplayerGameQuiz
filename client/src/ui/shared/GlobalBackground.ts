/**
 * GlobalBackground — Shared background component for all green-themed pages.
 * Provides: gradient, pixel grid, 3-layer pixel clouds, firefly particles, walking characters.
 */
export class GlobalBackground {
    private static spawnerIntervals: Map<string, ReturnType<typeof setInterval>> = new Map();
    private static draggedElement: HTMLElement | null = null;
    private static dragOffset = { x: 0, y: 0 };
    private static lastPointerPos = { x: 0, y: 0 };
    private static velocity = { x: 0, y: 0 };
    private static isInitialized = false;
    private static physicsLoopId: any = null;

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

                <!-- Diverse Pixel Clouds -->
                <div class="absolute top-[10%] opacity-20 animate-[drift_80s_linear_infinite]" style="transform: scale(1.0); left: -10%;">
                    <div class="relative w-10 h-3 bg-white"><div class="absolute -top-1 left-2 w-3 h-1 bg-white"></div></div>
                </div>
                <div class="absolute top-[45%] opacity-15 animate-[drift_95s_linear_infinite_reverse]" style="transform: scale(0.8); left: 80%;">
                    <div class="relative w-12 h-4 bg-[#D3EE98]"><div class="absolute -top-2 left-3 w-4 h-2 bg-[#D3EE98]"></div></div>
                </div>
                <!-- Mid Layer -->
                <div class="absolute top-[25%] opacity-40 animate-[drift_45s_linear_infinite]" style="transform: scale(1.8); left: 15%;">
                    <div class="relative w-16 h-5 bg-[#D3EE98]"><div class="absolute -top-3 left-4 w-6 h-3 bg-[#D3EE98]"></div><div class="absolute -top-5 left-8 w-4 h-5 bg-[#D3EE98]"></div></div>
                </div>
                <div class="absolute top-[65%] opacity-35 animate-[drift_55s_linear_infinite_reverse]" style="transform: scale(1.5); left: 60%;">
                    <div class="relative w-14 h-4 bg-white"><div class="absolute -top-2 left-4 w-5 h-2 bg-white"></div><div class="absolute -top-4 left-7 w-3 h-4 bg-white"></div></div>
                </div>
                <!-- Front Layer -->
                <div class="absolute top-[40%] opacity-30 animate-[drift_35s_linear_infinite]" style="transform: scale(2.5); left: -20%;">
                    <div class="relative w-12 h-4 bg-[#FEFF9F]"><div class="absolute -top-2 left-2 w-4 h-2 bg-[#FEFF9F]"></div><div class="absolute -top-4 left-5 w-4 h-4 bg-[#FEFF9F]"></div></div>
                </div>

                <!-- Floating Particles -->
                <div class="firefly !bg-[#FEFF9F] !shadow-[0_0_15px_rgba(254,255,159,0.9)]" style="top: 25%; left: 15%; animation-delay: 0s;"></div>
                <div class="firefly !bg-white !shadow-[0_0_15px_rgba(255,255,255,0.8)]" style="top: 65%; left: 80%; animation-delay: 1.5s;"></div>
                <div class="firefly !bg-[#D3EE98] !shadow-[0_0_15px_rgba(211,238,152,0.9)]" style="top: 45%; left: 45%; animation-delay: 3s;"></div>
            </div>

            <!-- Walking Characters Container -->
            <div id="${id}-walking-characters-container" class="absolute inset-0 z-40 overflow-hidden pointer-events-none"></div>
        `;
    }

    private static initGlobalListeners() {
        if (this.isInitialized) return;
        this.isInitialized = true;

        this.startPhysicsLoop();

        // SUPER LIGHTWEIGHT OPTIMIZATION: Pause everything when tab is hidden
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                if (this.physicsLoopId) {
                    clearInterval(this.physicsLoopId);
                    this.physicsLoopId = null;
                }
            } else {
                this.startPhysicsLoop();
            }
        });

        window.addEventListener('resize', () => {
            const characters = document.querySelectorAll('.walking-char-container:not(.is-dragged)');
            characters.forEach((char: any) => {
                const speed = parseFloat(char.dataset.speed || '25');
                const fromRight = char.dataset.fromRight === 'true';
                
                if (char.style.transition.includes('left')) {
                    const rect = char.getBoundingClientRect();
                    const targetLeft = fromRight ? -360 : window.innerWidth;
                    const totalDist = window.innerWidth + 360;
                    const remainingDist = Math.abs(targetLeft - rect.left);
                    const remainingTime = (remainingDist / totalDist) * speed;

                    if (char.dataset.floorTop) {
                        char.style.transition = `left ${remainingTime}s linear, top 0.3s ease-out`;
                        char.style.top = `${char.dataset.floorTop}px`;
                        char.style.bottom = 'auto';
                    } else {
                        char.style.transition = `left ${remainingTime}s linear, bottom 0.3s ease-out`;
                        char.style.bottom = '-90px';
                        char.style.top = 'auto';
                    }
                    char.style.left = `${targetLeft}px`;
                }
            });
        });

        window.addEventListener('pointermove', (e) => {
            if (!this.draggedElement) return;
            this.velocity.x = e.clientX - this.lastPointerPos.x;
            this.velocity.y = e.clientY - this.lastPointerPos.y;
            this.lastPointerPos.x = e.clientX;
            this.lastPointerPos.y = e.clientY;

            const x = e.clientX - this.dragOffset.x;
            const y = e.clientY - this.dragOffset.y;
            this.draggedElement.style.left = `${x}px`;
            this.draggedElement.style.top = `${y}px`;
            this.draggedElement.style.bottom = 'auto';
        });

        window.addEventListener('pointerup', () => {
            if (!this.draggedElement) return;
            const char = this.draggedElement;
            char.classList.remove('is-dragged');
            char.style.cursor = 'grab';
            const fromRight = char.dataset.fromRight === 'true';
            
            const sprite = char.querySelector('.walking-char-sprite') as HTMLElement;
            if (sprite) sprite.style.animationPlayState = 'running';
            char.style.transform = fromRight ? 'scale(-1, 1)' : 'none';
            
            const throwX = this.velocity.x * 20;
            const throwY = this.velocity.y < 0 ? this.velocity.y * 10 : 0;
            const rect = char.getBoundingClientRect();
            const currentLeft = rect.left + rect.width / 2;
            const currentTop = rect.top + rect.height;
            
            const targetX = rect.left + throwX;
            let landingTop = window.innerHeight - 150;
            let onPlatform = false;
            
            const platforms = document.querySelectorAll('.game-platform');
            let bestPlatform: HTMLElement | null = null;
            platforms.forEach((p: any) => {
                const pRect = p.getBoundingClientRect();
                if (currentLeft >= pRect.left && currentLeft <= pRect.right) {
                    if (currentTop <= pRect.top + 30) {
                        if (bestPlatform === null || pRect.top < bestPlatform.getBoundingClientRect().top) {
                           bestPlatform = p;
                        }
                    }
                }
            });

            if (bestPlatform) {
                landingTop = (bestPlatform as HTMLElement).getBoundingClientRect().top - 150; 
                onPlatform = true;
            }
            
            if (throwY < -10) {
                char.style.transition = 'top 0.4s cubic-bezier(0.33, 1, 0.68, 1), left 1.2s cubic-bezier(0.1, 0, 0.2, 1)';
                char.style.left = `${targetX}px`;
                char.style.top = `${rect.top + throwY}px`;
                setTimeout(() => {
                    if (char.parentElement && this.draggedElement !== char) {
                        char.style.transition = 'top 0.8s cubic-bezier(0.5, 0, 0.75, 0), left 0.8s linear';
                        char.style.top = `${landingTop}px`;
                    }
                }, 400);
                setTimeout(() => { this.resumeWalking(char, targetX, onPlatform ? landingTop : undefined); }, 1200);
            } else {
                char.style.transition = 'top 0.8s cubic-bezier(0.4, 0, 0.2, 1), left 0.8s cubic-bezier(0.1, 0, 0.2, 1)';
                char.style.left = `${targetX}px`;
                char.style.top = `${landingTop}px`;
                setTimeout(() => { this.resumeWalking(char, targetX, onPlatform ? landingTop : undefined); }, 800);
            }
            this.draggedElement = null;
        });
    }

    private static getPerformanceSettings() {
        // Simple detection: check CPU cores and screen size
        const isLowEnd = (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) || 
                         (window.innerWidth < 768); 
        
        return {
            spawnInterval: isLowEnd ? 4000 : 2000,
            maxChars: isLowEnd ? 4 : 10,
            physicsInterval: isLowEnd ? 250 : 100
        };
    }

    static startCharacterSpawner(id: string): void {
        this.initGlobalListeners();
        if (this.spawnerIntervals.has(id)) return;
        
        const settings = this.getPerformanceSettings();
        const container = document.getElementById(`${id}-walking-characters-container`);
        if (!container) return;

        this.checkAndSpawn(container);
        const interval = setInterval(() => { 
            this.checkAndSpawn(container); 
        }, settings.spawnInterval);

        this.spawnerIntervals.set(id, interval);
        
        // Restart physics loop with adaptive interval if already running
        if (this.physicsLoopId) {
            clearInterval(this.physicsLoopId);
            this.physicsLoopId = null;
            this.startPhysicsLoop();
        }
    }

    static stopCharacterSpawner(id: string): void {
        const interval = this.spawnerIntervals.get(id);
        if (interval) { clearInterval(interval); this.spawnerIntervals.delete(id); }
    }

    private static checkAndSpawn(container: HTMLElement): void {
        const settings = this.getPerformanceSettings();
        const chars = container.querySelectorAll('.walking-char-container');
        if (chars.length >= settings.maxChars) return;
        
        const types: ('human' | 'skeleton' | 'goblin')[] = ['human', 'skeleton', 'goblin'];
        this.spawnCharacter(container, types[Math.floor(Math.random() * types.length)]);
    }

    private static startPhysicsLoop() {
        if (this.physicsLoopId) return;
        
        const settings = this.getPerformanceSettings();
        this.physicsLoopId = setInterval(() => {
            const characters = document.querySelectorAll('.walking-char-container:not(.is-dragged)');
            characters.forEach((char: any) => {
                const floorTopAttr = char.dataset.floorTop;
                if (!floorTopAttr) return;

                const rect = char.getBoundingClientRect();
                const currentLeft = rect.left + rect.width / 2;
                const platformY = parseFloat(floorTopAttr) + 150;

                const platforms = document.querySelectorAll('.game-platform');
                let stillOnPlatform = false;
                platforms.forEach((p: any) => {
                    const pRect = p.getBoundingClientRect();
                    if (currentLeft >= pRect.left && currentLeft <= pRect.right) {
                        if (Math.abs(pRect.top - platformY) < 10) stillOnPlatform = true;
                    }
                });

                if (!stillOnPlatform) this.fallToFloor(char);
            });
        }, settings.physicsInterval);
    }

    private static fallToFloor(char: HTMLElement) {
        const rect = char.getBoundingClientRect();
        // 1. Freeze current position
        char.style.transition = 'none';
        char.style.left = `${rect.left}px`;
        char.style.top = `${rect.top}px`;
        
        // Reflow
        char.offsetHeight;
        
        // 2. Clear platform data
        delete char.dataset.floorTop;
        
        // 3. Trigger fall
        const floorTop = window.innerHeight - 150;
        const fromRight = char.dataset.fromRight === 'true';
        const forwardMomentum = fromRight ? -40 : 40;
        
        char.style.transition = 'top 0.5s cubic-bezier(0.47, 0, 0.745, 0.715), left 0.5s linear';
        char.style.top = `${floorTop}px`;
        char.style.left = `${rect.left + forwardMomentum}px`;

        setTimeout(() => {
            if (char.parentElement && !char.classList.contains('is-dragged')) {
                this.resumeWalking(char, rect.left + forwardMomentum);
            }
        }, 500);
    }

    private static resumeWalking(char: HTMLElement, lastTargetX: number, currentTop?: number) {
        if (!char.parentElement) return;
        
        const speed = parseFloat(char.dataset.speed || '25');
        const fromRight = char.dataset.fromRight === 'true';
        const rect = char.getBoundingClientRect();
        
        const targetLeft = fromRight ? -360 : window.innerWidth;
        const totalDist = window.innerWidth + 360;
        const remainingDist = Math.abs(targetLeft - rect.left);
        const remainingTime = (remainingDist / totalDist) * speed;

        char.style.transition = `left ${remainingTime}s linear, top 0.3s ease-out`;
        
        if (currentTop !== undefined) {
            char.style.top = `${currentTop}px`;
            char.style.bottom = 'auto';
            char.dataset.floorTop = currentTop.toString();
        } else {
            char.style.top = 'auto';
            char.style.bottom = '-90px'; 
            delete char.dataset.floorTop;
        }
        
        char.style.left = `${targetLeft}px`;
        char.style.transform = fromRight ? 'scale(-1, 1)' : 'none';
        
        const sprite = char.querySelector('.walking-char-sprite') as HTMLElement;
        if (sprite) sprite.style.animationPlayState = 'running';
    }

    private static spawnCharacter(container: HTMLElement, type: 'human' | 'skeleton' | 'goblin' = 'human'): void {
        const charContainer = document.createElement('div');
        charContainer.className = 'walking-char-container';
        charContainer.setAttribute('data-type', type);
        charContainer.style.pointerEvents = 'none';

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

        // Create a hit-box for dragging that is smaller than the 360x240 container
        const hitBox = document.createElement('div');
        hitBox.className = 'char-hit-box';
        Object.assign(hitBox.style, {
            position: 'absolute',
            bottom: '0',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '120px',
            height: '180px',
            pointerEvents: 'auto',
            cursor: 'grab',
            zIndex: '10'
        });
        charContainer.appendChild(hitBox);

        hitBox.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            this.draggedElement = charContainer;
            this.lastPointerPos = { x: e.clientX, y: e.clientY };
            this.velocity = { x: 0, y: 0 };
            const rect = charContainer.getBoundingClientRect();
            charContainer.style.left = `${rect.left}px`;
            charContainer.style.top = `${rect.top}px`;
            charContainer.style.bottom = 'auto';
            charContainer.style.animation = 'none';
            charContainer.style.transition = 'none';
            charContainer.style.transform = fromRight ? 'scale(-1, 1)' : 'none';
            this.dragOffset = { x: e.clientX - rect.left, y: e.clientY - rect.top };
            charContainer.classList.add('is-dragged');
            charContainer.style.zIndex = '1000';
            hitBox.style.cursor = 'grabbing';
            if (sprite) sprite.style.animationPlayState = 'paused';
            
            // Re-capture pointer on the hitBox
            hitBox.setPointerCapture(e.pointerId);
        });

        const moveAnim = fromRight ? 'walk-across-left-flipped' : 'walk-across-right';
        charContainer.style.animation = `${moveAnim} ${speed}s linear forwards`;
        charContainer.dataset.speed = speed.toString();
        charContainer.dataset.fromRight = fromRight.toString();

        container.appendChild(charContainer);
        const cleanup = () => {
            if (charContainer.parentElement && this.draggedElement !== charContainer) {
                const rect = charContainer.getBoundingClientRect();
                if (rect.right <= -100 || rect.left >= window.innerWidth + 100) charContainer.remove();
            }
        };
        charContainer.addEventListener('animationend', cleanup);
        charContainer.addEventListener('transitionend', (e) => { if (e.propertyName === 'left') cleanup(); });
    }
}
