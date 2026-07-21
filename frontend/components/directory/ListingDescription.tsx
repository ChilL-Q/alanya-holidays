import React, { useMemo, useState } from 'react';
import { ListingDescriptions } from '../../types/models';
import { useLanguage } from '../../context/LanguageContext';

// Display order + labels for every language a listing description can hold.
// German (de) has no site-UI locale, so it is surfaced only here, via the
// per-description switcher, rather than the global language selector.
const LANG_META: { code: keyof ListingDescriptions; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'tr', label: 'Türkçe' },
    { code: 'ru', label: 'Русский' },
    { code: 'ar', label: 'العربية' },
    { code: 'de', label: 'Deutsch' },
];

interface ListingDescriptionProps {
    descriptions?: ListingDescriptions;
    shortDescription: string;
}

export const ListingDescription: React.FC<ListingDescriptionProps> = ({ descriptions, shortDescription }) => {
    const { language } = useLanguage();

    // Languages that actually have content, in display order.
    const available = useMemo(
        () => LANG_META.filter(({ code }) => descriptions?.[code]?.trim()),
        [descriptions],
    );

    // Default to the active site language if translated, else English, else the
    // first available translation.
    const preferred =
        (descriptions?.[language as keyof ListingDescriptions]?.trim() && (language as keyof ListingDescriptions)) ||
        (descriptions?.en?.trim() && 'en') ||
        available[0]?.code;

    const [selected, setSelected] = useState<keyof ListingDescriptions | undefined>(preferred);

    const active = selected && descriptions?.[selected]?.trim() ? selected : preferred;
    const text = (active && descriptions?.[active]?.trim()) || shortDescription;

    return (
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-6 border border-slate-100 dark:border-slate-800/50">
            <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">About</h2>
                {available.length > 1 && (
                    <div className="flex flex-wrap gap-1.5">
                        {available.map(({ code, label }) => (
                            <button
                                key={code}
                                type="button"
                                onClick={() => setSelected(code)}
                                className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                                    active === code
                                        ? 'bg-teal-600 text-white'
                                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <p
                className="text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap"
                dir={active === 'ar' ? 'rtl' : 'ltr'}
            >
                {text}
            </p>
        </div>
    );
};
