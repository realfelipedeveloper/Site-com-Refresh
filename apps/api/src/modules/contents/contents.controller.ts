import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards
} from "@nestjs/common";
import {
  IsIn,
  IsOptional,
  IsString,
  MinLength
} from "class-validator";
import { ContentsService } from "./contents.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../auth/permissions.guard";
import { RequirePermissions } from "../auth/permissions.decorator";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthenticatedUser } from "../auth/auth.types";

class UpsertContentDto {
  @IsString()
  @MinLength(2)
  title!: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  excerpt?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsIn(["draft", "published", "archived"])
  status?: "draft" | "published" | "archived";

  @IsOptional()
  @IsIn(["public", "private"])
  visibility?: "public" | "private";

  @IsString()
  sectionId!: string;

  @IsString()
  contentTypeId!: string;

  @IsOptional()
  @IsString()
  templateId?: string;

  @IsOptional()
  @IsString()
  featuredMediaId?: string;

  @IsOptional()
  @IsString()
  seoTitle?: string;

  @IsOptional()
  @IsString()
  seoDescription?: string;

  @IsOptional()
  @IsString()
  seoKeywords?: string;

  @IsOptional()
  @IsString()
  seoCanonicalUrl?: string;

  @IsOptional()
  @IsString()
  seoRobots?: string;
}

@Controller("contents")
export class ContentsController {
  constructor(private readonly contentsService: ContentsService) {}

  @Get()
  list() {
    return this.contentsService.listPublished();
  }

  @Get("meta")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("contents.read")
  getMeta(@CurrentUser() user: AuthenticatedUser) {
    return this.contentsService.getEditorMeta(user);
  }

  @Get("admin/list")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("contents.read")
  listAdmin(@CurrentUser() user: AuthenticatedUser) {
    return this.contentsService.listAdmin(user);
  }

  @Post("admin")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("contents.write")
  create(@CurrentUser() user: AuthenticatedUser, @Body() body: UpsertContentDto) {
    return this.contentsService.create(user, body);
  }

  @Patch("admin/:id")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("contents.write")
  update(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UpsertContentDto
  ) {
    return this.contentsService.update(id, user, body);
  }

  @Delete("admin/:id")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("contents.write")
  remove(@Param("id") id: string) {
    return this.contentsService.remove(id);
  }

  @Get(":slug")
  findBySlug(@Param("slug") slug: string) {
    return this.contentsService.findBySlug(slug);
  }
}
