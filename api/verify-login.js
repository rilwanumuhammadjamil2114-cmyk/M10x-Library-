import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action, admissionNumber, password } = req.body;

  if (!admissionNumber || !password) {
    return res.status(400).json({ error: 'Missing parameter input values' });
  }

  try {
    // ---- REGISTER ACTION ENGINE ----
    if (action === 'register') {
      const { data: existingUser } = await supabase
        .from('student_payments')
        .select('admission_number')
        .eq('admission_number', admissionNumber)
        .maybeSingle();

      if (existingUser) {
        return res.status(409).json({ 
          success: false, 
          message: "This admission number is already active. Please try signing in instead." 
        });
      }

      const { error: insertError } = await supabase
        .from('student_payments')
        .insert([{ admission_number: admissionNumber, password: password, paid: false }]);

      if (insertError) throw insertError;
      return res.status(201).json({ success: true, message: "Registration successful." });
    }

    // ---- LOGIN ACTION ENGINE ----
    if (action === 'login') {
      const { data: student, error } = await supabase
        .from('student_payments')
        .select('*')
        .eq('admission_number', admissionNumber)
        .maybeSingle();

      if (error || !student) {
        return res.status(404).json({ 
          success: false, 
          message: "Account record not found. Please click 'Create Account' below to register." 
        });
      }

      if (student.password !== password) {
        return res.status(401).json({ 
          success: false, 
          message: "Incorrect password credentials. Please check your spelling and try again." 
        });
      }

      return res.status(200).json({ success: true, paid: student.paid });
    }

    return res.status(400).json({ error: "Invalid systemic operation action code." });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
