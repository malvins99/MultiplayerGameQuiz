export class QRCodePopup {
    private overlay!: HTMLElement;
    private popup!: HTMLElement;
    private qrImage!: HTMLImageElement;
    private onClose: () => void;
    private isVisible: boolean = false;

    constructor(onClose: () => void) {
        this.onClose = onClose;
        this.createDOM();
    }

    private createDOM() {
        // Wrapper - centered interaction layer
        this.overlay = document.createElement('div');
        this.overlay.className = 'fixed inset-0 bg-black/80 z-50 hidden opacity-0 transition-opacity duration-300 flex items-center justify-center cursor-pointer';

        // Popup Container - simplified, no border/bg for container itself, just holds the image
        this.popup = document.createElement('div');
        this.popup.className = 'transform scale-50 transition-transform duration-300 relative';

        // QR Container - Minimal white box for QR contrast
        const qrContainer = document.createElement('div');
        qrContainer.className = 'bg-white p-4 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)]'; // Rounded white background for QR

        this.qrImage = document.createElement('img');
        this.qrImage.className = 'w-[500px] h-[500px] object-contain mix-blend-multiply';
        this.qrImage.alt = "Room QR Code";

        qrContainer.appendChild(this.qrImage);
        this.popup.appendChild(qrContainer);
        this.overlay.appendChild(this.popup);

        document.body.appendChild(this.overlay);

        // Close on ANY click (overlay or image) since there's no button
        this.overlay.addEventListener('click', () => {
            this.hide();
        });
    }

    public show(qrSrc: string) {
        if (!qrSrc) return;
        this.qrImage.src = qrSrc;

        this.isVisible = true;
        this.overlay.classList.remove('hidden');
        // Trigger reflow
        void this.overlay.offsetWidth;

        this.overlay.classList.remove('opacity-0');
        this.popup.classList.remove('scale-50');
        this.popup.classList.add('scale-100');
    }

    public hide() {
        this.isVisible = false;
        this.overlay.classList.add('opacity-0');
        this.popup.classList.remove('scale-100');
        this.popup.classList.add('scale-50');

        setTimeout(() => {
            if (!this.isVisible) {
                this.overlay.classList.add('hidden');
                this.onClose();
            }
        }, 300);
    }
}
