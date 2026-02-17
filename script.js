let questionsBank = [];
let sessionQuestions = [];
let currentIdx = 0;
let score = 0;
let wrongAnswers = [];
let currentSelected = null;

const UI = {
    qText: document.getElementById('question-text'),
    options: document.getElementById('options-container'),
    bar: document.getElementById('bar-fill'),
    num: document.getElementById('current-num'),
    total: document.getElementById('total-num'),
    nextBtn: document.getElementById('next-btn'),
    quizArea: document.getElementById('quiz-area'),
    resultArea: document.getElementById('result-area'),
    mode: document.getElementById('mode-select'),
    file: document.getElementById('discipline-select'),
    errBtn: document.getElementById('error-work-btn')
};

async function loadData(filename) {
    try {
        const res = await fetch(`./data/${filename}`);
        const data = await res.json();
        questionsBank = data.questions;
        startSession(questionsBank);
    } catch (e) {
        UI.qText.innerText = "Ошибка загрузки вопросов.";
    }
}

function startSession(list) {
    // Перемешиваем только для "Тест-кабинета" и "Обычного теста"
    sessionQuestions = UI.mode.value === 'review' ? [...list] : [...list].sort(() => 0.5 - Math.random());
    currentIdx = 0;
    score = 0;
    wrongAnswers = [];
    UI.quizArea.classList.remove('hidden');
    UI.resultArea.classList.add('hidden');
    render();
}

function render() {
    const q = sessionQuestions[currentIdx];
    currentSelected = null;
    
    // UI Update
    UI.num.innerText = currentIdx + 1;
    UI.total.innerText = sessionQuestions.length;
    UI.bar.style.width = ((currentIdx / sessionQuestions.length) * 100) + '%';
    UI.qText.innerText = q.q;
    UI.options.innerHTML = '';

    q.a.forEach((text, i) => {
        const div = document.createElement('div');
        div.className = 'option-box';
        div.innerText = text;
        div.onclick = () => select(div, i, q.correct);
        UI.options.appendChild(div);
    });
}

function select(div, i, correct) {
    if (UI.mode.value === 'review') {
        if (currentSelected !== null) return;
        currentSelected = i;
        const boxes = document.querySelectorAll('.option-box');
        boxes.forEach((box, idx) => {
            box.style.pointerEvents = 'none';
            if (idx === correct) box.classList.add('opt-correct');
            if (idx === i && i !== correct) box.classList.add('opt-wrong');
        });
    } else {
        document.querySelectorAll('.option-box').forEach(b => b.classList.remove('selected'));
        div.classList.add('selected');
        currentSelected = i;
    }
}

UI.nextBtn.onclick = () => {
    if (currentSelected === null) return alert("Выберите вариант");

    const q = sessionQuestions[currentIdx];
    if (currentSelected === q.correct) {
        score++;
    } else {
        wrongAnswers.push(q);
    }

    currentIdx++;
    if (currentIdx < sessionQuestions.length) {
        render();
    } else {
        finish();
    }
};

function finish() {
    UI.quizArea.classList.add('hidden');
    UI.resultArea.classList.remove('hidden');
    
    const percent = Math.round((score / sessionQuestions.length) * 100);
    const scoreDiv = document.getElementById('res-score');
    const title = document.getElementById('res-title');

    scoreDiv.innerText = `Правильных ответов: ${score} из ${sessionQuestions.length} (${percent}%)`;

    if (UI.mode.value === 'test-cabinet') {
        if (percent >= 60) {
            title.innerText = "ТЕСТ ПРОЙДЕН ✅";
            title.style.color = "#2ecc71";
        } else {
            title.innerText = "ТЕСТ НЕ ПРОЙДЕН ❌";
            title.style.color = "#e74c3c";
        }
        UI.errBtn.classList.add('hidden');
    } else {
        title.innerText = "Результаты теста";
        title.style.color = "#fff";
        
        if (wrongAnswers.length > 0) {
            UI.errBtn.classList.remove('hidden');
            UI.errBtn.onclick = () => startSession(wrongAnswers);
        } else {
            UI.errBtn.classList.add('hidden');
        }
    }
}

// Загрузка
loadData(UI.file.value);
UI.file.onchange = (e) => loadData(e.target.value);