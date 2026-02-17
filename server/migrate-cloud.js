import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const supabaseUrl = process.env.SUPABASE_URL || 'https://khntkottpfjotcuboxml.supabase.co'
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtobnRrb3R0cGZqb3RjdWJveG1sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTI0MDUwNywiZXhwIjoyMDg2ODE2NTA3fQ.BuwjLIBZJ4OTwaB1O1QWeuMSTqvCzC-MJZS94gbyAq8'

const supabase = createClient(supabaseUrl, supabaseKey)
const STORAGE_BUCKET = 'photos'

async function migrate() {
  console.log('🔧 Starting migration...')

  // 1. Add cloud URL columns to sessions table
  console.log('📋 Adding cloud URL columns...')
  const { error: alterError } = await supabase.rpc('exec_sql', {
    sql: `
      ALTER TABLE sessions 
      ADD COLUMN IF NOT EXISTS cloud_boomerang_url TEXT,
      ADD COLUMN IF NOT EXISTS cloud_static_url TEXT;
    `
  })
  
  if (alterError) {
    console.log('⚠️ Could not add columns via RPC (may need manual SQL). Error:', alterError.message)
    console.log('')
    console.log('👉 Please run this SQL in Supabase Dashboard → SQL Editor:')
    console.log('   ALTER TABLE sessions ADD COLUMN IF NOT EXISTS cloud_boomerang_url TEXT;')
    console.log('   ALTER TABLE sessions ADD COLUMN IF NOT EXISTS cloud_static_url TEXT;')
    console.log('')
  } else {
    console.log('✅ Columns added')
  }

  // 2. Create storage bucket if it doesn't exist
  console.log('📦 Creating storage bucket...')
  const { error: bucketError } = await supabase.storage.createBucket(STORAGE_BUCKET, {
    public: true,
    fileSizeLimit: 52428800, // 50MB
  })
  
  if (bucketError) {
    if (bucketError.message.includes('already exists')) {
      console.log('✅ Bucket already exists')
    } else {
      console.log('⚠️ Bucket error:', bucketError.message)
    }
  } else {
    console.log('✅ Bucket created')
  }

  // 3. Upload existing local files to Supabase Storage
  console.log('☁️ Uploading existing files to cloud...')
  const { data: sessions, error: fetchError } = await supabase
    .from('sessions')
    .select('*')
    .or('cloud_static_url.is.null,cloud_print_url.is.null')
    .order('created_at', { ascending: true })

  if (fetchError) {
    console.error('Failed to fetch sessions:', fetchError)
    return
  }

  console.log(`Found ${sessions.length} sessions without cloud URLs`)
  const uploadsDir = path.join(__dirname, 'uploads')

  for (const session of sessions) {
    let cloudBoomerangUrl = null
    let cloudStaticUrl = null
    let cloudPrintUrl = null
    let cloudFirstPhotoUrl = null

    // Helper to upload a file
    async function uploadFile(filename, storagePath, contentType, label) {
      if (!filename) return null
      const filePath = path.join(uploadsDir, filename)
      if (!fs.existsSync(filePath)) return null
      try {
        const fileBuffer = fs.readFileSync(filePath)
        const { error: uploadErr } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(storagePath, fileBuffer, { contentType, upsert: true })
        if (!uploadErr) {
          const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath)
          console.log(`  ✅ Uploaded ${label} for session ${session.id}`)
          return data.publicUrl
        } else {
          console.log(`  ⚠️ ${label} upload error: ${uploadErr.message}`)
        }
      } catch (err) {
        console.log(`  ⚠️ ${label} file read error: ${err.message}`)
      }
      return null
    }

    if (!session.cloud_boomerang_url) {
      cloudBoomerangUrl = await uploadFile(session.boomerang_filename, `${session.id}/boomerang.gif`, 'image/gif', 'boomerang')
    }
    if (!session.cloud_static_url) {
      cloudStaticUrl = await uploadFile(session.static_image_filename, `${session.id}/static.jpg`, 'image/jpeg', 'static')
    }
    if (!session.cloud_print_url) {
      cloudPrintUrl = await uploadFile(session.print_filename, `${session.id}/print.jpg`, 'image/jpeg', 'print')
    }
    if (!session.cloud_first_photo_url) {
      cloudFirstPhotoUrl = await uploadFile(session.first_photo_filename, `${session.id}/first-photo.jpg`, 'image/jpeg', 'first_photo')
    }

    // Update session with cloud URLs
    const updates = {}
    if (cloudBoomerangUrl) updates.cloud_boomerang_url = cloudBoomerangUrl
    if (cloudStaticUrl) updates.cloud_static_url = cloudStaticUrl
    if (cloudPrintUrl) updates.cloud_print_url = cloudPrintUrl
    if (cloudFirstPhotoUrl) updates.cloud_first_photo_url = cloudFirstPhotoUrl

    if (Object.keys(updates).length > 0) {
      const { error: updateErr } = await supabase
        .from('sessions')
        .update(updates)
        .eq('id', session.id)

      if (updateErr) {
        console.log(`  ⚠️ DB update error: ${updateErr.message}`)
      }
    }
  }

  console.log('')
  console.log('🎉 Migration complete!')
}

migrate().catch(console.error)
