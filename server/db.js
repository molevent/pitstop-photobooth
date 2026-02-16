import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || 'https://khntkottpfjotcuboxml.supabase.co'
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtobnRrb3R0cGZqb3RjdWJveG1sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTI0MDUwNywiZXhwIjoyMDg2ODE2NTA3fQ.BuwjLIBZJ4OTwaB1O1QWeuMSTqvCzC-MJZS94gbyAq8'

const supabase = createClient(supabaseUrl, supabaseKey)

// Database operations
const db = {
  // Insert a new session
  async insertSession(id, printFilename, boomerangFilename, boomerangUrl, firstPhotoFilename, staticImageFilename, staticImageUrl) {
    const { error } = await supabase
      .from('sessions')
      .insert({
        id,
        print_filename: printFilename,
        boomerang_filename: boomerangFilename,
        boomerang_url: boomerangUrl,
        first_photo_filename: firstPhotoFilename,
        static_image_filename: staticImageFilename,
        static_image_url: staticImageUrl
      })
    
    if (error) throw error
  },

  // Get all sessions ordered by created_at desc
  async getAllSessions() {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Get a single session by ID
  async getSessionById(id) {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) return null
    return data
  },

  // Delete a session by ID
  async deleteSession(id) {
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

export { supabase, db }
