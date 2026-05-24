const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { level } = req.query;

    if (!level) {
        return res.status(400).json({ message: 'Academic tier level identifier required.' });
    }

    try {
        const { data: handoutsData, error } = await supabase
            .from('handouts')
            .select('id, level, course_code, title, creator, classification, icon, link, description')
            .eq('level', parseInt(level));

        if (error) {
            return res.status(500).json({ message: 'Failed to extract ledger elements: ' + error.message });
        }

        return res.status(200).json(handoutsData || []);

    } catch (error) {
        return res.status(500).json({ message: 'Internal Engine Loop Crash: ' + error.message });
    }
}
