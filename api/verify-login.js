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

  const { admissionNumber } = req.body;
  if (!admissionNumber) return res.status(400).json({ error: 'Identifier input missing' });

  try {
    // 1. Check if the user already exists in the tracking registry
    let { data: student, error } = await supabase
      .from('student_payments')
      .select('*')
      .eq('admission_number', admissionNumber)
      .maybeSingle();

    // 2. AUTO-TRACK NEW USERS: If they don't exist yet, insert them automatically!
    if (!student) {
      const { data: newStudent, error: insertError } = await supabase
        .from('student_payments')
        .insert([{ admission_number: admissionNumber, paid: false }])
        .select()
        .single();

      if (insertError) throw insertError;
      student = newStudent;
    }

    // 3. Evaluate active access verification clearance status
    if (student.paid === true) {
      return res.status(200).json({ success: true, message: "Clearance approved." });
    } else {
      return res.status(403).json({ 
        success: false, 
        message: "Access Blocked! Your profile has been tracked. Please pay the handout coordinator to activate your login." 
      });
    }

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
