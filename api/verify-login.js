import { createClient } from '@supabase/supabase-client';

// Initialize the Supabase Client with your Vercel environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req, res) {
    // Set proper CORS headers
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
        // --- REGISTRATION PIPELINE ---
        if (action === 'register') {
            // Check if the student already exists in your student_payments table
            const { data: existingStudent, error: checkError } = await supabase
                .from('student_payments')
                .select('admission_number')
                .eq('admission_number', admissionNumber)
                .single();

            if (existingStudent) {
                return res.status(400).json({ message: 'This admission number is already registered.' });
            }

            // Insert the record into your exact student_payments table layout
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
                return res.status(500).json({ message: 'Database Insertion Error: ' + insertError.message });
            }

            return res.status(200).json({ message: 'Registration successful!', paid: false });
        }

        // --- LOGIN PIPELINE ---
        if (action === 'login') {
            const { data: student, error: loginError } = await supabase
                .from('student_payments')
                .select('admission_number, password, paid')
                .eq('admission_number', admissionNumber)
                .single();

            if (loginError || !student) {
                return res.status(401).json({ message: 'Admission number not found. Please create an account.' });
            }

            // Plain-text credential matching for the student access portal
            if (student.password !== password) {
                return res.status(401).json({ message: 'Incorrect account password.' });
            }

            return res.status(200).json({ 
                message: 'Login successful!', 
                admissionNumber: student.admission_number, 
                paid: student.paid 
            });
        }

        return res.status(400).json({ message: 'Invalid payload execution parameter status.' });

    } catch (error) {
        return res.status(500).json({ message: 'System Server Failure: ' + error.message });
    }
}
