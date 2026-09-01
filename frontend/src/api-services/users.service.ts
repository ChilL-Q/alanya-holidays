import { apiClient } from "@/lib/api-client";

export interface UserProfile {
  id: string;
  full_name?: string | null;
  avatar_url?: string | null;
  email?: string | null;
  phone?: string | null;
  company_name?: string | null;
  bio?: string | null;
  iban?: string | null;
  bank_name?: string | null;
  bank_account_holder_name?: string | null;
  crypto_wallet?: string | null;
  social_links?: Record<string, string> | null;
  role?: "guest" | "user" | "host" | "admin" | string | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
}

export interface UpdateUserProfilePayload {
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  bio?: string;
  company_name?: string;
  social_links?: Record<string, string>;
  role?: string;
}

export class UsersService {
  /**
   * Fetches user profile by user ID.
   * Dispatches GET /users/:id via apiClient.
   */
  async getUserProfile(userId: string): Promise<UserProfile> {
    const response = await apiClient.get<
      UserProfile | { success?: boolean; data?: UserProfile }
    >(`/users/${encodeURIComponent(userId)}`);

    if (
      response &&
      typeof response === "object" &&
      "data" in response &&
      response.data &&
      typeof response.data === "object"
    ) {
      return response.data as UserProfile;
    }

    return response as UserProfile;
  }

  /**
   * Updates user profile fields (Full Name, Phone, Bio, Company Name, Social Links).
   * Dispatches PUT /users/:id via apiClient.
   */
  async updateUserProfile(
    userId: string,
    updates: Partial<UserProfile> | UpdateUserProfilePayload
  ): Promise<UserProfile | { success: boolean; data?: UserProfile }> {
    const response = await apiClient.put<
      UserProfile | { success: boolean; data?: UserProfile }
    >(`/users/${encodeURIComponent(userId)}`, updates);

    if (
      response &&
      typeof response === "object" &&
      "data" in response &&
      response.data &&
      typeof response.data === "object"
    ) {
      return response.data as UserProfile;
    }

    return response;
  }

  /**
   * Retrieves public profile for a user or host.
   * Dispatches GET /users/:id via apiClient.
   */
  async getPublicProfile(userId: string): Promise<UserProfile> {
    return this.getUserProfile(userId);
  }
}

export const usersService = new UsersService();

export const getUserProfile = (userId: string) =>
  usersService.getUserProfile(userId);

export const updateUserProfile = (
  userId: string,
  updates: Partial<UserProfile> | UpdateUserProfilePayload
) => usersService.updateUserProfile(userId, updates);

export const getPublicProfile = (userId: string) =>
  usersService.getPublicProfile(userId);
