let questionsBank = [];
let sessionQuestions = [];
let currentIdx = 0;
let score = 0;
let wrongAnswers = [];
let currentSelected = null;
let currentOptionsMapping = [];

const UI = {
    qText: document.getElementById('question-text'),
    options: document.getElementById('options-container'),
    bar: document.getElementById('bar-fill'),
    num: document.getElementById('current-num'),
    total: document.getElementById('total-num'),
    nextBtn: document.getElementById('next-btn'),
    quizArea: document.getElementById('quiz-area'),
    resultArea: document.getElementById('result-area'),
    fastArea: document.getElementById('fast-area'),
    mode: document.getElementById('mode-select'),
    file: document.getElementById('discipline-select'),
    errBtn: document.getElementById('error-work-btn')
};

function shuffle(array) {
    let m = array.length, t, i;
    while (m) {
        i = Math.floor(Math.random() * m--);
        t = array[m];
        array[m] = array[i];
        array[i] = t;
    }
    return array;
}

async function loadData(filename) {
    try {
        const res = await fetch(`./data/${filename}?v=${new Date().getTime()}`);
        const data = await res.json();
        questionsBank = data.questions;
        startSession(questionsBank);
    } catch (e) {
        UI.qText.innerText = "Ошибка загрузки вопросов.";
    }
}

function startSession(list) {
    const currentFileName = UI.file.value;
    const currentMode = UI.mode.value;


    if (currentFileName === 'opbd.json' && (currentMode === 'review' || currentMode === 'test-cabinet')) {
        sessionQuestions = shuffle([...list]);
    } else {
        sessionQuestions = [...list];
    }

    currentIdx = 0;
    score = 0;
    wrongAnswers = [];

    UI.quizArea.classList.add('hidden');
    UI.resultArea.classList.add('hidden');
    UI.fastArea.classList.add('hidden');
    UI.errBtn.classList.add('hidden');
    UI.fastArea.innerHTML = '';

    if (currentMode === 'fast-rev') {
        renderFastList();
    } else {
        UI.quizArea.classList.remove('hidden');
        render();
    }
}

function renderFastList() {
    UI.fastArea.classList.remove('hidden');
    sessionQuestions.forEach((q, i) => {
        const card = document.createElement('div');
        card.className = 'fast-card';
        let opts = '';
        q.a.forEach((text, idx) => {
            const isCorrect = (idx === q.correct) ? 'fast-correct' : '';
            opts += `<div class="fast-opt ${isCorrect}">${text}</div>`;
        });
        card.innerHTML = `
            <div class="stats-line">Вопрос ${i + 1}</div>
            <div class="fast-q">${q.q}</div>
            <div class="fast-ans-list">${opts}</div>
        `;
        UI.fastArea.appendChild(card);
    });
}

function render() {
    const q = sessionQuestions[currentIdx];
    currentSelected = null;
    UI.num.innerText = currentIdx + 1;
    UI.total.innerText = sessionQuestions.length;
    UI.bar.style.width = ((currentIdx / sessionQuestions.length) * 100) + '%';
    UI.qText.innerText = q.q;
    UI.options.innerHTML = '';

    currentOptionsMapping = shuffle(q.a.map((_, i) => i));

    currentOptionsMapping.forEach((originalIdx) => {
        const div = document.createElement('div');
        div.className = 'option-box';
        div.innerText = q.a[originalIdx];
        div.onclick = () => handleSelection(div, originalIdx, q.correct);
        UI.options.appendChild(div);
    });
}

function handleSelection(clickedDiv, selectedIdx, correctIdx) {
    if (currentSelected !== null) return;
    const mode = UI.mode.value;

    if (mode === 'normal' || mode === 'review') {
        currentSelected = selectedIdx;
        const boxes = document.querySelectorAll('.option-box');
        boxes.forEach((box, i) => {
            const originalIdx = currentOptionsMapping[i];
            box.style.pointerEvents = 'none';
            if (originalIdx === correctIdx) box.classList.add('opt-correct');
            else box.classList.add('opt-wrong');
        });
    } else {
        document.querySelectorAll('.option-box').forEach(b => b.classList.remove('selected'));
        clickedDiv.classList.add('selected');
        currentSelected = selectedIdx;
    }
}

UI.nextBtn.onclick = () => {
    if (currentSelected === null) return alert("Выберите ответ");
    const q = sessionQuestions[currentIdx];
    if (currentSelected === q.correct) score++;
    else wrongAnswers.push(q);

    currentIdx++;
    if (currentIdx < sessionQuestions.length) render();
    else finish();
};

function finish() {
    UI.quizArea.classList.add('hidden');
    UI.resultArea.classList.remove('hidden');
    const points = Math.round((score / sessionQuestions.length) * 100);
    const scoreDiv = document.getElementById('res-score');
    const title = document.getElementById('res-title');

    if (UI.mode.value === 'test-cabinet') {
        title.innerText = points >= 60 ? "ТЕСТ ПРОЙДЕН ✅" : "ТЕСТ НЕ ПРОЙДЕН ❌";
        title.style.color = points >= 60 ? "#2ecc71" : "#e74c3c";
        scoreDiv.innerHTML = `Баллов: <b style="font-size: 32px;">${points}</b> из 100<br><small>Верно: ${score} из ${sessionQuestions.length}</small>`;
    } else {
        title.innerText = "Результаты";
        title.style.color = "#fff";
        scoreDiv.innerHTML = `Верно: <b>${score}</b> из <b>${sessionQuestions.length}</b> (<b>${points}%</b>)`;
        if (wrongAnswers.length > 0 && UI.mode.value === 'normal') {
            UI.errBtn.classList.remove('hidden');
            UI.errBtn.onclick = () => startSession(wrongAnswers);
        }
    }
}

UI.mode.onchange = () => startSession(questionsBank);
loadData(UI.file.value);
UI.file.onchange = (e) => loadData(e.target.value);