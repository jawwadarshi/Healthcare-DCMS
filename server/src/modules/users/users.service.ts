import { AppError } from "../../common/errors/app-error.js";
import { usersRepository } from "./users.repository.js";
import type { ListUsersQuery } from "./users.validation.js";

export class UsersService {
  async listUsers(query: ListUsersQuery) {
    return await usersRepository.list({
      page: query.page,
      limit: query.limit,
      search: query.search,
      role: query.role,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
  }

  async getUserById(id: string) {
    const user = await usersRepository.findById(id);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  }
}

export const usersService = new UsersService();
