import { DirectoryListingDB } from '../types/models';
import { Language } from '../context/LanguageContext';

export function getListingDescription(
    listing: DirectoryListingDB,
    language: Language
): string {
    return listing.descriptions?.[language]
        || listing.descriptions?.en
        || listing.short_description
        || '';
}
