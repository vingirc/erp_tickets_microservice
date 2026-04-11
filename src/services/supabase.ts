import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://slwvejyddzmytboumtgf.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsd3ZlanlkZHpteXRib3VtdGdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzOTcxODMsImV4cCI6MjA4OTk3MzE4M30.K8koG27b7TLMih8VBh09dAT1x6c5KQU3hs_PfAmKT1Q';

export const supabase = createClient(supabaseUrl, supabaseKey);