const INACTIVITY_LIMIT_MS = 10 * 60 * 1000; // 10 minutes
let inactivityTimer;

document.addEventListener('DOMContentLoaded', () => {
    console.log('[Admin] Initializing...');

    // Refresh Button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) refreshBtn.addEventListener('click', loadDashboardData);

    // AI Insights Button
    const aiBtn = document.getElementById('aiBtn');
    if (aiBtn) aiBtn.addEventListener('click', generateAIInsights);

    // Logout Button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            window.location.reload();
        });
    }

    // Login Logic
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            console.log('[Admin] Login submit...');
            const password = document.getElementById('adminPassword').value;

            if (password === 'metron82') {
                console.log('[Admin] Password correct. Authenticating...');
                // In-memory authentication only - No storage
                window.isAuthenticated = true;

                document.getElementById('loginOverlay').style.display = 'none';
                document.body.classList.remove('locked');

                // Force load
                loadDashboardData();
                startInactivityTracker();
            } else {
                console.warn('[Admin] Password incorrect.');
                document.getElementById('loginError').innerText = 'Senha incorreta.';
            }
        });
    }
});

// Initial State: Always Locked (HTML default)

function startInactivityTracker() {
    resetInactivityTimer();
    // Listen for activity
    window.addEventListener('mousemove', resetInactivityTimer);
    window.addEventListener('click', resetInactivityTimer);
    window.addEventListener('keypress', resetInactivityTimer);
    window.addEventListener('scroll', resetInactivityTimer);
    window.addEventListener('touchmove', resetInactivityTimer);
}

function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(logoutUser, INACTIVITY_LIMIT_MS);
}

function logoutUser() {
    // Just reload to reset state
    window.location.reload();
}

async function loadDashboardData() {
    // Only load if authenticated (in-memory)
    if (!window.isAuthenticated) return;

    try {
        // 1. Fetch data from Supabase API
        const response = await fetch('/api/get_evaluations');
        const result = await response.json();

        let evaluations = [];
        if (result.success && result.data) {
            evaluations = result.data;
        } else {
            console.error('API Error:', result.error);
            // Fallback to local storage if API fails or returns error
            const rawData = localStorage.getItem('hotelSolarEvaluations');
            evaluations = rawData ? JSON.parse(rawData) : [];
        }

        // 2. Update Basic Stats
        updateStats(evaluations);

        // 3. Render List
        renderFeedbackList(evaluations);

    } catch (error) {
        console.error('Fetch Error:', error);
        // Fallback
        const rawData = localStorage.getItem('hotelSolarEvaluations');
        const evaluations = rawData ? JSON.parse(rawData) : [];
        updateStats(evaluations);
        renderFeedbackList(evaluations);
    }
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
        // 2. Prepare Data (Filter by Date)
        // Switch to API source instead of LocalStorage
        let evaluations = [];
        try {
            const apiResponse = await fetch('/api/get_evaluations');
            const result = await apiResponse.json();
            if (result.success && result.data) {
                evaluations = result.data;
                console.log('[AI Debug] Fetched:', evaluations.length, 'evaluations');
            } else {
                throw new Error('API returned no data');
            }
        } catch (e) {
            console.warn('Chat API fetch failed, falling back to local:', e);
            const rawData = localStorage.getItem('hotelSolarEvaluations');
            evaluations = rawData ? JSON.parse(rawData) : [];
        }

        const originalCount = evaluations.length;

        // Date Filtering
        const startDateInput = document.getElementById('aiStartDate').value;
        const endDateInput = document.getElementById('aiEndDate').value;

        let dateContext = "todo o período";

        if (startDateInput || endDateInput) {
            console.log('[AI Debug] Filtering dates. Input:', startDateInput, 'to', endDateInput);

            // Fix: Use generic date parsing to avoid timezone offset issues on "YYYY-MM-DD"
            // If we use new Date("2026-02-19"), it might be treated as UTC and shift day in local time
            // Let's create dates using components to ensure local day match

            let start = new Date(0);
            if (startDateInput) {
                const [sy, sm, sd] = startDateInput.split('-').map(Number);
                start = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
            }

            let end = new Date(); // Now
            if (endDateInput) {
                const [ey, em, ed] = endDateInput.split('-').map(Number);
                end = new Date(ey, em - 1, ed, 23, 59, 59, 999);
            } else {
                // If no end date, defaulting to NOW is fine, but let's make sure it covers the whole day
                end.setHours(23, 59, 59, 999);
            }

            console.log('[AI Debug] Filter Window:', start, 'to', end);

            evaluations = evaluations.filter(ev => {
                const evDate = new Date(ev.timestamp);
                const isMatch = evDate >= start && evDate <= end;
                // console.log(`[AI Debug] Checking ${ev.id}: ${evDate.toLocaleString()} >= ${start.toLocaleString()} && <= ${end.toLocaleString()} ? ${isMatch}`);
                return isMatch;
            });

            dateContext = `o período de ${startDateInput || 'início'} até ${endDateInput || 'hoje'}`;
            console.log('[AI Debug] Post-filter count:', evaluations.length);
        }

        if (evaluations.length === 0) {
            appendMessage(`Não encontrei avaliações para ${dateContext}.`, 'ai');
            return;
        }

        // 3. Call Vercel API
        // Enhanced Prompt: Append instructions for SWOT and Employees
        const enhancedMessage = `${message}\n\n[INSTRUÇÃO DO SISTEMA]: Analise as ${evaluations.length} avaliações filtradas para ${dateContext}. 
        Sempre inclua explicitamente:
        1. ✅ Pontos Fortes (Strengths)
        2. ⚠️ Pontos Fracos (Weaknesses)
        3. 🏆 Funcionário Destaque: Mencione nomes de funcionários elogiados e conte quantas vezes foram citados. Se ninguém for citado, diga "Nenhum funcionário citado especificamente".
        `;

        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: enhancedMessage, evaluations })
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
