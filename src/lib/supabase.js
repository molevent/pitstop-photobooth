import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://khntkottpfjotcuboxml.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtobnRrb3R0cGZqb3RjdWJveG1sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTI0MDUwNywiZXhwIjoyMDg2ODE2NTA3fQ.BuwjLIBZJ4OTwaB1O1QWeuMSTqvCzC-MJZS94gbyAq8'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
