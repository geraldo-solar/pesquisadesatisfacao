import { createClient } from '@supabase/supabase-js';

export default async function handler(request, response) {
    // CORS Header
    response.setHeader('Access-Control-Allow-Credentials', true);
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    response.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (request.method === 'OPTIONS') {
        response.status(200).end();
        return;
    }

    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        return response.status(500).json({ error: 'Supabase credentials not configured.' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const evaluationData = request.body;

    // Add timestamp if not present
    if (!evaluationData.timestamp) {
        evaluationData.timestamp = new Date().toISOString();
    }

    const { data, error } = await supabase
        .from('evaluations')
        .insert([evaluationData])
        .select();

    if (error) {
        console.error('Supabase Error:', error);
        return response.status(500).json({ error: error.message });
    }

    return response.status(200).json({ success: true, data });
}
