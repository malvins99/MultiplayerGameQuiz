// ... (imports remain)

export class QuizPopup {
    scene: Phaser.Scene;
    backdrop: HTMLElement;
    overlay: HTMLElement;
    modal: HTMLElement;
    namePlate: HTMLElement;

    // New Structure
    questionContainer: HTMLElement; // The bordered scrollable box
    questionImage: HTMLImageElement; // Optional image
    questionText: HTMLElement; // Story text

    optionsContainer: HTMLElement;
    enemySpriteContainer: HTMLElement;
    buttonElements: HTMLElement[] = [];

    currentData: any = null;
    isVisibleState: boolean = false;
    onAnswer: (answerIndex: number, btn: HTMLElement) => void;
    currentEnemyType: string = 'skeleton';

    constructor(scene: Phaser.Scene, onAnswer: (answerIndex: number, btn: HTMLElement) => void) {
        this.scene = scene;
        this.onAnswer = onAnswer;

        // Cleanup old styles
        ['quiz-styles', 'rpg-quiz-styles', 'rpg-quiz-styles-v2', 'rpg-quiz-styles-v3'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.remove();
        });

        // Create Backdrop
        this.backdrop = document.createElement('div');
        this.backdrop.className = 'rpg-backdrop hidden';

        // Create Overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'rpg-overlay-v2 hidden';

        // Enemy Sprite Container
        this.enemySpriteContainer = document.createElement('div');
        this.enemySpriteContainer.className = 'rpg-enemy-sprite';
        this.overlay.appendChild(this.enemySpriteContainer);

        // Main Dialogue Box
        this.modal = document.createElement('div');
        this.modal.className = 'rpg-box';

        // Name Plate
        this.namePlate = document.createElement('div');
        this.namePlate.className = 'rpg-nameplate';
        this.namePlate.innerText = 'ENEMY';
        this.modal.appendChild(this.namePlate);

        // --- NEW: Question Container (Bordered, Scrollable) ---
        this.questionContainer = document.createElement('div');
        this.questionContainer.className = 'rpg-question-box';

        // Image Element (Hidden by default)
        this.questionImage = document.createElement('img');
        this.questionImage.className = 'rpg-question-image hidden';
        this.questionContainer.appendChild(this.questionImage);

        // Text Element
        this.questionText = document.createElement('div');
        this.questionText.className = 'rpg-question-text';
        this.questionContainer.appendChild(this.questionText);

        this.modal.appendChild(this.questionContainer);

        // Options Area
        this.optionsContainer = document.createElement('div');
        this.optionsContainer.className = 'rpg-options';
        this.modal.appendChild(this.optionsContainer);

        this.overlay.appendChild(this.modal);
        document.body.appendChild(this.backdrop);
        document.body.appendChild(this.overlay);

