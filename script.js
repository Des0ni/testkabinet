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

async function loadData(filename) {
    try {
        const res = await fetch(`./data/${filename}?v=${new Date().getTime()}`);
        const data = await res.json();
        questionsBank = data.questions;
        startSession(questionsBank);
    } catch (e) {
        UI.qText.innerText = "Ошибка загрузки вопросов. Проверьте папку data и название файла.";
    }
}

function startSession(list) {
    // Перемешиваем вопросы только если это не режим "Просмотр" (в просмотре лучше по порядку)
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
    
    UI.num.innerText = currentIdx + 1;
    UI.total.innerText = sessionQuestions.length;
    UI.bar.style.width = ((currentIdx / sessionQuestions.length) * 100) + '%';
    UI.qText.innerText = q.q;
    UI.options.innerHTML = '';

    // Генерируем случайный порядок ответов
    currentOptionsMapping = q.a.map((_, i) => i).sort(() => 0.5 - Math.random());

    currentOptionsMapping.forEach((originalIdx) => {
        const div = document.createElement('div');
        div.className = 'option-box';
        div.innerText = q.a[originalIdx];
        
        div.onclick = () => handleSelection(div, originalIdx, q.correct);
        UI.options.appendChild(div);
    });
}

function handleSelection(clickedDiv, selectedIdx, correctIdx) {
    if (currentSelected !== null) return; // Запрет менять ответ, если уже подсвечено

    const mode = UI.mode.value;

    // В "Обычном тесте" и "Просмотре" показываем ответ СРАЗУ
    if (mode === 'normal' || mode === 'review') {
        currentSelected = selectedIdx;
        const boxes = document.querySelectorAll('.option-box');
        
        boxes.forEach((box, i) => {
            const originalIdx = currentOptionsMapping[i];
            box.style.pointerEvents = 'none'; // Блокируем остальные клики

            if (originalIdx === correctIdx) {
                box.classList.add('opt-correct'); // Правильный - зеленый
            }
            if (originalIdx === selectedIdx && selectedIdx !== correctIdx) {
                box.classList.add('opt-wrong'); // Неправильный - красный
            }
        });
    } 
    // В "Тест-кабинете" просто выбираем (без подсветки)
    else {
        document.querySelectorAll('.option-box').forEach(b => b.classList.remove('selected'));
        clickedDiv.classList.add('selected');
        currentSelected = selectedIdx;
    }
}

UI.nextBtn.onclick = () => {
    if (currentSelected === null) {
        alert("Сначала выберите ответ!");
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
    
    const percent = Math.round((score / sessionQuestions.length) * 100);
    const scoreDiv = document.getElementById('res-score');
    const title = document.getElementById('res-title');

    scoreDiv.innerHTML = `Результат: <b>${score}</b> из <b>${sessionQuestions.length}</b><br>Верно: <b>${percent}%</b>`;

    // Логика Тест-кабинета (Зачет)
    if (UI.mode.value === 'test-cabinet') {
        if (percent >= 60) {
            title.innerText = "ТЕСТ ПРОЙДЕН ✅";
            title.style.color = "#2ecc71";
        } else {
            title.innerText = "ТЕСТ НЕ ПРОЙДЕН ❌";
            title.style.color = "#e74c3c";
        }
        UI.errBtn.classList.add('hidden');
    } 
    // Логика Обычного теста (Работа над ошибками)
    else {
        title.innerText = "Тест завершен";
        title.style.color = "#fff";
        
        if (wrongAnswers.length > 0 && UI.mode.value === 'normal') {
            UI.errBtn.classList.remove('hidden');
            UI.errBtn.onclick = () => startSession(wrongAnswers);
        } else {
            UI.errBtn.classList.add('hidden');
        }
    }
}

// При смене режима - перезапуск
UI.mode.onchange = () => startSession(questionsBank);

// Старт
loadData(UI.file.value);
UI.file.onchange = (e) => loadData(e.target.value);