// @ts-ignore
import { createClient } from 'npm:@supabase/supabase-js@2'

declare const Deno: any

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const CRON_SECRET = Deno.env.get('CRON_SECRET')

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('SITE_URL') || 'https://alanyaholidays.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
}

const ORPHANED_DAYS = 7
const BLOG_MEDIA_BUCKET = 'blog-media'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Authenticate via cron secret
  const cronSecret = req.headers.get('x-cron-secret')
  if (!cronSecret || cronSecret !== CRON_SECRET) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Step 1: Get all files in the blog-media bucket (files are stored as {userId}/{filename})
    // .list('') returns top-level folder entries (userId dirs), not actual files
    // We must list each userId folder to get the real files
    const { data: folders, error: foldersError } = await supabase.storage
      .from(BLOG_MEDIA_BUCKET)
      .list('', { limit: 1000 })

    if (foldersError) {
      console.error('Failed to list folders:', foldersError)
      return new Response(
        JSON.stringify({ error: 'Failed to list folders', details: foldersError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!folders || folders.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No files to clean up', deleted: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // List files inside each userId folder
    type StorageObject = { name: string; created_at: string; [key: string]: any }
    const objects: (StorageObject & { folderName: string })[] = []

    for (const folder of folders) {
      // Skip non-folder entries (files at root level, if any)
      if (!folder.id && folder.metadata === null) {
        // Virtual folder entry — list its contents
        const { data: files, error: filesError } = await supabase.storage
          .from(BLOG_MEDIA_BUCKET)
          .list(folder.name, { limit: 1000 })

        if (filesError) {
          console.error(`Failed to list files in folder ${folder.name}:`, filesError)
          continue
        }

        for (const file of (files || [])) {
          objects.push({ ...file, folderName: folder.name })
        }
      }
    }

    if (objects.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No files to clean up', deleted: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 2: Build a set of active media_urls from submissions and published posts
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - ORPHANED_DAYS)

    // Get active submissions (pending_review or pending_payment) with media_urls
    const { data: activeSubmissions } = await supabase
      .from('blog_submissions')
      .select('media_urls')
      .in('status', ['pending_payment', 'pending_review'])

    // Get published blog posts (we'd need to extract media from cover_image_url too,
    // but cover_image_url is a single URL, not an array)
    const { data: publishedPosts } = await supabase
      .from('blog_posts')
      .select('cover_image_url')
      .eq('status', 'published')

    // Collect all active URLs
    const activeUrls = new Set<string>()

    for (const sub of (activeSubmissions || [])) {
      for (const url of (sub.media_urls || [])) {
        activeUrls.add(url)
      }
    }

    // Also include cover_image_url from published posts
    for (const post of (publishedPosts || [])) {
      if (post.cover_image_url) {
        activeUrls.add(post.cover_image_url)
      }
    }

    // Step 3: Identify orphaned files older than cutoff
    const orphanedFiles: string[] = []

    for (const obj of objects) {
      const filePath = `${obj.folderName}/${obj.name}` // e.g. "userId/uuid.jpg"
      const fullPath = `${BLOG_MEDIA_BUCKET}/${filePath}`
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${fullPath}`

      // Check if this URL is in active usage
      if (activeUrls.has(publicUrl) || activeUrls.has(filePath)) {
        continue
      }

      // Check file age
      const fileCreatedAt = new Date(obj.created_at)
      if (fileCreatedAt < cutoffDate) {
        orphanedFiles.push(filePath)
      }
    }

    // Step 4: Delete orphaned files
    let deletedCount = 0
    if (orphanedFiles.length > 0) {
      // Delete in batches of 100 (Supabase limit)
      for (let i = 0; i < orphanedFiles.length; i += 100) {
        const batch = orphanedFiles.slice(i, i + 100)
        const { error: deleteError } = await supabase.storage
          .from(BLOG_MEDIA_BUCKET)
          .remove(batch)

        if (deleteError) {
          console.error('Failed to delete batch:', deleteError)
        } else {
          deletedCount += batch.length
        }
      }
    }

    console.warn(`Cleanup complete: ${deletedCount}/${orphanedFiles.length} orphaned files deleted`)

    return new Response(
      JSON.stringify({
        message: 'Cleanup complete',
        orphanedFound: orphanedFiles.length,
        deleted: deletedCount,
        files: orphanedFiles.slice(0, 50), // Return first 50 for logging
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Cleanup error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
