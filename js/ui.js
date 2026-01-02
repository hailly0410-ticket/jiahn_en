window.studyData = { logs: {} };

const App = {
    init: async function() {
        this.bindMenu();
        try {
            const data = await DataManager.loadAllData();
            // 데이터가 없거나 형식이 잘못된 경우 빈 객체로 세팅
            if (data && data.logs) {
                window.studyData = data;
            } else {
                window.studyData = { logs: {} };
            }
            console.log("데이터 로드 완료:", window.studyData);
        } catch (e) { 
            console.error("로드 중 에러:", e);
            window.studyData = { logs: {} };
        }
        UI.renderLogs();
    },

    bindMenu: function() {
        const menuBtn = document.getElementById('menuBtn');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('overlay');

        if(menuBtn) menuBtn.onclick = () => { sidebar.classList.add('active'); overlay.classList.add('active'); };
        if(overlay) overlay.onclick = () => { sidebar.classList.remove('active'); overlay.classList.remove('active'); };

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

    askNewDate: function() {
        const d = prompt("날짜 입력 (YYMMDD)");
        if (d) {
            if (!window.studyData.logs) window.studyData.logs = {};
            // 초기 배열 세팅을 확실히 함
            window.studyData.logs[d] = { chats: [], sentences: [] };
            DataManager.saveAllData(window.studyData);
            UI.renderLogs();
        }
    },

    addChat: function(date) {
        const gIn = document.getElementById('geminiIn'), mIn = document.getElementById('meIn');
        const gText = gIn.value.trim(), mText = mIn.value.trim();
        
        if (!window.studyData.logs[date].chats) window.studyData.logs[date].chats = [];
        
        if (gText) window.studyData.logs[date].chats.push({ role: "gemini", text: gText });
        if (mText) window.studyData.logs[date].chats.push({ role: "me", text: mText });
        
        gIn.value = ""; mIn.value = "";
        DataManager.saveAllData(window.studyData);
        UI.renderLogDetail(date);
    },

    addSentence: async function(date) {
        const sIn = document.getElementById('sentenceIn');
        const text = sIn.value.trim();
        if (!text) return;

        if (!window.studyData.logs[date].sentences) window.studyData.logs[date].sentences = [];

        try {
            const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ko&dt=t&q=${encodeURIComponent(text)}`);
            const data = await res.json();
            const trans = data[0] ? data[0].map(i => i[0]).join("") : "";
            
            window.studyData.logs[date].sentences.push({ text, trans });
            sIn.value = "";
            DataManager.saveAllData(window.studyData);
            UI.renderLogDetail(date);
        } catch (e) { alert("번역 실패"); }
    },

    speak: (t) => {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(t); u.lang = 'en-US';
        window.speechSynthesis.speak(u);
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());
