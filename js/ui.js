const UI = {
    getContentArea: () => document.getElementById('content'),

    renderLogs: function() {
        const logs = (window.studyData && window.studyData.logs) ? window.studyData.logs : {};
        const dates = Object.keys(logs).sort().reverse();
        
        let html = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h2>📅 공부 기록</h2>
                <button class="brown-btn" onclick="App.askNewDate()">+ 날짜 추가</button>
            </div>
            <ul style="padding:0;">
                ${dates.map(date => `
                    <li class="sentence-item-card" style="cursor:pointer; list-style:none;" onclick="UI.renderLogDetail('${date}')">
                        <strong>20${date.substring(0,2)}년 ${date.substring(2,4)}월 ${date.substring(4,6)}일</strong> 기록 보기
                    </li>
                `).join('')}
            </ul>`;
        
        if (dates.length === 0) html += `<p style="text-align:center; color:#999; margin-top:50px;">데이터가 없습니다. 날짜를 추가해주세요!</p>`;

        const area = this.getContentArea();
        if(area) {
            area.innerHTML = html;
            area.scrollTop = 0;
        }
    },

    renderLogDetail: function(date) {
        // 날짜 데이터가 없을 경우 초기 구조 할당
        if (!window.studyData.logs[date]) {
            window.studyData.logs[date] = { chats: [], sentences: [] };
        }
        
        const log = window.studyData.logs[date];
        const chats = log.chats || [];
        const sentences = log.sentences || [];

        let html = `
            <button class="brown-btn" onclick="UI.renderLogs()" style="margin-bottom:15px; background:#666; padding:5px 12px;">← 목록으로</button>
            <h2>🗓️ ${date} 상세 내용</h2>
            
            <div class="chat-container" style="display:flex; flex-direction:column; gap:12px; margin:20px 0;">
                ${chats.map((chat) => `
                    <div class="chat-bubble ${chat.role === 'gemini' ? 'gemini' : 'me'}">${chat.text}</div>
                `).join('')}
            </div>

            <div style="background:#fdfdfd; border:1px solid #eee; padding:15px; border-radius:10px; margin-bottom:20px;">
                <h3 style="margin-bottom:10px;">✍️ 새 대화 추가</h3>
                <div style="display:flex; gap:10px; margin-bottom:10px;">
                    <textarea id="geminiIn" placeholder="Gemini가 한 말" style="flex:1; height:80px; padding:10px; border:1px solid #ddd; border-radius:5px;"></textarea>
                    <textarea id="meIn" placeholder="내가 한 말" style="flex:1; height:80px; padding:10px; border:1px solid #ddd; border-radius:5px;"></textarea>
                </div>
                <button class="brown-btn" onclick="App.addChat('${date}')" style="width:100%">💾 저장</button>
            </div>

            <div>
                <h3 style="margin-bottom:10px;">⭐ 필수 문장</h3>
                <div id="sentenceList">
                    ${sentences.map((s, i) => `
                        <div class="sentence-item-card">
                            <div style="flex:1;">
                                <strong style="color:var(--main-brown);">${s.text}</strong><br>
                                <small style="color:#666;">${s.trans}</small>
                            </div>
                            <div style="display:flex; gap:10px; align-items:center;">
                                <button onclick="App.speak('${s.text.replace(/'/g, "\\'")}')" style="background:none; border:none; cursor:pointer; font-size:1.2em;">🔊</button>
                                <button class="delete-btn" onclick="App.delSentence('${date}', ${i})">❌</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div style="display:flex; gap:5px; margin-top:10px;">
                    <input type="text" id="sentenceIn" style="flex:1; padding:10px; border:1px solid #ddd; border-radius:5px;" placeholder="영어 문장 입력">
                    <button class="brown-btn" onclick="App.addSentence('${date}')">+ 추가</button>
                </div>
            </div>
            
            <button class="delete-all-btn" onclick="App.deleteFullDate('${date}')" style="margin-top:30px;">🗑️ 날짜 삭제</button>
        `;
        const area = this.getContentArea();
        if(area) {
            area.innerHTML = html;
            area.scrollTop = 0;
        }
    },

    renderSentencesPage: function() {
        let html = `<h2>⭐ 필수 문장 모음</h2><div style="margin-top:20px;">`;
        let hasData = false;
        const logs = window.studyData.logs || {};
        
        for (const date in logs) {
            const sentences = logs[date].sentences || [];
            sentences.forEach((s) => {
                hasData = true;
                html += `
                    <div class="sentence-item-card">
                        <div style="flex:1;">
                            <strong style="color:var(--main-brown);">${s.text}</strong>
                            <p style="font-size:0.9em; color:#666;">${s.trans}</p>
                        </div>
                        <button class="brown-btn" onclick="App.speak('${s.text.replace(/'/g, "\\'")}')">🔊 발음</button>
                    </div>`;
            });
        }
        if(!hasData) html += `<p style="text-align:center; color:#999;">저장된 문장이 없습니다.</p>`;
        this.getContentArea().innerHTML = html;
    },

    renderTestPage: function(s) {
        this.getContentArea().innerHTML = `
            <div style="text-align:center;">
                <h2>🎲 랜덤 테스트</h2>
                <div style="background:var(--light-yellow); padding:30px; border:1px solid #ffe58f; border-radius:15px; max-width:500px; margin:20px auto;">
                    <p style="margin-bottom:10px;">이 문장은 무슨 뜻일까요?</p>
                    <h2 style="margin-bottom:20px;">${s.text}</h2>
                    <input type="text" id="testInput" style="width:100%; padding:12px; text-align:center; border-radius:8px; border:1px solid #ddd;" placeholder="뜻을 입력하세요">
                    <div id="testResult" style="margin-top:15px; font-weight:bold;"></div>
                    <div style="margin-top:20px; display:flex; gap:10px;">
                        <button class="brown-btn" onclick="App.checkAnswer()" style="flex:1">확인</button>
                        <button class="brown-btn" onclick="App.startRandomTest()" style="flex:1; background:#666;">다음</button>
                    </div>
                </div>
            </div>`;
    }
};
