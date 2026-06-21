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
export * from './api/subscriptions';
export * from './api/blog';
export * from './api/forum';
export * from './api/forumEvents';
export * from './api/members';
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
import { subscriptionsService } from './api/subscriptions';
import { blogService } from './api/blog';
import { forumService } from './api/forum';
import { forumEventsService } from './api/forumEvents';
import { membersService } from './api/members';
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
    ...subscriptionsService,
    ...blogService,
    ...forumService,
    ...forumEventsService,
    ...membersService,
    ...testimonialService,
    ...locationsService,
    ...itinerariesService,
    ...listingReviewsService,
    yesimService
};
