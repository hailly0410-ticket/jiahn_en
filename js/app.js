// 전역 변수 초기화 (데이터가 없어도 에러가 나지 않게 빈 객체 설정)
window.studyData = { logs: {} };

const App = {
    currentTestSentence: null,

    // 앱 초기화
    init: async function() {
        console.log("앱 초기화 시작...");
        this.bindMenu();
        
        try {
            // Firebase에서 데이터 로드
            const data = await DataManager.loadAllData();
            if (data && data.logs) {
                window.studyData = data;
                console.log("데이터 로드 성공:", window.studyData);
            }
        } catch (e) {
            console.error("데이터 로드 중 에러 발생:", e);
        }

        // 데이터 로드 여부와 상관없이 첫 화면은 보여줌
        if (typeof UI !== 'undefined') {
            UI.renderLogs();
        } else {
            console.error("UI 객체를 찾을 수 없습니다. ui.js 순서를 확인하세요.");
        }
    },

    bindMenu: function() {
        const menuBtn = document.getElementById('menuBtn');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('overlay');

        if (menuBtn) {
            menuBtn.onclick = () => {
                sidebar.classList.toggle('active');
                overlay.classList.toggle('active');
            };
        }

        if (overlay) {
            overlay.onclick = () => {
                sidebar.classList.remove('active');
                overlay.classList.remove('active');
            };
        }

        document.querySelectorAll('.sidebar li').forEach(item => {
            item.onclick = () => {
                const view = item.getAttribute('data-view');
                if (view === 'dates') UI.renderLogs();
                else if (view === 'sentences') UI.renderSentencesPage();
                else if (view === 'test') App.startRandomTest();
                else if (view === 'gemini') window.open("https://gemini.google.com/app", "_blank");
                
                sidebar.classList.remove('active');
                overlay.classList.remove('active');
            };
        });
    },

    saveToFirebase: function() {
        DataManager.saveAllData(window.studyData);
    },

    addChat: function(date) {
        const gIn = document.getElementById('geminiIn');
        const mIn = document.getElementById('meIn');
        
        if (!window.studyData.logs[date]) window.studyData.logs[date] = { chats: [], sentences: [] };
        
        if (gIn.value.trim()) window.studyData.logs[date].chats.push({ role: "gemini", text: gIn.value });
        if (mIn.value.trim()) window.studyData.logs[date].chats.push({ role: "me", text: mIn.value });
        
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
        } catch (e) {
            alert("번역에 실패했습니다. (인터넷 연결 확인)");
        }
    },

    delSentence: function(date, index) {
        if (confirm("삭제할까요?")) {
            window.studyData.logs[date].sentences.splice(index, 1);
            this.saveToFirebase();
            UI.renderLogDetail(date);
        }
    },

    deleteFullDate: function(date) {
        if (confirm("전체 삭제하시겠습니까?")) {
            delete window.studyData.logs[date];
            this.saveToFirebase();
            UI.renderLogs();
        }
    },

    checkAnswer: function() {
        const input = document.getElementById('testInput').value.trim();
        const correct = this.currentTestSentence.trans;
        const isCorrect = correct.replace(/\s/g, "").includes(input.replace(/\s/g, ""));
        document.getElementById('testResult').innerHTML = isCorrect ? 
            `<p style="color:green;">⭕ 정답입니다!</p>` : `<p style="color:red;">❌ 틀렸습니다. (정답: ${correct})</p>`;
    },

    startRandomTest: function() {
        let all = [];
        for (const d in window.studyData.logs) {
            all = all.concat(window.studyData.logs[d].sentences);
        }
        if (all.length === 0) return alert("저장된 문장이 없습니다.");
        this.currentTestSentence = all[Math.floor(Math.random() * all.length)];
        UI.renderTestPage(this.currentTestSentence);
    },

    speak: (t) => {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(t); 
        u.lang = 'en-US';
        window.speechSynthesis.speak(u);
    },

    askNewDate: function() {
        const d = prompt("날짜를 입력하세요 (예: 250102)");
        if (d) {
            if (!window.studyData.logs[d]) {
                window.studyData.logs[d] = { chats: [], sentences: [] };
                this.saveToFirebase();
                UI.renderLogs();
            } else {
                alert("이미 존재하는 날짜입니다.");
            }
        }
    }
};

// DOM 로드 완료 후 실행
document.addEventListener('DOMContentLoaded', () => App.init());
