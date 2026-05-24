import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://eofuiygbwlhdxjlmumja.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvZnVpeWdid2xoZHhqbG11bWphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2MDcxNzEsImV4cCI6MjA5NTE4MzE3MX0.w6YMQ0AQEM_sEFyxnWDcbq7CE6-rJQA9HDhfQaR_4hM"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

