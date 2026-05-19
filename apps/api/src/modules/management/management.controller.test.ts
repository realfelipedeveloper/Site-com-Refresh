import { describe, expect, it, vi } from "vitest";

import { ManagementController } from "./management.controller";

function createController() {
  const managementService = {
    createUser: vi.fn(async (payload) => ({ id: "user-1", ...payload })),
    updateUser: vi.fn()
  };
  const uploadService = {
    saveUserImage: vi.fn()
  };

  return {
    controller: new ManagementController(managementService as never, uploadService as never),
    managementService,
    uploadService
  };
}

describe("ManagementController user upload handling", () => {
  it("creates users without requiring an image upload", async () => {
    const { controller, managementService, uploadService } = createController();

    await expect(
      controller.createUser({
        email: "admin@example.test",
        name: "Admin",
        password: "Senha123",
        username: "admin"
      } as never, undefined as never)
    ).resolves.toEqual(expect.objectContaining({ id: "user-1" }));

    expect(uploadService.saveUserImage).not.toHaveBeenCalled();
    expect(managementService.createUser).toHaveBeenCalledWith(
      expect.not.objectContaining({
        picture: expect.anything()
      })
    );
  });

  it("sends the stored image URL when a profile image is uploaded", async () => {
    const { controller, managementService, uploadService } = createController();
    uploadService.saveUserImage.mockResolvedValue("http://localhost:3333/api/v1/media/users/admin/avatar.jpg");

    await controller.createUser(
      {
        email: "admin@example.test",
        name: "Admin",
        password: "Senha123",
        username: "admin"
      } as never,
      {
        originalname: "avatar.jpg"
      } as Express.Multer.File
    );

    expect(managementService.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        picture: "http://localhost:3333/api/v1/media/users/admin/avatar.jpg"
      })
    );
  });
});
