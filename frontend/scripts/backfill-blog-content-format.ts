import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { formatBlogContent } from '../utils/formatBlogContent';

dotenv.config({ path: resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const WRITE = process.argv.includes('--write');

function getCliFlagValue(flagName: string): string | null {
    const index = process.argv.indexOf(flagName);
    return index !== -1 ? process.argv[index + 1] : null;
}

const BACKUP_PATH = getCliFlagValue('--from-backup');

interface BlogPostRow {
    id: string;
    slug: string;
    title: string;
    content: string | null;
}

function isAlreadyFormatted(content: string): boolean {
    // formatBlogContent always wraps paragraphs in <p>; raw textarea dumps never contain it.
    return content.includes('<p>');
}

function preview(text: string, length = 160): string {
    const flat = text.replace(/\s+/g, ' ').trim();
    return flat.length > length ? `${flat.slice(0, length)}…` : flat;
}

async function loadCandidatePosts(): Promise<BlogPostRow[]> {
    if (BACKUP_PATH) {
        // Backup files hold the raw pre-markdown text, so every entry is a candidate.
        const raw = readFileSync(resolve(process.cwd(), BACKUP_PATH), 'utf-8');
        const posts = JSON.parse(raw) as BlogPostRow[];
        return posts.filter((p) => p.content && p.content.trim().length > 0);
    }

    const { data, error } = await supabase
        .from('blog_posts')
        .select('id, slug, title, content')
        .eq('status', 'published');

    if (error) {
        console.error('Failed to fetch blog_posts:', error.message);
        process.exit(1);
    }

    const posts = (data ?? []) as BlogPostRow[];
    return posts.filter((p) => p.content && p.content.trim().length > 0 && !isAlreadyFormatted(p.content));
}

async function main() {
    const candidates = await loadCandidatePosts();

    console.log(`Mode: ${WRITE ? 'WRITE (will update DB)' : 'DRY RUN (no changes will be made)'}`);
    console.log(`Source: ${BACKUP_PATH ? `backup file (${BACKUP_PATH})` : 'live published blog_posts'}`);
    console.log(`Candidates to reformat: ${candidates.length}`);
    console.log('---');

    if (candidates.length === 0) {
        console.log('Nothing to do.');
        return;
    }

    for (const post of candidates) {
        const formatted = formatBlogContent(post.content!.trim(), []);

        console.log(`\n[${post.slug}] "${post.title || '(no title in source)'}"`);
        console.log(`  before: ${preview(post.content!)}`);
        console.log(`  after:  ${preview(formatted)}`);

        if (WRITE) {
            const { error: updateError } = await supabase
                .from('blog_posts')
                .update({ content: formatted })
                .eq('id', post.id);

            if (updateError) {
                console.error(`  FAILED to update ${post.slug}:`, updateError.message);
            } else {
                console.log('  ✓ updated');
            }
        }
    }

    console.log('---');
    console.log(
        WRITE
            ? `Done. ${candidates.length} post(s) updated.`
            : `Dry run complete. Re-run with --write to apply these changes to ${candidates.length} post(s).`
    );
}

main();
