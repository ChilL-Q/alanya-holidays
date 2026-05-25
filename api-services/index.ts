import { PropertyDB, ServiceDB, Review, Notification, ServiceModel } from '../types/models';

export type PropertyData = PropertyDB;
export type ServiceData = ServiceDB;
export type { Review, Notification, ServiceModel };

export * from './api/properties';
export * from './api/services';
export * from './api/bookings';
export * from './api/audit';
export * from './api/users';
export * from './api/products';
export * from './api/misc';
export * from './api/storage';
export * from './api/notifications';
export * from './api/chat';
export * from './api/directory';
export * from './api/blog';
export * from './api/testimonials';
export * from './api/locations';
export * from './api/itineraries';
export * from './api/listingReviews';
export * from './supabase';
export * from './auth';
export * from './aiService';

import { propertiesService } from './api/properties';
import { servicesService } from './api/services';
import { bookingsService } from './api/bookings';
import { usersService } from './api/users';
import { productsService } from './api/products';
import { messagesService, favoritesService } from './api/misc';
import { storageService } from './api/storage';
import { notificationsService } from './api/notifications';
import { chatService } from './api/chat';
import { yesimService } from './api/yesim';
import { directoryService } from './api/directory';
import { blogService } from './api/blog';
import { testimonialService } from './api/testimonials';
import { locationsService } from './api/locations';
import { itinerariesService } from './api/itineraries';
import { listingReviewsService } from './api/listingReviews';

export const db = {
    ...propertiesService,
    ...servicesService,
    ...bookingsService,
    ...usersService,
    ...productsService,
    ...messagesService,
    ...favoritesService,
    ...storageService,
    ...notificationsService,
    ...chatService,
    ...directoryService,
    ...blogService,
    ...testimonialService,
    ...locationsService,
    ...itinerariesService,
    ...listingReviewsService,
    yesimService
};
