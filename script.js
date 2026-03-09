let questionsBank = [];
let sessionQuestions = [];
let currentIdx = 0;
let score = 0;
let wrongAnswers = [];
let currentSelected = [];
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
    errBtn: document.getElementById('error-work-btn'),
    qImg: document.getElementById('question-img')
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
        UI.qText.innerHTML = "Ошибка загрузки вопросов.";
    }
}

function startSession(list) {
    const fn = UI.file.value;
    const md = UI.mode.value;

    if ((fn === 'opbd.json' || fn === 'mdk_01_01.json') && (md === 'review' || md === 'test-cabinet')) {
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

    if (md === 'fast-rev') {
        renderFastList();
    } else {
        UI.quizArea.classList.remove('hidden');
        render();
    }
}

function render() {
    const q = sessionQuestions[currentIdx];
    currentSelected = [];

    if (q.img) {
        UI.qImg.src = `./img/${q.img}`;
        UI.qImg.classList.remove('hidden');
    } else {
        UI.qImg.classList.add('hidden');
    }

    UI.num.innerText = currentIdx + 1;
    UI.total.innerText = sessionQuestions.length;
    UI.bar.style.width = ((currentIdx / sessionQuestions.length) * 100) + '%';
    UI.qText.innerHTML = q.q; 
    UI.options.innerHTML = '';

    currentOptionsMapping = shuffle(q.a.map((_, i) => i));

    currentOptionsMapping.forEach((origIdx) => {
        const div = document.createElement('div');
        div.className = 'option-box';
        div.innerHTML = q.a[origIdx]; 
        div.onclick = () => handleSelection(div, origIdx, q.correct);
        UI.options.appendChild(div);
    });
}

function handleSelection(div, idx, correctArr) {
    const mode = UI.mode.value;
    const isMultiple = correctArr.length > 1;

    if (mode === 'normal' || mode === 'review') {
        if (!isMultiple) {
            if (currentSelected.length > 0) return;
            currentSelected = [idx];
            document.querySelectorAll('.option-box').forEach((box, i) => {
                const oIdx = currentOptionsMapping[i];
                box.style.pointerEvents = 'none';
                if (correctArr.includes(oIdx)) box.classList.add('opt-correct');
                else box.classList.add('opt-wrong');
            });
        } else {
            if (div.classList.contains('opt-correct') || div.classList.contains('opt-wrong')) return;
            if (currentSelected.includes(idx)) {
                currentSelected = currentSelected.filter(i => i !== idx);
                div.classList.remove('selected');
            } else {
                currentSelected.push(idx);
                div.classList.add('selected');
            }
        }
    } else {
        if (!isMultiple) {
            currentSelected = [idx];
            document.querySelectorAll('.option-box').forEach(b => b.classList.remove('selected'));
            div.classList.add('selected');
        } else {
            if (currentSelected.includes(idx)) {
                currentSelected = currentSelected.filter(i => i !== idx);
                div.classList.remove('selected');
            } else {
                currentSelected.push(idx);
                div.classList.add('selected');
            }
        }
    }
}

UI.nextBtn.onclick = () => {
    if (currentSelected.length === 0) return alert("Выберите ответ");
    const q = sessionQuestions[currentIdx];
    const mode = UI.mode.value;

    if (q.correct.length > 1 && (mode === 'normal' || mode === 'review') && !UI.options.querySelector('.opt-correct')) {
        document.querySelectorAll('.option-box').forEach((box, i) => {
            const oIdx = currentOptionsMapping[i];
            box.style.pointerEvents = 'none';
            if (q.correct.includes(oIdx)) box.classList.add('opt-correct');
            else box.classList.add('opt-wrong'); // В режиме проверки красим все неверные
        });
        return;
    }

    const isCorrect = q.correct.length === currentSelected.length && q.correct.every(v => currentSelected.includes(v));
    if (isCorrect) score++;
    else wrongAnswers.push(q);

    currentIdx++;
    if (currentIdx < sessionQuestions.length) render();
    else finish();
};

function finish() {
    UI.quizArea.classList.add('hidden');
    UI.resultArea.classList.remove('hidden');
    const pts = Math.round((score / sessionQuestions.length) * 100);
    const scoreDiv = document.getElementById('res-score');
    const title = document.getElementById('res-title');
    if (UI.mode.value === 'test-cabinet') {
        title.innerText = pts >= 60 ? "ТЕСТ ПРОЙДЕН ✅" : "ТЕСТ НЕ ПРОЙДЕН ❌";
        title.style.color = pts >= 60 ? "#2ecc71" : "#e74c3c";
        scoreDiv.innerHTML = `Баллов: <b style="font-size: 32px;">${pts}</b> из 100<br><small>Верно: ${score} из ${sessionQuestions.length}</small>`;
    } else {
        title.innerText = "Результаты";
        title.style.color = "#fff";
        scoreDiv.innerHTML = `Верно: <b>${score}</b> из <b>${sessionQuestions.length}</b> (${pts}%)`;
        if (wrongAnswers.length > 0 && UI.mode.value === 'normal') {
            UI.errBtn.classList.remove('hidden');
            UI.errBtn.onclick = () => startSession(wrongAnswers);
        }
    }
}

function renderFastList() {
    UI.fastArea.classList.remove('hidden');
    UI.fastArea.innerHTML = '';
    sessionQuestions.forEach((q, i) => {
        const card = document.createElement('div');
        card.className = 'fast-card';
        let img = q.img ? `<img src="./img/${q.img}" style="max-width:100%; display:block; margin: 10px 0; border-radius:5px;">` : '';
        let opts = '';
        q.a.forEach((text, idx) => {
            const isCorr = q.correct.includes(idx) ? 'fast-correct' : '';
            opts += `<div class="fast-opt ${isCorr}">${text}</div>`;
        });
        card.innerHTML = `<div class="stats-line">Вопрос ${i + 1}</div><div class="fast-q">${q.q}</div>${img}<div>${opts}</div>`;
        UI.fastArea.appendChild(card);
    });
}

UI.mode.onchange = () => startSession(questionsBank);
loadData(UI.file.value);
UI.file.onchange = (e) => loadData(e.target.value);