import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://arbcjbrusvtrnvnbqgzs.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_vDRw-3LTtsPsyU-wxwKVhw_VhqbHHMs';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
