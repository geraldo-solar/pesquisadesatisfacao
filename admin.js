document.addEventListener('DOMContentLoaded', () => {
    checkAuth();

    document.getElementById('refreshBtn').addEventListener('click', loadDashboardData);

    // AI Insights Button
    const aiBtn = document.getElementById('aiBtn');
    if (aiBtn) {
        aiBtn.addEventListener('click', generateAIInsights);
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            sessionStorage.removeItem('adminAuth');
            window.location.reload();
        });
    }

    // Login Logic
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const password = document.getElementById('adminPassword').value;
            // Password updated as requested
            if (password === 'metron82') {
                sessionStorage.setItem('adminAuth', 'true');
                document.getElementById('loginOverlay').style.display = 'none';
                document.body.classList.remove('locked');
                loadDashboardData();
            } else {
                document.getElementById('loginError').innerText = 'Senha incorreta.';
            }
        });
    }
});

function checkAuth() {
    const isAuth = sessionStorage.getItem('adminAuth') === 'true';
    if (!isAuth) {
        document.body.classList.add('locked');
        document.getElementById('loginOverlay').style.display = 'flex';
    } else {
        document.getElementById('loginOverlay').style.display = 'none';
        loadDashboardData();
    }
}

function loadDashboardData() {
    // Only load if authenticated
    if (sessionStorage.getItem('adminAuth') !== 'true') return;

    // 1. Fetch data from LocalStorage
    const rawData = localStorage.getItem('hotelSolarEvaluations');
    const evaluations = rawData ? JSON.parse(rawData) : [];

    // 2. Update Basic Stats
    updateStats(evaluations);

    // 3. Render List
    renderFeedbackList(evaluations);
}

function updateStats(evaluations) {
    const totalCount = evaluations.length;
    document.getElementById('totalEvaluations').innerText = totalCount;

    if (totalCount === 0) {
        document.getElementById('avgHotel').innerText = '0.0';
        document.getElementById('avgRestaurant').innerText = '0.0';
        return;
    }

    // Calculate Averages
    let hotelSum = 0;
    let hotelCount = 0;
    let internalSum = 0;
    let internalCount = 0;
    let beachSum = 0;
    let beachCount = 0;

    evaluations.forEach(ev => {
        // Hotel Stats
        const hClean = parseInt(ev['hotel-cleanliness']) || 0;
        const hComfort = parseInt(ev['hotel-comfort']) || 0;
        const hService = parseInt(ev['hotel-service']) || 0;

        if (hClean > 0) { hotelSum += hClean; hotelCount++; }
        if (hComfort > 0) { hotelSum += hComfort; hotelCount++; }
        if (hService > 0) { hotelSum += hService; hotelCount++; }

        // Internal Restaurant Stats
        const iFood = parseInt(ev['internal-food']) || 0;
        const iService = parseInt(ev['internal-service']) || 0;
        const iAmb = parseInt(ev['internal-ambiance']) || 0;

        if (iFood > 0) { internalSum += iFood; internalCount++; }
        if (iService > 0) { internalSum += iService; internalCount++; }
        if (iAmb > 0) { internalSum += iAmb; internalCount++; }

        // Beach Restaurant (Reserva Solar) Stats
        const bFood = parseInt(ev['beach-food']) || 0;
        const bService = parseInt(ev['beach-service']) || 0;
        const bAmb = parseInt(ev['beach-ambiance']) || 0;

        if (bFood > 0) { beachSum += bFood; beachCount++; }
        if (bService > 0) { beachSum += bService; beachCount++; }
        if (bAmb > 0) { beachSum += bAmb; beachCount++; }
    });

    const avgHotel = hotelCount > 0 ? (hotelSum / hotelCount).toFixed(1) : '0.0';
    const avgInternal = internalCount > 0 ? (internalSum / internalCount).toFixed(1) : '0.0';
    const avgBeach = beachCount > 0 ? (beachSum / beachCount).toFixed(1) : '0.0';

    document.getElementById('avgHotel').innerText = avgHotel;
    document.getElementById('avgInternal').innerText = avgInternal;
    document.getElementById('avgBeach').innerText = avgBeach;
}

