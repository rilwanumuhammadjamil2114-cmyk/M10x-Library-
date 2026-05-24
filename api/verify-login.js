const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req, res) {
    // Enable CORS headers explicitly
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { action, admissionNumber, password } = req.body;

    if (!admissionNumber || !password) {
        return res.status(400).json({ message: 'Missing admission number or password.' });
    }

    try {
        // --- REGISTRATION ---
        if (action === 'register') {
            const { data: existingStudent, error: checkError } = await supabase
                .from('student_payments')
                .select('admission_number')
                .eq('admission_number', admissionNumber)
                .maybeSingle(); // Safe query to prevent collapsing on empty array

            if (existingStudent) {
                return res.status(400).json({ message: 'This admission number is already registered.' });
            }

            const { error: insertError } = await supabase
                .from('student_payments')
                .insert([
                    { 
                        admission_number: admissionNumber, 
                        password: password, 
                        paid: false 
                    }
                ]);

            if (insertError) {
                return res.status(500).json({ message: 'Supabase Insertion Error: ' + insertError.message });
            }

            return res.status(200).json({ message: 'Registration successful!', paid: false });
        }

        // --- LOGIN ---
        if (action === 'login') {
            const { data: student, error: loginError } = await supabase
                .from('student_payments')
                .select('admission_number, password, paid')
                .eq('admission_number', admissionNumber)
                .maybeSingle();

            if (loginError || !student) {
                return res.status(401).json({ message: 'Admission number not found.' });
            }

            if (student.password !== password) {
                return res.status(401).json({ message: 'Incorrect account password.' });
            }

            return res.status(200).json({ 
                message: 'Login successful!', 
                admissionNumber: student.admission_number, 
                paid: student.paid 
            });
        }

        return res.status(400).json({ message: 'Invalid action configuration parameter.' });

    } catch (error) {
        return res.status(500).json({ message: 'Server Process Fault: ' + error.message });
    }
}
