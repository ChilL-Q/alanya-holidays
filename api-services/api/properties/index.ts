import {
    getPropertiesByIds, createProperty, getProperties, getAvailableProperties,
    getProperty, getPropertiesByHost, getAdminProperties,
    updateProperty, updatePropertyStatus, deleteProperty
} from './crud';
import { getReviews, getReviewCount, addReview, deleteReview, flagReview, unflagReview, getFlaggedReviews, bulkDeleteReviews } from './reviews';
import { getPropertyTypes, getPropertyLocations, getPropertiesByLocation } from './catalog';
import {
    getPropertyAvailability, updatePropertyAvailability,
    syncPropertyCalendar, getUnavailableDates
} from './availability';
import { getICalFeeds, addICalFeed, removeICalFeed } from './ical';

export const propertiesService = {
    // CRUD
    getPropertiesByIds,
    createProperty,
    getProperties,
    getAvailableProperties,
    getProperty,
    getPropertiesByHost,
    getAdminProperties,
    updateProperty,
    updatePropertyStatus,
    approveProperty: (id: string) => updatePropertyStatus(id, 'approved'),
    deleteProperty,

    // Reviews
    getReviews,
    getReviewCount,
    addReview,
    deleteReview,
    flagReview,
    unflagReview,
    getFlaggedReviews,
    bulkDeleteReviews,

    // Catalog
    getPropertyTypes,
    getPropertyLocations,
    getPropertiesByLocation,

    // Availability
    getPropertyAvailability,
    updatePropertyAvailability,
    syncPropertyCalendar,
    getUnavailableDates,

    // iCal
    getICalFeeds,
    addICalFeed,
    removeICalFeed,
};
