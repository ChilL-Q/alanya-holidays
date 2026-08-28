-- Optional cover image displayed in forum post cards and thread previews.
ALTER TABLE public.forum_posts
ADD COLUMN IF NOT EXISTS image_url TEXT;

COMMENT ON COLUMN public.forum_posts.image_url IS
'Public URL of the optional cover image for the forum post.';
