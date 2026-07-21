import React from 'react';
import { parseVideoEmbed } from '../../utils/videoEmbed';

interface VideoEmbedProps {
    url: string;
    title?: string;
}

export const VideoEmbed: React.FC<VideoEmbedProps> = ({ url, title = 'Video' }) => {
    const embed = parseVideoEmbed(url);
    if (!embed) return null;

    return (
        <div className="relative w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 aspect-video">
            <iframe
                src={embed.embedUrl}
                title={title}
                className="absolute inset-0 w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
            />
        </div>
    );
};