function renderFeedbackList(evaluations) {
    const listContainer = document.getElementById('feedbackList');
    listContainer.innerHTML = '';

    if (evaluations.length === 0) {
        listContainer.innerHTML = '<div class="no-data">Nenhuma avaliação encontrada.</div>';
        return;
    }

    // Sort by newest first
    const sortedEvaluations = [...evaluations].reverse();

    sortedEvaluations.forEach(ev => {
        const card = document.createElement('div');
        card.className = 'feedback-card';

        const date = new Date(ev.timestamp).toLocaleString('pt-BR');
        const name = ev.name || 'Anônimo';
        const contact = ev.contact || '-';
        const comments = ev.comments || 'Sem comentários adicionais.';

        // Helper to generate score badges
        const scores = [];
        const labels = {
            'hotel-cleanliness': 'Limpeza',
            'hotel-comfort': 'Conforto',
            'hotel-service': 'Atend. Hotel',
            'internal-food': 'Comida (Int)',
            'internal-service': 'Atend. (Int)',
            'internal-ambiance': 'Ambiente (Int)',
            'beach-food': 'Petiscos (Praia)',
            'beach-service': 'Atend. (Praia)',
            'beach-ambiance': 'Estrutura (Praia)'
        };

        for (const [key, label] of Object.entries(labels)) {
            if (ev[key] > 0) {
                scores.push(`${label}: <span>${ev[key]}</span>`);
            }
        }

        const scoreHtml = scores.map(s => `<div class="score-badge">${s}</div>`).join('');

        card.innerHTML = `
            <div class="feedback-header">
                <strong>${name} (${contact})</strong>
                <span>${date}</span>
            </div>
            <div class="feedback-body">
                <p><em>"${comments}"</em></p>
            </div>
            <div class="feedback-scores">
                ${scoreHtml || '<span style="color:#999; font-size:0.8rem;">Apenas comentários</span>'}
            </div>
        `;

        listContainer.appendChild(card);
    });
}

// Toggle Chat Visibility
function generateAIInsights() {
    const aiSection = document.getElementById('aiInsights');
    // Toggle display
    const isVisible = aiSection.style.display === 'block';
    aiSection.style.display = isVisible ? 'none' : 'block';

    // Auto focus input if opening
    if (!isVisible) {
        setTimeout(() => {
            const input = document.getElementById('chatInput');
            if (input) input.focus();
        }, 100);
    }
}

// Chat Logic Setup
document.addEventListener('DOMContentLoaded', () => {
    // Note: The main DOMContentLoaded at the top of the file handles init
    // We just need to attach the specific chat listeners if they exist

    const sendBtn = document.getElementById('sendChatBtn');
    const chatInput = document.getElementById('chatInput');

    if (sendBtn && chatInput) {
        // Remove old listeners to avoid duplicates if any (though unlikely with page reload)
        const newBtn = sendBtn.cloneNode(true);
        sendBtn.parentNode.replaceChild(newBtn, sendBtn);

        newBtn.addEventListener('click', sendMessage);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }
});

async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    if (!message) return;

    // 1. Add User Message
    appendMessage(message, 'user');
    input.value = '';
    input.setAttribute('disabled', 'true');

    const sendBtn = document.getElementById('sendChatBtn');
    // Check if button exists (it might have been replaced)
    const currentBtn = document.getElementById('sendChatBtn');

    if (currentBtn) {
        currentBtn.disabled = true;
        currentBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    }

    try {
        // 2. Prepare Data
        const rawData = localStorage.getItem('hotelSolarEvaluations');
        const evaluations = rawData ? JSON.parse(rawData) : [];

        // 3. Call Vercel API
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, evaluations })
        });

        const data = await response.json();

        if (response.ok) {
            appendMessage(data.result, 'ai');
        } else {
            appendMessage(`Erro: ${data.error || 'Falha na comunicação.'}`, 'ai');
        }

    } catch (error) {
        console.error('Chat Error:', error);
        appendMessage('Desculpe, a IA precisa de um servidor (Vercel) para funcionar. Localmente, o navegador bloqueia essa conexão.', 'ai');
    } finally {
        input.removeAttribute('disabled');
        input.focus();
        if (currentBtn) {
            currentBtn.disabled = false;
            currentBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
        }
    }
}

function appendMessage(text, sender) {
    const messagesContainer = document.getElementById('chatMessages');
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message');
    msgDiv.classList.add(sender === 'user' ? 'user-message' : 'ai-message');

    // Convert newlines to breaks for AI responses
    msgDiv.innerHTML = text.replace(/\n/g, '<br>');

    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}
