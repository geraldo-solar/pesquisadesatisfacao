export default async function handler(request, response) {
    // CORS configuration
    response.setHeader('Access-Control-Allow-Credentials', true);
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    response.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Handle OPTIONS request
    if (request.method === 'OPTIONS') {
        response.status(200).end();
        return;
    }

    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method not allowed' });
    }

    const { message, evaluations } = request.body;
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        return response.status(500).json({ error: 'OpenAI API Key not configured' });
    }

    try {
        // Prepare context from evaluations
        // Limit context size to avoid token limits (rudimentary approach)
        const context = JSON.stringify(evaluations).substring(0, 15000);

        const systemPrompt = `Você é um assistente de IA especialista em análise de satisfação do cliente para o 'Hotel Solar'.
    Você tem acesso às avaliações recentes dos hóspedes.
    Responda às perguntas do usuário com base NESSES dados.
    Seja conciso, profissional e estratégico.
    Destaque tendências, problemas recorrentes e elogios comuns.
    
    Dados das Avaliações (JSON):
    ${context}`;

        const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: message }
                ],
                temperature: 0.7,
                max_tokens: 500
            })
        });

        const data = await openAiResponse.json();

        if (!openAiResponse.ok) {
            throw new Error(data.error?.message || 'Failed to fetch from OpenAI');
        }

        return response.status(200).json({ result: data.choices[0].message.content });

    } catch (error) {
        console.error('OpenAI Error:', error);
        return response.status(500).json({ error: 'Error processing your request', details: error.message });
    }
}
