import { db } from '../api-services';
import { BlogPost, ForumPost, DirectoryListingDB } from '../types/models';

/** Forum post with relevance score for sorting */
export interface ForumPostWithScore extends ForumPost {
    matchScore: number;
}

/** Directory listing with relevance score for sorting */
export interface DirectoryListingWithScore extends DirectoryListingDB {
    matchScore: number;
}

/**
 * Extract keywords from title and body (1-3 words)
 */
function extractKeywords(title: string, body: string = ''): Set<string> {
    const text = (title + ' ' + body).toLowerCase();
    // Remove common words and split
    const commonWords = new Set([
        'the', 'a', 'an', 'and', 'or', 'in', 'to', 'for', 'of', 'is', 'it',
        'that', 'this', 'with', 'as', 'be', 'on', 'at', 'by', 'from', 'about',
        'about', 'can', 'will', 'how', 'what', 'where', 'when', 'why',
    ]);

    const words = text
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 3 && !commonWords.has(w));

    // Take first 3 significant words
    return new Set(words.slice(0, 3));
}

/**
 * Calculate match score based on category match + keyword overlap
 */
function calculateMatchScore(
    keywords: Set<string>,
    categoryMatch: boolean,
    targetKeywords: Set<string>
): number {
    let score = 0;

    // Category match: 50 points
    if (categoryMatch) {
        score += 50;
    }

    // Keyword overlap: 0-50 points (max 3 keywords = up to 16.67 points each)
    let overlapCount = 0;
    for (const keyword of keywords) {
        if (targetKeywords.has(keyword)) {
            overlapCount += 1;
        }
    }
    score += Math.min(50, overlapCount * 16.67);

    return Math.round(score);
}

/**
 * Get forum discussions related to a blog post or directory listing
 * Matches by category slug + keyword overlap in title/body
 */
export async function getRelatedDiscussions(
    post: BlogPost | DirectoryListingDB,
    limit: number = 5
): Promise<ForumPostWithScore[]> {
    try {
        // Extract keywords from the source post
        const isBlogPost = 'excerpt' in post;
        const sourceTitle = isBlogPost ? post.title : post.name;
        const sourceBody = isBlogPost ? (post.content || '') : (post.short_description || '');
        const sourceKeywords = extractKeywords(sourceTitle, sourceBody);

        // Get the category to match against (blog posts use 'category', listings use 'category_id')
        const sourceCategory = isBlogPost ? post.category : null;

        // Fetch all forum posts (limit reasonably to avoid N+1)
        const { data: allPosts } = await db.getForumPosts({ limit: 100 });

        // Score and filter posts
        const scoredPosts: ForumPostWithScore[] = allPosts
            .map(post => {
                const targetKeywords = extractKeywords(post.title, post.body || '');
                const categoryMatch = sourceCategory ? post.category?.slug === sourceCategory : false;
                const matchScore = calculateMatchScore(sourceKeywords, categoryMatch, targetKeywords);

                return {
                    ...post,
                    matchScore,
                };
            })
            .filter(p => p.matchScore > 0) // Only include posts with some match
            .sort((a, b) => b.matchScore - a.matchScore) // Sort by score descending
            .slice(0, limit);

        // Deduplicate by ID
        const seen = new Set<string>();
        return scoredPosts.filter(p => {
            if (seen.has(p.id)) return false;
            seen.add(p.id);
            return true;
        });
    } catch (error) {
        console.error('Failed to get related discussions:', error);
        return [];
    }
}

/**
 * Get directory listings related to a forum post
 * Matches by category + keyword overlap
 */
export async function getRelatedListings(
    post: ForumPost,
    limit: number = 5
): Promise<DirectoryListingWithScore[]> {
    try {
        // Extract keywords from the forum post
        const sourceKeywords = extractKeywords(post.title, post.body || '');

        // Get listings from the same category if available
        const categoryId = post.category?.id;

        // Fetch directory listings
        const { data: allListings } = await db.getDirectoryListings(1, 100, categoryId);

        // Score and filter listings
        const scoredListings: DirectoryListingWithScore[] = allListings
            .map(listing => {
                const targetKeywords = extractKeywords(listing.name, listing.short_description || '');
                const categoryMatch = categoryId ? listing.category_id === categoryId : false;
                const matchScore = calculateMatchScore(sourceKeywords, categoryMatch, targetKeywords);

                return {
                    ...listing,
                    matchScore,
                };
            })
            .filter(l => l.matchScore > 0) // Only include listings with some match
            .sort((a, b) => b.matchScore - a.matchScore) // Sort by score descending
            .slice(0, limit);

        // Deduplicate by ID
        const seen = new Set<string>();
        return scoredListings.filter(l => {
            if (seen.has(l.id)) return false;
            seen.add(l.id);
            return true;
        });
    } catch (error) {
        console.error('Failed to get related listings:', error);
        return [];
    }
}
