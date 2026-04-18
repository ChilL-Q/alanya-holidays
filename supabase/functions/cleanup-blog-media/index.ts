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
    const allFolders: any[] = []
    let folderOffset = 0
    const PAGE_LIMIT = 1000

    while (true) {
      const { data: folders, error: foldersError } = await supabase.storage
        .from(BLOG_MEDIA_BUCKET)
        .list('', { limit: PAGE_LIMIT, offset: folderOffset })

      if (foldersError) {
        console.error('Failed to list folders:', foldersError)
        return new Response(
          JSON.stringify({ error: 'Failed to list folders', details: foldersError }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!folders || folders.length === 0) break
      allFolders.push(...folders)
      if (folders.length < PAGE_LIMIT) break
      folderOffset += PAGE_LIMIT
    }

    if (allFolders.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No files to clean up', deleted: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // List files inside each userId folder
    type StorageObject = { name: string; created_at: string; [key: string]: any }
    const objects: (StorageObject & { folderName: string })[] = []

    for (const folder of allFolders) {
      // Skip non-folder entries (files at root level, if any)
      if (!folder.id && folder.metadata === null) {
        // Virtual folder entry — list its contents with pagination
        let fileOffset = 0
        while (true) {
          const { data: files, error: filesError } = await supabase.storage
            .from(BLOG_MEDIA_BUCKET)
            .list(folder.name, { limit: PAGE_LIMIT, offset: fileOffset })

          if (filesError) {
            console.error(`Failed to list files in folder ${folder.name}:`, filesError)
            break
          }

          if (!files || files.length === 0) break

          for (const file of files) {
            objects.push({ ...file, folderName: folder.name })
          }

          if (files.length < PAGE_LIMIT) break
          fileOffset += PAGE_LIMIT
        }
      }
    }

    if (objects.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No files to clean up', deleted: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 2: Build sets of active and abandoned media_urls
    const now = new Date()
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - ORPHANED_DAYS)

    const abandonedCutoff = new Date()
    abandonedCutoff.setDate(abandonedCutoff.getDate() - 1) // 24 hours [A2-H3]

    // A2-M2: Auto-reject expired submissions
    const { data: expiredSubmissions, error: expiredError } = await supabase
      .from('blog_submissions')
      .update({
        status: 'rejected',
        rejection_reason: 'Payment expired'
      })
      .eq('status', 'pending_payment')
      .lt('payment_expires_at', now.toISOString())
      .select('id')

    if (expiredError) {
      console.error('Failed to auto-reject expired submissions:', expiredError)
    } else if (expiredSubmissions && expiredSubmissions.length > 0) {
      console.warn(`Auto-rejected ${expiredSubmissions.length} expired submissions`)
    }

    // Get submissions to determine which files to keep or delete aggressively
    const { data: rawSubmissions } = await supabase
      .from('blog_submissions')
      .select('status, payment_expires_at, media_urls')
      .in('status', ['pending_payment', 'pending_review'])

    const activeUrls = new Set<string>()
    const abandonedUrls = new Set<string>()

    for (const sub of (rawSubmissions || [])) {
      const urls = sub.media_urls || []

      if (sub.status === 'pending_review') {
        urls.forEach((url: string) => activeUrls.add(url))
      } else if (sub.status === 'pending_payment') {
        if (sub.payment_expires_at && new Date(sub.payment_expires_at) > now) {
          // Still active (within payment window)
          urls.forEach((url: string) => activeUrls.add(url))
        } else if (sub.payment_expires_at && new Date(sub.payment_expires_at) < abandonedCutoff) {
          // Abandoned for > 24h [A2-H3]
          urls.forEach((url: string) => abandonedUrls.add(url))
        }
        // Note: if expired but < 24h ago, we don't put in activeUrls (they become orphans)
        // but we don't put in abandonedUrls yet (so they follow the 7-day rule).
      }
    }

    // Get published blog posts
    const { data: publishedPosts } = await supabase
      .from('blog_posts')
      .select('cover_image_url')
      .eq('status', 'published')

    // Add cover images to activeUrls
    for (const post of (publishedPosts || [])) {
      if (post.cover_image_url) {
        activeUrls.add(post.cover_image_url)
      }
    }

    // Step 3: Identify orphaned files
    const orphanedFiles: string[] = []

    for (const obj of objects) {
      const filePath = `${obj.folderName}/${obj.name}` // e.g. "userId/uuid.jpg"
      const fullPath = `${BLOG_MEDIA_BUCKET}/${filePath}`
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${fullPath}`

      // 1. Keep if in active usage
      if (activeUrls.has(publicUrl) || activeUrls.has(filePath)) {
        continue
      }

      // 2. Delete if in abandoned submissions (> 24h since expiry) [A2-H3]
      if (abandonedUrls.has(publicUrl) || abandonedUrls.has(filePath)) {
        orphanedFiles.push(filePath)
        continue
      }

      // 3. Delete if general orphan older than cutoff (7 days)
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
