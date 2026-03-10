export class CharacterSelectPopup {
    private overlay!: HTMLElement;
    private popup!: HTMLElement;
    private bigPreview!: HTMLElement;
    private grid!: HTMLElement;
    private okBtn!: HTMLElement;

    private selectedHairId: number = 0;
    private onSelect: (hairId: number) => void;
    private onClose: () => void;
    private hairOptions: { id: number, name: string, idleKey: string }[];
    private isVisible: boolean = false;
    private nameLabel!: HTMLElement;

    constructor(hairOptions: any[], onSelect: (id: number) => void, onClose: () => void) {
        this.hairOptions = hairOptions;
        this.onSelect = onSelect;
        this.onClose = onClose;

        this.createDOM();
    }

    private createDOM() {
        // Wrapper - centered modal, removing "floating" issues
        this.overlay = document.createElement('div');
        this.overlay.className = 'fixed inset-0 bg-black/80 z-50 hidden opacity-0 transition-opacity duration-300 flex items-center justify-center';

        // Popup Card - WIDER (max-w-4xl), Rectangular look
        // Increased max-width significantly
        // Popup Card - WIDER (max-w-4xl), Rectangular look
        // Increased max-width significantly
        this.popup = document.createElement('div');
        this.popup.className = 'bg-[#1a1a20] border-2 border-white/20 w-[95%] max-w-4xl rounded-xl md:rounded-2xl p-4 md:p-8 max-h-[95vh] overflow-y-auto transform translate-y-10 transition-transform duration-300 flex flex-col gap-4 md:gap-6 shadow-2xl relative';

        // Content: Left (Big Preview) | Right (Grid)
        const content = document.createElement('div');
        content.className = 'flex-1 flex flex-col md:flex-row gap-4 md:gap-8 overflow-hidden';

        // LEFT COLUMN (Preview Box + Name) - Increased width
        const leftContainer = document.createElement('div');
        leftContainer.className = 'flex flex-col gap-2 md:gap-4 items-center justify-center shrink-0 w-full md:w-80';

        // Preview Box - Wider Rectangle (w-full of leftContainer)
        const leftCol = document.createElement('div');
        leftCol.className = 'bg-black/40 border-2 border-white/10 rounded-xl md:rounded-2xl relative flex items-center justify-center overflow-hidden w-full h-[180px] md:h-[280px]';

        const isMobile = window.innerWidth < 768;
        const mainScale = isMobile ? 'scale(3.5)' : 'scale(5)';

        // We need a container for the sprites
        // Base Character
        const baseSprite = document.createElement('div');
        baseSprite.className = 'absolute w-[96px] h-[64px]';
        baseSprite.style.backgroundImage = `url('/assets/base_idle_strip9.png')`;
        baseSprite.style.backgroundSize = '864px 64px'; // 9 frames * 96
        baseSprite.style.imageRendering = 'pixelated';
        baseSprite.style.transform = mainScale; // Keep scale visible
        baseSprite.style.animation = 'play-idle 1s steps(9) infinite';

        // Hair Overlay
        this.bigPreview = document.createElement('div');
        this.bigPreview.className = 'absolute w-[96px] h-[64px]';
        this.bigPreview.style.backgroundSize = '864px 64px';
        this.bigPreview.style.imageRendering = 'pixelated';
        this.bigPreview.style.transform = mainScale;
        this.bigPreview.style.animation = 'play-idle 1s steps(9) infinite';

        // Style Name Label
        this.nameLabel = document.createElement('div');
        this.nameLabel.className = 'text-white font-bold uppercase tracking-widest text-lg font-["Retro_Gaming"] text-center mt-2';
        this.nameLabel.innerText = 'DEFAULT';

        // Add style for animation if not exists
        if (!document.getElementById('anim-style-idle')) {
            const style = document.createElement('style');
            style.id = 'anim-style-idle';
            style.innerHTML = `
                @keyframes play-idle { from { background-position: 0 0; } to { background-position: -864px 0; } }
            `;
            document.head.appendChild(style);
        }

        leftCol.appendChild(baseSprite);
        leftCol.appendChild(this.bigPreview);

        leftContainer.appendChild(leftCol);
        leftContainer.appendChild(this.nameLabel);

        // RIGHT: Grid
        const rightCol = document.createElement('div');
        rightCol.className = 'flex-1 flex flex-col min-h-[300px]';

        const scrollArea = document.createElement('div');
        // Grid cols 3, but items will be wide rectangles
        scrollArea.className = 'flex-1 overflow-y-auto custom-scrollbar grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4 content-start';
        this.grid = scrollArea;

        rightCol.appendChild(scrollArea);

        // Content: Grid (Left) | Preview (Right)
        // User requested: "gambar profile karakter... [pindahkan ke kanan]" (interpreted from "bukan di kanan nya" context implies swap)
        content.appendChild(rightCol);     // Grid now on Left
        content.appendChild(leftContainer); // Preview now on Right

        // Footer: OK Button (Bottom Right)
        const footer = document.createElement('div');
        footer.className = 'flex justify-end pt-2';

        this.okBtn = document.createElement('button');
        this.okBtn.style.cssText = `
            padding: 12px 40px;
            background: #9DC08B;
            border-radius: 12px;
            color: black;
            font-family: 'Retro Gaming';
            text-transform: uppercase;
            font-size: 14px;
            font-weight: bold;
            border: none;
            border-bottom: 4px solid #15803d;
            box-shadow: 0 0 15px rgba(157, 192, 139, 0.5);
            cursor: pointer;
            transition: all 0.1s;
        `;
        this.okBtn.onmousedown = () => {
            this.okBtn.style.borderBottomWidth = '0';
            this.okBtn.style.transform = 'translateY(4px)';
        };
        this.okBtn.onmouseup = () => {
            this.okBtn.style.borderBottomWidth = '4px';
            this.okBtn.style.transform = 'translateY(0)';
        };
        this.okBtn.onmouseleave = () => {
            this.okBtn.style.borderBottomWidth = '4px';
            this.okBtn.style.transform = 'translateY(0)';
        };
        this.okBtn.innerText = 'OK';

        footer.appendChild(this.okBtn);

        this.popup.appendChild(content);
        this.popup.appendChild(footer);
        this.overlay.appendChild(this.popup);

        document.body.appendChild(this.overlay);

        // Event Listeners
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.hide();
        });

        this.okBtn.addEventListener('click', () => {
            this.confirm();
        });
    }

    private navigate(dir: number) {
        let newIndex = this.hairOptions.findIndex(h => h.id === this.selectedHairId) + dir;
        if (newIndex < 0) newIndex = this.hairOptions.length - 1;
        if (newIndex >= this.hairOptions.length) newIndex = 0;

        this.select(this.hairOptions[newIndex].id);
    }

    public show(currentHairId: number) {
        this.selectedHairId = currentHairId;
        this.renderGrid();
        this.updatePreview();

        this.isVisible = true;
        this.overlay.classList.remove('hidden');
        // Trigger reflow
        void this.overlay.offsetWidth;

        this.overlay.classList.remove('opacity-0');
        this.popup.classList.remove('translate-y-10');
    }

    public hide() {
        this.isVisible = false;
        this.overlay.classList.add('opacity-0');
        this.popup.classList.add('translate-y-10');

        setTimeout(() => {
            if (!this.isVisible) {
                this.overlay.classList.add('hidden');
                this.onClose();
            }
        }, 300);
    }

    private confirm() {
        this.onSelect(this.selectedHairId);
        this.hide();
    }

    private select(id: number) {
        this.selectedHairId = id;
        this.updatePreview();
        this.updateGridHighlight();
    }

    private updatePreview() {
        const hair = this.hairOptions.find(h => h.id === this.selectedHairId);
        if (hair) {
            this.nameLabel.innerText = hair.name || 'DEFAULT';
            if (hair.id === 0) {
                this.bigPreview.style.backgroundImage = 'none';
            } else {
                this.bigPreview.style.backgroundImage = `url('/assets/${hair.idleKey}_strip9.png')`;
            }
        }
    }

    private renderGrid() {
        this.grid.innerHTML = '';

        this.hairOptions.forEach(hair => {
            const btn = document.createElement('button');
            const isSelected = hair.id === this.selectedHairId;

            // Refined Styles:
            // - No expanding animation (removed transform/scale)
            // - Unselected: Grayed out/Dimmed (opacity-40 grayscale)
            // - Selected: Full color, Green Border
            const baseClass = "w-full h-24 md:h-32 border-2 rounded-xl flex items-center justify-center relative overflow-hidden transition-all duration-200";
            const selectedClass = "bg-white/10 border-primary opacity-100 ring-2 ring-primary/20 z-10";
            const unselectedClass = "bg-black/60 border-white/10 opacity-60 hover:opacity-100 hover:border-white/30 grayscale hover:grayscale-0";

            btn.className = `${baseClass} ${isSelected ? selectedClass : unselectedClass}`;
            btn.dataset.id = hair.id.toString();

            const isMobile = window.innerWidth < 768;
            const gridScale = isMobile ? 'scale(2.5)' : 'scale(3)';

            // Base layer
            const base = document.createElement('div');
            // Use specific sprite dimensions and scale up
            base.className = 'absolute';
            base.style.width = '96px';
            base.style.height = '64px';
            base.style.top = '50%';
            base.style.left = '50%';
            base.style.backgroundImage = `url('/assets/base_idle_strip9.png')`;
            base.style.backgroundSize = '864px 64px'; // Full strip size
            base.style.backgroundPosition = '0 0'; // Show first frame (idle)
            base.style.imageRendering = 'pixelated';
            base.style.transform = `translate(-50%, -50%) ${gridScale}`;

            btn.appendChild(base);

            // Hair layer
            if (hair.id !== 0) {
                const layer = document.createElement('div');
                layer.className = 'absolute';
                layer.style.width = '96px';
                layer.style.height = '64px';
                layer.style.top = '50%';
                layer.style.left = '50%';
                layer.style.backgroundImage = `url('/assets/${hair.idleKey}_strip9.png')`;
                layer.style.backgroundSize = '864px 64px';
                layer.style.backgroundPosition = '0 0';
                layer.style.imageRendering = 'pixelated';
                layer.style.transform = `translate(-50%, -50%) ${gridScale}`; // Match scale

                btn.appendChild(layer);
            }

            btn.onclick = () => this.select(hair.id);
            this.grid.appendChild(btn);
        });
    }

    private updateGridHighlight() {
        Array.from(this.grid.children).forEach((child: any) => {
            const id = parseInt(child.dataset.id);
            const baseClass = "w-full h-24 md:h-32 border-2 rounded-xl flex items-center justify-center relative overflow-hidden transition-all duration-200";
            const selectedClass = "bg-white/10 border-primary opacity-100 ring-2 ring-primary/20 z-10";
            const unselectedClass = "bg-black/60 border-white/10 opacity-60 hover:opacity-100 hover:border-white/30 grayscale hover:grayscale-0";

            if (id === this.selectedHairId) {
                child.className = `${baseClass} ${selectedClass}`;
            } else {
                child.className = `${baseClass} ${unselectedClass}`;
            }
        });
    }
}
