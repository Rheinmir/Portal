import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false
    }
});

// Since we're using Supabase now, we don't need the local init function
// but we keep the export to not break existing imports until we update them
export const initDatabase = () => {
  console.log('Using Supabase database.');
  
  if (!supabaseUrl || !supabaseKey) {
    console.warn('WARNING: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing.');
  }
};

// Export db to shim existing code if needed, but ideally routes.js will use supabase directly
export const db = null;
