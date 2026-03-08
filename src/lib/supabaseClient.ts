import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || ''

// For server-side operations (use service role key)
export const supabaseServer = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false,
  }
})

// For client-side operations (use anon key)
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  }
})

export async function initializeSupabaseDatabase() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.log('⚠️  Supabase credentials not configured. Using SQLite fallback.')
    return false
  }

  try {
    // Test connection
    const { data, error } = await supabaseServer
      .from('users')
      .select('count', { count: 'exact' })
      .limit(0)
    
    if (error) {
      console.error('❌ Supabase connection failed:', error.message)
      return false
    }
    
    console.log('✅ Supabase connection successful')
    return true
  } catch (error) {
    console.error('❌ Supabase initialization error:', error)
    return false
  }
}

export const useSupabase = () => {
  return supabaseUrl && supabaseServiceRoleKey ? true : false
}