        this.injectStyles();
    }

    injectStyles() {
        // ... (Backdrop, Overlay, Enemy Spirte styles remain mostly same, updated Box and Content)
        if (document.getElementById('rpg-quiz-styles-v4')) return;

        const style = document.createElement('style');
        style.id = 'rpg-quiz-styles-v4';
        style.innerHTML = `
            /* ========== BACKDROP ========== */
            .rpg-backdrop {
                position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                background: rgba(0, 0, 0, 0); z-index: 1990;
                transition: background 0.4s ease-out; pointer-events: none;
            }
            .rpg-backdrop.active { background: rgba(0, 0, 0, 0.6); pointer-events: auto; }
            .rpg-backdrop.hidden { display: none; }

            /* ========== OVERLAY ========== */
            .rpg-overlay-v2 {
                position: fixed; bottom: 20px; left: 0; width: 100%;
                display: flex; justify-content: center; align-items: flex-end;
                pointer-events: none; z-index: 2000;
                font-family: "Press Start 2P", monospace; image-rendering: pixelated;
            }
            .rpg-overlay-v2.hidden { display: none; }

            /* ========== ENEMY SPRITE ========== */
            .rpg-enemy-sprite {
                position: absolute;
                left: calc(50% - 480px); bottom: -145px;
                width: 96px; height: 64px;
                transform: scale(8.5); transform-origin: bottom center;
                opacity: 0; transition: opacity 0.4s ease-out, transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                pointer-events: none; image-rendering: pixelated; z-index: 2002;
            }
            .rpg-overlay-v2.active .rpg-enemy-sprite { opacity: 1; transform: scale(8.5); }
            .rpg-enemy-sprite canvas { width: 100%; height: 100%; image-rendering: pixelated; }

            /* ========== DIALOGUE BOX ========== */
            .rpg-box {
                pointer-events: auto;
                width: 95%; max-width: 900px; /* Increased width */
                background-color: #e4d5b7;
                border: 6px solid #4b3d28;
                border-radius: 4px;
                box-shadow: 0 0 0 2px #2e2216, 0 10px 20px rgba(0,0,0,0.5);
                padding: 24px;
                position: relative;
                color: #2e2216;
                transform: translateY(150%);
                transition: transform 0.3s ease-out;
                display: flex; flex-direction: column; gap: 15px;
            }
            .rpg-overlay-v2.active .rpg-box { transform: translateY(0); }

            .rpg-nameplate {
                position: absolute; top: -28px; left: 20px;
                background: #4b3d28; color: #e4d5b7;
                padding: 8px 16px; border: 2px solid #2e2216; border-bottom: none;
                font-size: 14px; text-transform: uppercase;
                border-radius: 4px 4px 0 0; box-shadow: 2px -2px 0 rgba(0,0,0,0.2);
            }

            /* ========== QUESTION CONTENT BOX (Scrollable) ========== */
            .rpg-question-box {
                background: #d0c0a0;
                border: 3px solid #4b3d28; /* Same border as buttons */
                border-radius: 4px;
                padding: 15px;
                max-height: 400px; /* Increased height for scrolling */
                overflow-y: auto; /* Enable scrolling */
                display: flex; flex-direction: column; gap: 15px;
                box-shadow: inset 0 0 10px rgba(0,0,0,0.1);
            }
            
            /* Custom Scrollbar */
            .rpg-question-box::-webkit-scrollbar { width: 10px; }
            .rpg-question-box::-webkit-scrollbar-track { background: #c3b08d; }
            .rpg-question-box::-webkit-scrollbar-thumb { background: #4b3d28; border: 2px solid #c3b08d; border-radius: 4px; }

            .rpg-question-image {
                max-width: 100%;
                height: auto;
                border: 2px solid #8f7e65;
                border-radius: 2px;
                display: block; margin: 0 auto;
            }
            .rpg-question-image.hidden { display: none; }

            .rpg-question-text {
                font-size: 16px; /* Slightly smaller for more text */
                line-height: 1.6;
                white-space: pre-wrap;
            }

            /* ========== OPTIONS (Smaller Buttons) ========== */
            .rpg-options {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px; /* Reduced gap */
                margin-top: 5px;
            }

            .rpg-btn {
                background: #dcc8a4;
                border: 3px solid #4b3d28;
                padding: 10px 15px; /* Reduced padding */
                font-family: inherit; font-size: 14px; /* Smaller font */
                color: #2e2216; cursor: pointer;
                text-align: left; transition: all 0.1s;
                position: relative; border-radius: 4px;
                min-height: 50px; display: flex; align-items: center;
            }
            .rpg-btn:hover { background: #eaddc5; transform: translateY(-2px); box-shadow: 0 4px 0 #2e2216; }
            .rpg-btn:active { background: #c3b08d; transform: translateY(2px); box-shadow: none; }

            .hidden { display: none !important; }
            
            /* Feedback Popup */
            .feedback-popup {
                position: fixed; z-index: 2100; pointer-events: none;
                width: 64px; height: 64px; image-rendering: pixelated;
                animation: floatUpFade 1.5s forwards ease-out;
            }
            @keyframes floatUpFade {
                0% { transform: translateY(0) scale(0.8); opacity: 0; }
                10% { transform: translateY(-10px) scale(1.1); opacity: 1; }
                100% { transform: translateY(-80px) scale(1); opacity: 0; }
            }

            /* Knockout Animations */
            @keyframes knockoutFlyRight {
                0% { transform: translateY(0) rotate(0deg); }
                15% { transform: translateY(-80px) translateX(20px) rotate(15deg); }
                100% { transform: translateY(800px) translateX(100px) rotate(45deg); opacity: 0; }
            }
            @keyframes knockoutFlyLeft {
                0% { transform: translateY(0) rotate(0deg); }
                15% { transform: translateY(-80px) translateX(-20px) rotate(-15deg); }
                100% { transform: translateY(800px) translateX(-100px) rotate(-45deg); opacity: 0; }
            }
            .rpg-box.knockout-right { animation: knockoutFlyRight 0.8s forwards; }
            .rpg-box.knockout-left { animation: knockoutFlyLeft 0.8s forwards; }
            
            @keyframes buttonImpact {
                0% { transform: scale(1); } 50% { transform: scale(0.9); background: #ff5555; } 100% { transform: scale(1); }
            }
            .rpg-btn.impact { animation: buttonImpact 0.2s; }
            
            /* Media Queries */
            @media (max-width: 1024px) {
                .rpg-enemy-sprite { left: 5%; transform: scale(1.2); }
                .rpg-overlay-v2.active .rpg-enemy-sprite { transform: scale(1.2) translateY(-20px); }
            }
            @media (max-width: 768px) { .rpg-enemy-sprite { display: none; } }
        `;
        document.head.appendChild(style);
    }

    show(questionData: any, enemyName: string = "ENEMY") {
        if (!questionData) return;
        this.currentData = questionData;

        // Reset UI
        this.namePlate.innerText = enemyName;
        this.optionsContainer.innerHTML = '';
        this.buttonElements = [];
        this.modal.classList.remove('knockout-left', 'knockout-right');

        // Enemy Sprite
        this.currentEnemyType = enemyName.toLowerCase().includes('goblin') ? 'goblin' : 'skeleton';
        this.renderEnemySprite();

        // --- Render Content ---
        // Image
        if (questionData.image) {
            this.questionImage.src = questionData.image;
            this.questionImage.classList.remove('hidden');
        } else {
            this.questionImage.classList.add('hidden');
        }

        // Text
        this.questionText.innerText = questionData.pertanyaan;

        // Reset Scroll
        this.questionContainer.scrollTop = 0;

        // Render Options immediately (no paging)
        this.renderOptions();

        // Show Animation
        this.backdrop.classList.remove('hidden');
        void this.backdrop.offsetWidth;
        this.backdrop.classList.add('active');

        this.isVisibleState = true;
        this.overlay.classList.remove('hidden');
        void this.modal.offsetWidth;
        this.overlay.classList.add('active');
    }

    renderEnemySprite() {
        // ... (Same logic as before)
        this.enemySpriteContainer.innerHTML = '';
        const canvas = document.createElement('canvas');
        canvas.width = 96; canvas.height = 64;
        canvas.style.width = '96px'; canvas.style.height = '64px';
        this.enemySpriteContainer.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const spriteKey = this.currentEnemyType + '_idle';
        const texture = this.scene.textures.get(spriteKey);

        if (!texture || texture.key === '__MISSING') return;

        const source = texture.getSourceImage() as HTMLImageElement;
        const frameWidth = 96; const frameHeight = 64;
        const totalFrames = Math.floor(source.width / frameWidth);
        let currentFrame = 0; const fps = 8; let lastTime = 0;

        const animate = (time: number) => {
            if (!this.isVisibleState) return;
            if (time - lastTime > 1000 / fps) {
                lastTime = time;
                currentFrame = (currentFrame + 1) % totalFrames;
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(source, currentFrame * frameWidth, 0, frameWidth, frameHeight, 0, 0, frameWidth, frameHeight);
            }
            if (this.isVisibleState) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }

    renderOptions() {
        const labels = ['A', 'B', 'C', 'D'];

        // Helper to get option text safely
        const options = [
            this.currentData.jawaban_a,
            this.currentData.jawaban_b,
            this.currentData.jawaban_c,
            this.currentData.jawaban_d
        ];

        options.forEach((opt: string, idx: number) => {
            const btn = document.createElement('button');
            btn.className = 'rpg-btn';
            btn.dataset.idx = idx.toString();
            btn.innerText = `${labels[idx]}. ${opt}`;

            this.buttonElements[idx] = btn;

            btn.onpointerup = (e) => {
                e.stopPropagation();
                console.log(`QuizPopup: Option ${idx} selected.`);
                this.onAnswer(idx, btn);
            };
            btn.onpointerdown = (e) => e.stopPropagation();

            this.optionsContainer.appendChild(btn);
        });
    }

    showFeedback(isCorrect: boolean, button: HTMLElement) {
        // ... (Same feedback logic)
        button.classList.add('impact');
        const icon = document.createElement('img');
        icon.src = isCorrect ? '/assets/ui/confirm.png' : '/assets/ui/cancel.png';
        icon.className = 'feedback-popup';

        const rect = button.getBoundingClientRect();
        icon.style.left = `${rect.left + (rect.width / 2) - 32}px`;
        icon.style.top = `${rect.top}px`;
        document.body.appendChild(icon);

        if (!isCorrect) {
            const idx = parseInt(button.dataset.idx || '0');
            const isLeftColumn = (idx === 0 || idx === 2);
            this.modal.classList.add(isLeftColumn ? 'knockout-right' : 'knockout-left');
        }

        setTimeout(() => {
            icon.remove();
            button.classList.remove('impact');
            this.hide();
        }, isCorrect ? 1200 : 800);
    }

    hide() {
        this.backdrop.classList.remove('active');
        this.overlay.classList.remove('active');
        this.isVisibleState = false;

        setTimeout(() => {
            if (!this.isVisibleState) {
                this.overlay.classList.add('hidden');
                this.backdrop.classList.add('hidden');
                this.modal.classList.remove('knockout-left', 'knockout-right');
            }
        }, 400);
    }

    isVisible() {
        return this.isVisibleState;
    }
}
