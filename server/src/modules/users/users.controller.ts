import { asyncHandler } from "../../common/utils/async-handler.js";
import { sendSuccessResponse } from "../../common/utils/api-response.js";
import { usersService } from "./users.service.js";
import type { SafeUserRow } from "./users.repository.js";

const toUserContract = (row: SafeUserRow) => ({
  id: row.id,
  name: row.name,
  email: row.email,
  role: row.role,
  createdAt: row.createdAt ? row.createdAt.toISOString() : null,
});

export class UsersController {
  list = asyncHandler(async (req, res) => {
    const { items, total } = await usersService.listUsers(req.query as any);

    return sendSuccessResponse(res, "Users fetched successfully", {
      items: items.map(toUserContract),
      meta: {
        page: (req.query as any).page,
        limit: (req.query as any).limit,
        total,
      },
    });
  });

  getById = asyncHandler(async (req, res) => {
    const user = await usersService.getUserById(req.params.id as string);
    return sendSuccessResponse(res, "User fetched successfully", toUserContract(user));
  });
}

export const usersController = new UsersController();
