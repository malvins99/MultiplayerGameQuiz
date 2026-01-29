
import Phaser from 'phaser';

export class QuizPopup {
    scene: Phaser.Scene;
    overlay: HTMLElement;
    modal: HTMLElement;
    namePlate: HTMLElement;
    contentContainer: HTMLElement;
    textElement: HTMLElement;
    arrowElement: HTMLElement;
    optionsContainer: HTMLElement;

    // Button references
    buttonElements: HTMLElement[] = [];

    // State properties
    currentData: any = null;
    pages: string[] = [];
    currentPage: number = 0;
    fullText: string = "";
    isVisibleState: boolean = false;
    onAnswer: (answerIndex: number, btn: HTMLElement) => void;

    // Callback now includes the button element for positioning
    constructor(scene: Phaser.Scene, onAnswer: (answerIndex: number, btn: HTMLElement) => void) {
        this.scene = scene;
        this.onAnswer = onAnswer;

        // --- CLEANUP OLD STYLES ---
        const oldStyle = document.getElementById('quiz-styles');
        if (oldStyle) oldStyle.remove();
        const oldRpgStyle = document.getElementById('rpg-quiz-styles');
        if (oldRpgStyle) oldRpgStyle.remove();

        // --- Create DOM Elements ---
        this.overlay = document.createElement('div');
        this.overlay.className = 'rpg-overlay-v2 hidden';

        // Main Dialogue Box
        this.modal = document.createElement('div');
        this.modal.className = 'rpg-box';

        // Name Plate (Top-Left)
        this.namePlate = document.createElement('div');
        this.namePlate.className = 'rpg-nameplate';
        this.namePlate.innerText = 'ENEMY';
        this.modal.appendChild(this.namePlate);

        // Content Area (Text + Arrow)
        this.contentContainer = document.createElement('div');
        this.contentContainer.className = 'rpg-content';

        this.textElement = document.createElement('div');
        this.textElement.className = 'rpg-text';
        this.contentContainer.appendChild(this.textElement);

        this.arrowElement = document.createElement('div');
        this.arrowElement.className = 'rpg-arrow';
        this.arrowElement.innerHTML = '&#9660;'; // Down Triangle
        this.contentContainer.appendChild(this.arrowElement);

        this.modal.appendChild(this.contentContainer);

        // Options Area (Grid)
        this.optionsContainer = document.createElement('div');
        this.optionsContainer.className = 'rpg-options hidden';
        this.modal.appendChild(this.optionsContainer);

        this.overlay.appendChild(this.modal);
        document.body.appendChild(this.overlay);

        // --- Event Listeners ---
        // Click on box advances text
        this.modal.onclick = (e) => {
            // If options are showing, ignore box clicks (let buttons handle it)
            if (!this.optionsContainer.classList.contains('hidden')) return;

            this.nextPage();
        };

        this.injectStyles();
    }

