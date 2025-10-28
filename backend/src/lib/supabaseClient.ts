import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '../config';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error('Supabase URL and Service Key must be provided.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
