import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { IsBoolean, IsInt, IsOptional, IsString, MinLength } from "class-validator";
import { SectionsService } from "./sections.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../auth/permissions.guard";
import { RequirePermissions } from "../auth/permissions.decorator";

class UpsertSectionDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  order?: number;

  @IsOptional()
  @IsBoolean()
  visibleInMenu?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  parentId?: string;
}

@Controller("sections")
export class SectionsController {
  constructor(private readonly sectionsService: SectionsService) {}

  @Get()
  list() {
    return this.sectionsService.listTree();
  }

  @Get("admin/list")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("sections.read")
  listAdmin() {
    return this.sectionsService.listAdmin();
  }

  @Post("admin")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("sections.write")
  create(@Body() body: UpsertSectionDto) {
    return this.sectionsService.create(body);
  }

  @Patch("admin/:id")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("sections.write")
  update(@Param("id") id: string, @Body() body: UpsertSectionDto) {
    return this.sectionsService.update(id, body);
  }

  @Delete("admin/:id")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("sections.write")
  remove(@Param("id") id: string) {
    return this.sectionsService.remove(id);
  }
}
