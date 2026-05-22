import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Readable } from "stream";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { UploadService } from "./upload.service";

const minioMocks = vi.hoisted(() => ({
  bucketExists: vi.fn(),
  getObject: vi.fn(),
  makeBucket: vi.fn(),
  putObject: vi.fn(),
  statObject: vi.fn()
}));

vi.mock("minio", () => ({
  Client: vi.fn(function Client() {
    return minioMocks;
  })
}));

describe("UploadService security", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:3333/api/v1";
    process.env.S3_BUCKET = "refresh-test-media";
    minioMocks.bucketExists.mockResolvedValue(true);
    minioMocks.putObject.mockResolvedValue(undefined);
    minioMocks.statObject.mockResolvedValue({ metaData: { "content-type": "image/png" } });
    minioMocks.getObject.mockResolvedValue(Readable.from(["image-bytes"]));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it("stores profile images under a sanitized username and encoded public URL", async () => {
    vi.spyOn(Date, "now").mockReturnValue(1_762_000_000_000);
    const service = new UploadService();

    await expect(
      service.saveUserImage(
        {
          buffer: Buffer.from("image"),
          mimetype: "image/png",
          originalname: "avatar.png",
          size: 5
        } as Express.Multer.File,
        "Maria Refresh"
      )
    ).resolves.toBe("http://localhost:3333/api/v1/media/users/maria-refresh/1762000000000.png");

    expect(minioMocks.putObject).toHaveBeenCalledWith(
      "refresh-test-media",
      "users/maria-refresh/1762000000000.png",
      Buffer.from("image"),
      5,
      { "Content-Type": "image/png" }
    );
  });

  it("rejects empty files, forbidden extensions and mismatched MIME types", async () => {
    const service = new UploadService();
    const baseFile = {
      buffer: Buffer.from("image"),
      mimetype: "image/png",
      originalname: "avatar.png",
      size: 5
    } as Express.Multer.File;

    await expect(
      service.saveUserImage({ ...baseFile, buffer: Buffer.alloc(0), size: 0 }, "maria")
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.saveUserImage({ ...baseFile, mimetype: "application/javascript", originalname: "avatar.js" }, "maria")
    ).rejects.toThrow("Formato de imagem nao permitido.");
    await expect(
      service.saveUserImage({ ...baseFile, mimetype: "image/jpeg", originalname: "avatar.png" }, "maria")
    ).rejects.toThrow("Formato de imagem nao permitido.");
  });

  it("does not resolve media paths containing traversal segments", async () => {
    const service = new UploadService();

    await expect(service.getUserImage("../admin", "../../secret.png")).rejects.toThrow(NotFoundException);
    expect(minioMocks.getObject).not.toHaveBeenCalled();
  });

  it("serves known user images with stored content type metadata", async () => {
    const service = new UploadService();

    await expect(service.getUserImage("maria", "avatar.png")).resolves.toEqual({
      contentType: "image/png",
      stream: expect.any(Readable)
    });
  });
});
