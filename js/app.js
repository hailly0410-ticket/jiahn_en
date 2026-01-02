// 초기 데이터 구조 선언 (절대 삭제 금지)
window.studyData = { logs: {} };

const App = {
    currentTestSentence: null,

    init: async function() {
        this.bindMenu();
        try {
            const data = await DataManager.loadAllData();
            // 서버에 데이터가 있으면 덮어씌우고, 없으면 빈 logs 유지
            if (data && data.logs) {
                window.studyData = data;
                console.log("온라인 데이터 로드 완료");
            } else {
                window.studyData = { logs: {} };
                console.log("새로운 데이터베이스 시작");
            }
        } catch (e) { 
            console.error("Data Load Error", e); 
            window.studyData = { logs: {} }; // 에러 시에도 빈 객체로 유지
        }
        UI.renderLogs();
    },

    bindMenu: function() {
        const menuBtn = document.getElementById('menuBtn');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('overlay');

        if(menuBtn) menuBtn.onclick = () => { sidebar.classList.toggle('active'); overlay.classList.toggle('active'); };
        if(overlay) overlay.onclick = () => { sidebar.classList.remove('active'); overlay.classList.remove('active'); };

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
        if (!window.studyData.logs) window.studyData.logs = {};
        if (!window.studyData.logs[date]) window.studyData.logs[date] = { chats: [], sentences: [] };
        
        const gText = gIn.value.trim();
        const mText = mIn.value.trim();

        if (gText) window.studyData.logs[date].chats.push({ role: "gemini", text: gText });
        if (mText) window.studyData.logs[date].chats.push({ role: "me", text: mText });
        
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
        const logs = window.studyData.logs || {};
        for (const d in logs) {
            const sList = logs[d].sentences || [];
            all = all.concat(sList);
        }
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
        if (d) {
            if (!window.studyData.logs) window.studyData.logs = {};
            if (!window.studyData.logs[d]) {
                window.studyData.logs[d] = { chats: [], sentences: [] };
                this.saveToFirebase(); 
                UI.renderLogs();
            } else {
                alert("이미 있는 날짜입니다.");
            }
        }
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());