    injectStyles() {
        if (document.getElementById('rpg-quiz-styles-v2')) return;

        const style = document.createElement('style');
        style.id = 'rpg-quiz-styles-v2';
        style.innerHTML = `
            .rpg-overlay-v2 {
                position: fixed;
                bottom: 20px;
                left: 0;
                width: 100%;
                display: flex;
                justify-content: center;
                pointer-events: none; /* Let clicks pass through outside box */
                z-index: 2000;
                font-family: "Press Start 2P", monospace;
                image-rendering: pixelated;
            }

            .rpg-overlay-v2.hidden {
                display: none;
            }

            .rpg-box {
                pointer-events: auto;
                width: 90%;
                max-width: 800px;
                background-color: #e4d5b7; /* Parchment/Tan */
                border: 6px solid #4b3d28; /* Dark Wood */
                border-radius: 4px;
                box-shadow: 
                    0 0 0 2px #2e2216, 
                    0 10px 20px rgba(0,0,0,0.5);
                padding: 24px;
                position: relative;
                color: #2e2216;
                /* Slide Up Animation */
                transform: translateY(150%);
                transition: transform 0.3s ease-out;
            }

            .rpg-overlay-v2.active .rpg-box {
                transform: translateY(0);
            }

            .rpg-nameplate {
                position: absolute;
                top: -28px;
                left: 20px;
                background: #4b3d28;
                color: #e4d5b7;
                padding: 8px 16px;
                border: 2px solid #2e2216;
                border-bottom: none;
                font-size: 14px;
                text-transform: uppercase;
                border-radius: 4px 4px 0 0;
                box-shadow: 2px -2px 0 rgba(0,0,0,0.2);
            }

            .rpg-content {
                min-height: 80px;
                position: relative;
                display: flex;
                flex-direction: column;
            }

            .rpg-text {
                font-size: 18px;
                line-height: 1.8;
                white-space: pre-wrap;
                margin-bottom: 30px;
            }

            .rpg-arrow {
                position: absolute;
                bottom: 0;
                right: 10px;
                font-size: 24px;
                color: #4b3d28;
                animation: bounce 1s infinite alternate;
                cursor: pointer;
            }

            @keyframes bounce {
                from { transform: translateY(0); }
                to { transform: translateY(5px); }
            }

            .rpg-options {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
                margin-top: 10px;
                border-top: 2px dashed #4b3d28;
                padding-top: 15px;
            }

            .rpg-btn {
                background: #dcc8a4;
                border: 3px solid #4b3d28;
                padding: 15px;
                font-family: inherit;
                font-size: 16px;
                color: #2e2216;
                cursor: pointer;
                text-align: left;
                transition: all 0.1s;
                position: relative;
                border-radius: 4px;
            }

            .rpg-btn:hover {
                background: #eaddc5;
                transform: translateY(-2px);
                box-shadow: 0 4px 0 #2e2216;
            }

            .rpg-btn:active {
                background: #c3b08d;
                transform: translateY(2px);
                box-shadow: none;
            }

            .hidden {
                display: none !important;
            }

            /* Feedback Popup Animation */
            .feedback-popup {
                position: fixed;
                z-index: 2100;
                pointer-events: none;
                width: 64px;
                height: 64px;
                image-rendering: pixelated;
                animation: floatUpFade 1.5s forwards ease-out;
            }

            @keyframes floatUpFade {
                0% {
                    transform: translateY(0) scale(0.8);
                    opacity: 0;
                }
                10% {
                    transform: translateY(-10px) scale(1.1);
                    opacity: 1;
                }
                100% {
                    transform: translateY(-80px) scale(1);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }

    show(questionData: any, enemyName: string = "ENEMY") {
        if (!questionData) return;
        this.currentData = questionData;

        // Reset State
        this.namePlate.innerText = enemyName;
        this.optionsContainer.classList.add('hidden');
        this.optionsContainer.innerHTML = ''; // Clear buttons
        this.buttonElements = [];
        this.currentPage = 0;

        // Paging Logic (Split by ~100 chars or newlines if needed)
        this.fullText = questionData.question;
        const maxChars = 120; // Approx fit
        this.pages = this.splitText(this.fullText, maxChars);

        // Show first page
        this.renderPage();

        // Show Overlay
        this.isVisibleState = true;
        this.overlay.classList.remove('hidden');

        // Trigger reflow to enable transition
        void this.modal.offsetWidth;

        this.overlay.classList.add('active');
    }

    splitText(text: string, limit: number): string[] {
        if (text.length <= limit) return [text];
        const chunks = [];
        let remaining = text;
        while (remaining.length > 0) {
            if (remaining.length <= limit) {
                chunks.push(remaining);
                break;
            }
            let chunk = remaining.substr(0, limit);
            const lastSpace = chunk.lastIndexOf(' ');
            if (lastSpace > 0) {
                chunk = chunk.substr(0, lastSpace);
                remaining = remaining.substr(lastSpace + 1);
            } else {
                remaining = remaining.substr(limit);
            }
            chunks.push(chunk);
        }
        return chunks;
    }

    renderPage() {
        this.textElement.innerText = this.pages[this.currentPage];

        // Check if last page
        if (this.currentPage >= this.pages.length - 1) {
            this.arrowElement.classList.add('hidden'); // Hide arrow
            this.renderOptions();
            this.optionsContainer.classList.remove('hidden');
        } else {
            this.arrowElement.classList.remove('hidden');
            this.optionsContainer.classList.add('hidden');
        }
    }

    nextPage() {
        if (this.currentPage < this.pages.length - 1) {
            this.currentPage++;
            this.renderPage();
        }
    }

    renderOptions() {
        if (this.optionsContainer.hasChildNodes()) return; // Already rendered

        const labels = ['A', 'B', 'C', 'D'];
        this.currentData.options.forEach((opt: string, idx: number) => {
            const btn = document.createElement('button');
            btn.className = 'rpg-btn';
            btn.innerText = `${labels[idx]}. ${opt}`;
            btn.style.zIndex = '10'; // Ensure above container

            // Store reference
            this.buttonElements[idx] = btn;

            btn.onpointerup = (e) => {
                e.stopPropagation(); // Prevent box click
                console.log(`QuizPopup: Option ${idx} selected.`);
                // Pass button element for feedback positioning
                this.onAnswer(idx, btn);

                // Do NOT hide immediately -> waiting for showFeedback() call or external hide
                // this.hide(); 
            };
            // Also block pointerdown to prevent click-through to map if needed, 
            // though overlay handles that.
            btn.onpointerdown = (e) => e.stopPropagation();

            this.optionsContainer.appendChild(btn);
        });
    }

    showFeedback(isCorrect: boolean, button: HTMLElement) {
        // Create feedback icon
        const icon = document.createElement('img');
        icon.src = isCorrect ? 'assets/ui/confirm.png' : 'assets/ui/cancel.png'; // Assuming local path
        icon.className = 'feedback-popup';

        // Position it relative to the button
        const rect = button.getBoundingClientRect();

        // Center horizontally on button, position slightly above
        const left = rect.left + (rect.width / 2) - 32; // 32 is half of 64px width
        const top = rect.top; // Start at top of button

        icon.style.left = `${left}px`;
        icon.style.top = `${top}px`;

        document.body.appendChild(icon);

        // Remove after animation
        setTimeout(() => {
            icon.remove();
            // Hide popup after feedback finishes
            this.hide();
        }, 1200);
    }

    hide() {
        this.overlay.classList.remove('active');
        this.isVisibleState = false;
        setTimeout(() => {
            if (!this.isVisibleState) this.overlay.classList.add('hidden');
        }, 300);
    }

    isVisible() {
        return this.isVisibleState;
    }
}
