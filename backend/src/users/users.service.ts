import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async getAllUsers(page = 1, limit = 20, requestUserId: string) {
    const role = await this.usersRepository.getUserRole(requestUserId);
    if (role !== 'admin') throw new UnauthorizedException('Not authorized');

    const { data, count } = await this.usersRepository.getAllUsers(page, limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  async getUserProfile(id: string) {
    const data = await this.usersRepository.getUserProfile(id);
    if (!data) throw new NotFoundException('User not found');
    return data;
  }

  async updateUserProfile(id: string, updates: any, requestUserId: string) {
    const role = await this.usersRepository.getUserRole(requestUserId);

    if (requestUserId !== id && role !== 'admin') {
      throw new UnauthorizedException('Not authorized');
    }

    const safeUpdates = { ...updates };
    if (role !== 'admin') {
      delete safeUpdates.role;
    }

    await this.usersRepository.updateUserProfile(id, safeUpdates);
    return { success: true };
  }

  async getUsersByRole(
    targetRole: string,
    page = 1,
    limit = 20,
    requestUserId: string,
  ) {
    const role = await this.usersRepository.getUserRole(requestUserId);
    if (role !== 'admin') throw new UnauthorizedException('Not authorized');

    const { data, count } = await this.usersRepository.getUsersByRole(targetRole, page, limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  async getForumMembers(limit?: number, onlineOnly?: boolean) {
    const [data, postData] = await Promise.all([
      this.usersRepository.getForumMembers(limit),
      this.usersRepository.getForumPostsAuthors()
    ]);

    const counts = new Map<string, number>();
    for (const row of postData as { author_id: string | null }[]) {
      if (row.author_id)
        counts.set(row.author_id, (counts.get(row.author_id) || 0) + 1);
    }

    const ONLINE_WINDOW_MS = 5 * 60 * 1000;
    const isOnline = (lastSeen: string | null) =>
      lastSeen
        ? Date.now() - new Date(lastSeen).getTime() < ONLINE_WINDOW_MS
        : false;

    let members = (data || []).map((m: any) => ({
      ...m,
      post_count: counts.get(m.id) || 0,
      is_online: isOnline(m.last_seen_at),
    }));

    if (onlineOnly) members = members.filter((m: any) => m.is_online);
    return members;
  }

  async getOnlineCount() {
    const ONLINE_WINDOW_MS = 5 * 60 * 1000;
    const since = new Date(Date.now() - ONLINE_WINDOW_MS).toISOString();
    return this.usersRepository.getOnlineCount(since);
  }

  async touchPresence(userId: string) {
    await this.usersRepository.updatePresence(userId);
    return { success: true };
  }
}
