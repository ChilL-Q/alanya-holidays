import { propertiesService } from './api/properties';
import { servicesService } from './api/services';
import { bookingsService } from './api/bookings';
import { usersService } from './api/users';
import { productsService } from './api/products';
import { messagesService, favoritesService } from './api/misc';
import { storageService } from './api/storage';
import { notificationsService } from './api/notifications';

// Re-export types for backward compatibility
// Mapping new names to old names where originally defined in db.ts
export type { 
    PropertyDB as PropertyData, 
    ServiceDB as ServiceData, 
    Product as ProductData, 
    Review, 
    Notification,
    Amenity,
    ServiceFeatures,
    ServiceModel
} from '../types/index';

export const db = {
    ...propertiesService,
    ...servicesService,
    ...bookingsService,
    ...usersService,
    ...productsService,
    ...messagesService,
    ...favoritesService,
    ...storageService,
    ...notificationsService
};
