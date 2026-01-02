window.studyData = { logs: {} };

const App = {
    currentTestSentence: null,

    init: async function() {
        this.bindMenu();
        try {
            const data = await DataManager.loadAllData();
            if (data && data.logs) window.studyData = data;
        } catch (e) { console.error("Data Load Error", e); }
        UI.renderLogs();
    },

    bindMenu: function() {
        const menuBtn = document.getElementById('menuBtn');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('overlay');

        menuBtn.onclick = () => { sidebar.classList.toggle('active'); overlay.classList.toggle('active'); };
        overlay.onclick = () => { sidebar.classList.remove('active'); overlay.classList.remove('active'); };

        document.querySelectorAll('.sidebar li').forEach(item => {
            item.onclick = () => {
                const view = item.getAttribute('data-view');
                if (view === 'dates') UI.renderLogs();
                else if (view === 'sentences') UI.renderSentencesPage();
                else if (view === 'test') App.startRandomTest();
                else if (view === 'gemini') window.open("https://gemini.google.com/app", "_blank");
                sidebar.classList.remove('active'); overlay.classList.remove('active');
            };
        });
    },

    saveToFirebase: function() {
        DataManager.saveAllData(window.studyData);
    },

    addChat: function(date) {
        const gIn = document.getElementById('geminiIn'), mIn = document.getElementById('meIn');
        if (!window.studyData.logs[date]) window.studyData.logs[date] = { chats: [], sentences: [] };
        
        if (gIn.value.trim()) window.studyData.logs[date].chats.push({ role: "gemini", text: gIn.value.trim() });
        if (mIn.value.trim()) window.studyData.logs[date].chats.push({ role: "me", text: mIn.value.trim() });
        
        gIn.value = ""; mIn.value = "";
        this.saveToFirebase();
        UI.renderLogDetail(date);
    },

    addSentence: async function(date) {
        const sIn = document.getElementById('sentenceIn');
        const text = sIn.value.trim();
        if (!text) return;
        if (!window.studyData.logs[date]) window.studyData.logs[date] = { chats: [], sentences: [] };

        try {
            const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ko&dt=t&q=${encodeURIComponent(text)}`);
            const data = await res.json();
            const trans = data[0] ? data[0].map(i => i[0]).join("") : "";
            window.studyData.logs[date].sentences.push({ text, trans });
            sIn.value = "";
            this.saveToFirebase();
            UI.renderLogDetail(date);
        } catch (e) { alert("번역 실패"); }
    },

    delSentence: function(date, index) {
        if (confirm("삭제할까요?")) {
            window.studyData.logs[date].sentences.splice(index, 1);
            this.saveToFirebase();
            UI.renderLogDetail(date);
        }
    },

    deleteFullDate: function(date) {
        if (confirm("이 날짜의 모든 데이터를 삭제할까요?")) {
            delete window.studyData.logs[date];
            this.saveToFirebase();
            UI.renderLogs();
        }
    },

    checkAnswer: function() {
        const input = document.getElementById('testInput').value.trim();
        const correct = this.currentTestSentence.trans;
        const isCorrect = correct.replace(/\s/g, "").includes(input.replace(/\s/g, ""));
        document.getElementById('testResult').innerHTML = isCorrect ? "⭕ 정답!" : `❌ 오답 (정답: ${correct})`;
    },

    startRandomTest: function() {
        let all = [];
        for (const d in window.studyData.logs) all = all.concat(window.studyData.logs[d].sentences || []);
        if (all.length === 0) return alert("문장이 없습니다.");
        this.currentTestSentence = all[Math.floor(Math.random() * all.length)];
        UI.renderTestPage(this.currentTestSentence);
    },

    speak: (t) => {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(t); u.lang = 'en-US';
        window.speechSynthesis.speak(u);
    },

    askNewDate: function() {
        const d = prompt("날짜 입력 (YYMMDD)");
        if (d && !window.studyData.logs[d]) {
            window.studyData.logs[d] = { chats: [], sentences: [] };
            this.saveToFirebase(); UI.renderLogs();
        }
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());
