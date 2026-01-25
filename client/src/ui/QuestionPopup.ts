export class QuestionPopup {
    scene: Phaser.Scene;
    element: Phaser.GameObjects.DOMElement;
    onAnswer: (answer: string) => void;

    constructor(scene: Phaser.Scene, onAnswer: (answer: string) => void) {
        this.scene = scene;
        this.onAnswer = onAnswer;
        this.element = this.createDOM();
        this.hide();
    }

    createDOM() {
        const element = this.scene.add.dom(this.scene.scale.width / 2, this.scene.scale.height / 2).createFromHTML(`
            <div id="question-popup" style="background-color: white; padding: 20px; border-radius: 10px; width: 400px; text-align: center; border: 2px solid black;">
                <h3 id="question-text" style="color: black;">Pertanyaan...</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <button class="ans-btn" data-ans="a" style="padding: 10px; cursor: pointer;">A</button>
                    <button class="ans-btn" data-ans="b" style="padding: 10px; cursor: pointer;">B</button>
                    <button class="ans-btn" data-ans="c" style="padding: 10px; cursor: pointer;">C</button>
                    <button class="ans-btn" data-ans="d" style="padding: 10px; cursor: pointer;">D</button>
                </div>
            </div>
        `);

        element.addListener('click');
        element.on('click', (event: any) => {
            if (event.target.classList.contains('ans-btn')) {
                const answer = event.target.dataset.ans;
                this.onAnswer(answer);
                this.hide();
            }
        });

        return element;
    }

    show(question: any) {
        const popup = this.element.node.querySelector('#question-popup');
        const qText = this.element.node.querySelector('#question-text');

        if (qText) qText.textContent = question.pertanyaan;

        const btns = this.element.node.querySelectorAll('.ans-btn');
        const options = ['a', 'b', 'c', 'd'];
        btns.forEach((btn: any, index: number) => {
            const key = `jawaban_${options[index]}`;
            btn.textContent = `${options[index].toUpperCase()}. ${question[key]}`;
        });

        this.element.setVisible(true);
    }

    hide() {
        this.element.setVisible(false);
    }
}
