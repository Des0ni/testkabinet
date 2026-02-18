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
    mode: document.getElementById('mode-select'),
    file: document.getElementById('discipline-select'),
    errBtn: document.getElementById('error-work-btn')
};

// Функция перемешивания (теперь только для ОТВЕТОВ)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
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
    // УБРАЛИ ПЕРЕМЕШИВАНИЕ ВОПРОСОВ. Теперь они идут строго по порядку.
    sessionQuestions = [...list]; 
    
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
    
    UI.num.innerText = currentIdx + 1;
    UI.total.innerText = sessionQuestions.length;
    UI.bar.style.width = ((currentIdx / sessionQuestions.length) * 100) + '%';
    UI.qText.innerText = q.q;
    UI.options.innerHTML = '';

    // Перемешиваем только ВАРИАНТЫ ответов
    currentOptionsMapping = shuffleArray(q.a.map((_, i) => i));

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
    currentSelected = selectedIdx;

    if (mode === 'normal' || mode === 'review') {
        const boxes = document.querySelectorAll('.option-box');
        
        boxes.forEach((box, i) => {
            const originalIdx = currentOptionsMapping[i];
            box.style.pointerEvents = 'none';

            if (originalIdx === correctIdx) {
                box.classList.add('opt-correct');
            } else {
                box.classList.add('opt-wrong');
            }
        });
    } 
    else {
        document.querySelectorAll('.option-box').forEach(b => b.classList.remove('selected'));
        clickedDiv.classList.add('selected');
    }
}

UI.nextBtn.onclick = () => {
    if (currentSelected === null) {
        alert("Выберите вариант ответа!");
        return;
    }

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
    
    const points = Math.round((score / sessionQuestions.length) * 100);
    const scoreDiv = document.getElementById('res-score');
    const title = document.getElementById('res-title');

    if (UI.mode.value === 'test-cabinet') {
        title.innerText = points >= 60 ? "ТЕСТ ПРОЙДЕН ✅" : "ТЕСТ НЕ ПРОЙДЕН ❌";
        title.style.color = points >= 60 ? "#2ecc71" : "#e74c3c";
        scoreDiv.innerHTML = `Баллов набрано: <b style="font-size: 32px; color: #fff;">${points}</b> из <b>100</b><br><small>Правильных ответов: ${score} из ${sessionQuestions.length}</small>`;
        UI.errBtn.classList.add('hidden');
    } else {
        title.innerText = "Результаты";
        title.style.color = "#fff";
        scoreDiv.innerHTML = `Верно: <b>${score}</b> из <b>${sessionQuestions.length}</b> (<b>${points}%</b>)`;
        
        if (wrongAnswers.length > 0 && UI.mode.value === 'normal') {
            UI.errBtn.classList.remove('hidden');
            UI.errBtn.onclick = () => startSession(wrongAnswers);
        } else {
            UI.errBtn.classList.add('hidden');
        }
    }
}

// При смене режима - перезапуск по порядку
UI.mode.onchange = () => startSession(questionsBank);

loadData(UI.file.value);
UI.file.onchange = (e) => loadData(e.target.value);