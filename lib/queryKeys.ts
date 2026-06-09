export const qk = {
  properties: {
    list: (page: number, limit: number, filters?: unknown, location?: string, sort?: string) =>
      ['properties', 'list', page, limit, filters, location, sort] as const,
    detail: (id: string) => ['properties', 'detail', id] as const,
    blockedDates: (id: string) => ['properties', 'blockedDates', id] as const,
    available: (checkIn: string, checkOut: string) => ['properties', 'available', checkIn, checkOut] as const,
    byHost: (hostId: string) => ['properties', 'byHost', hostId] as const,
    byIds: (ids: string[]) => ['properties', 'byIds', ids] as const,
  },

  services: {
    byType: (type: string, page?: number, limit?: number) => ['services', type, page, limit] as const,
    byProvider: (id: string) => ['services', 'byProvider', id] as const,
  },

  bookings: {
    byUser: (userId: string) => ['bookings', 'user', userId] as const,
    byHost: (hostId: string) => ['bookings', 'host', hostId] as const,
  },

  notifications: {
    byUser: (userId: string) => ['notifications', userId] as const,
  },

  conversations: {
    list: () => ['conversations', 'list'] as const,
  },

  favorites: {
    byUser: (userId?: string) => ['favorites', userId] as const,
  },

  blog: {
    posts: (filters?: unknown) => ['blog', 'posts', filters] as const,
    post: (slug: string) => ['blog', 'post', slug] as const,
    categories: () => ['blog', 'categories'] as const,
  },

  forum: {
    posts: (filters?: unknown) => ['forum', 'posts', filters] as const,
    post: (slug: string) => ['forum', 'post', slug] as const,
    comments: (postId: string) => ['forum', 'comments', postId] as const,
    categories: () => ['forum', 'categories'] as const,
  },

  directory: {
    byCategory: (categoryId: string) => ['directory', 'category', categoryId] as const,
    listing: (id: string) => ['directory', 'listing', id] as const,
    analytics: (days: number) => ['directory', 'analytics', days] as const,
    categoryAvg: (categoryId: string) => ['directory', 'categoryAvg', categoryId] as const,
    votes: (userId: string, ids: string[]) => ['directory', 'votes', userId, ids] as const,
  },

  users: {
    profile: (userId: string) => ['users', 'profile', userId] as const,
    adminList: (page: number, limit: number) => ['users', 'admin', page, limit] as const,
  },

  currency: {
    rates: () => ['currency', 'rates'] as const,
  },

  subscriptions: {
    premium: (userId: string) => ['subscriptions', 'premium', userId] as const,
  },

  reviews: {
    byProperty: (id: string) => ['reviews', id] as const,
    byListing: (id: string) => ['listingReviews', id] as const,
  },

  itineraries: {
    byUser: (userId: string) => ['itineraries', userId] as const,
    shared: (token: string) => ['itineraries', 'shared', token] as const,
  },

  locations: {
    all: () => ['locations'] as const,
  },
};
