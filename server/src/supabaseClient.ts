import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials missing. Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
}

// Ahora el cliente limpiará la URL automáticamente
const cleanUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, '');
export const supabase = createClient(cleanUrl, supabaseKey);
