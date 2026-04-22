import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import {
  IsArray,
  IsBoolean,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested
} from "class-validator";
import { Type } from "class-transformer";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../auth/permissions.guard";
import { RequirePermissions } from "../auth/permissions.decorator";
import { ManagementService } from "./management.service";

class UpsertContentTypeDto {
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
  @IsBoolean()
  allowRichText?: boolean;

  @IsOptional()
  @IsBoolean()
  allowFeaturedMedia?: boolean;

  @IsOptional()
  @IsObject()
  schemaJson?: Record<string, unknown>;
}

class UpsertPermissionDto {
  @IsString()
  @MinLength(3)
  code!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

class UpsertApplicationDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(2)
  area!: string;

  @IsString()
  @MinLength(2)
  link!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

class UpsertRoleApplicationAccessDto {
  @IsString()
  @MinLength(1)
  roleId!: string;

  @IsString()
  @MinLength(1)
  appId!: string;

  @IsOptional()
  @IsBoolean()
  canCreate?: boolean;

  @IsOptional()
  @IsBoolean()
  canUpdate?: boolean;

  @IsOptional()
  @IsBoolean()
  canDelete?: boolean;

  @IsOptional()
  @IsBoolean()
  canAccess?: boolean;
}

class RoleMenuAccessDto {
  @IsString()
  topMenu!: string;

  @IsString()
  viewKey!: string;
}

class UpsertRoleDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  functionName?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  parentRoleId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissionIds?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoleMenuAccessDto)
  menuAccesses?: RoleMenuAccessDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sectionIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  contentTypeIds?: string[];
}

class UpsertUserDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(3)
  email!: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  username?: string;

  @IsOptional()
  @IsString()
  @MinLength(11)
  cpf?: string;

  @IsOptional()
  @IsString()
  cnh?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  jobTitle?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  zipCode?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  secondaryAddress?: string;

  @IsOptional()
  @IsString()
  secondaryNumber?: string;

  @IsOptional()
  @IsString()
  secondaryComplement?: string;

  @IsOptional()
  @IsString()
  neighborhood?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  facebook?: string;

  @IsOptional()
  @IsString()
  instagram?: string;

  @IsOptional()
  @IsString()
  youtube?: string;

  @IsOptional()
  @IsBoolean()
  forcePasswordChange?: boolean;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isSuperAdmin?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roleIds?: string[];
}

class UpsertNewsletterGroupDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

class UpsertSystemEmailDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(3)
  email!: string;

  @IsString()
  @MinLength(2)
  area!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  value?: string;
}

class UpsertTemplateDto {
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
  @IsString()
  componentKey?: string;

  @IsOptional()
  @IsObject()
  configSchema?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

class UpsertElementDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  thumbLabel?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  category?: string;
}

@Controller("management")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ManagementController {
  constructor(private readonly managementService: ManagementService) {}

  @Get("bootstrap")
  @RequirePermissions("management.read")
  bootstrap() {
    return this.managementService.bootstrap();
  }

  @Post("content-types")
  @RequirePermissions("contents.write")
  createContentType(@Body() body: UpsertContentTypeDto) {
    return this.managementService.createContentType(body);
  }

  @Patch("content-types/:id")
  @RequirePermissions("contents.write")
  updateContentType(@Param("id") id: string, @Body() body: UpsertContentTypeDto) {
    return this.managementService.updateContentType(id, body);
  }

  @Delete("content-types/:id")
  @RequirePermissions("contents.write")
  deleteContentType(@Param("id") id: string) {
    return this.managementService.deleteContentType(id);
  }

  @Post("permissions")
  @RequirePermissions("management.write")
  createPermission(@Body() body: UpsertPermissionDto) {
    return this.managementService.createPermission(body);
  }

  @Patch("permissions/:id")
  @RequirePermissions("management.write")
  updatePermission(@Param("id") id: string, @Body() body: UpsertPermissionDto) {
    return this.managementService.updatePermission(id, body);
  }

  @Delete("permissions/:id")
  @RequirePermissions("management.write")
  deletePermission(@Param("id") id: string) {
    return this.managementService.deletePermission(id);
  }

  @Post("applications")
  @RequirePermissions("management.write")
  createApplication(@Body() body: UpsertApplicationDto) {
    return this.managementService.createApplication(body);
  }

  @Patch("applications/:id")
  @RequirePermissions("management.write")
  updateApplication(@Param("id") id: string, @Body() body: UpsertApplicationDto) {
    return this.managementService.updateApplication(id, body);
  }

  @Delete("applications/:id")
  @RequirePermissions("management.write")
  deleteApplication(@Param("id") id: string) {
    return this.managementService.deleteApplication(id);
  }

  @Post("role-application-accesses")
  @RequirePermissions("management.write")
  createRoleApplicationAccess(@Body() body: UpsertRoleApplicationAccessDto) {
    return this.managementService.createRoleApplicationAccess(body);
  }

  @Patch("role-application-accesses/:id")
  @RequirePermissions("management.write")
  updateRoleApplicationAccess(@Param("id") id: string, @Body() body: UpsertRoleApplicationAccessDto) {
    return this.managementService.updateRoleApplicationAccess(id, body);
  }

  @Delete("role-application-accesses/:id")
  @RequirePermissions("management.write")
  deleteRoleApplicationAccess(@Param("id") id: string) {
    return this.managementService.deleteRoleApplicationAccess(id);
  }

  @Post("roles")
  @RequirePermissions("management.write")
  createRole(@Body() body: UpsertRoleDto) {
    return this.managementService.createRole(body);
  }

  @Patch("roles/:id")
  @RequirePermissions("management.write")
  updateRole(@Param("id") id: string, @Body() body: UpsertRoleDto) {
    return this.managementService.updateRole(id, body);
  }

  @Delete("roles/:id")
  @RequirePermissions("management.write")
  deleteRole(@Param("id") id: string) {
    return this.managementService.deleteRole(id);
  }

  @Post("users")
  @RequirePermissions("management.write")
  createUser(@Body() body: UpsertUserDto) {
    return this.managementService.createUser(body);
  }

  @Patch("users/:id")
  @RequirePermissions("management.write")
  updateUser(@Param("id") id: string, @Body() body: UpsertUserDto) {
    return this.managementService.updateUser(id, body);
  }

  @Delete("users/:id")
  @RequirePermissions("management.write")
  deleteUser(@Param("id") id: string) {
    return this.managementService.deleteUser(id);
  }

  @Post("templates")
  @RequirePermissions("management.write")
  createTemplate(@Body() body: UpsertTemplateDto) {
    return this.managementService.createTemplate(body);
  }

  @Patch("templates/:id")
  @RequirePermissions("management.write")
  updateTemplate(@Param("id") id: string, @Body() body: UpsertTemplateDto) {
    return this.managementService.updateTemplate(id, body);
  }

  @Delete("templates/:id")
  @RequirePermissions("management.write")
  deleteTemplate(@Param("id") id: string) {
    return this.managementService.deleteTemplate(id);
  }

  @Post("elements")
  @RequirePermissions("management.write")
  createElement(@Body() body: UpsertElementDto) {
    return this.managementService.createElement(body);
  }

  @Patch("elements/:id")
  @RequirePermissions("management.write")
  updateElement(@Param("id") id: string, @Body() body: UpsertElementDto) {
    return this.managementService.updateElement(id, body);
  }

  @Delete("elements/:id")
  @RequirePermissions("management.write")
  deleteElement(@Param("id") id: string) {
    return this.managementService.deleteElement(id);
  }

  @Post("newsletter-groups")
  @RequirePermissions("management.write")
  createNewsletterGroup(@Body() body: UpsertNewsletterGroupDto) {
    return this.managementService.createNewsletterGroup(body);
  }

  @Patch("newsletter-groups/:id")
  @RequirePermissions("management.write")
  updateNewsletterGroup(@Param("id") id: string, @Body() body: UpsertNewsletterGroupDto) {
    return this.managementService.updateNewsletterGroup(id, body);
  }

  @Post("system-emails")
  @RequirePermissions("management.write")
  createSystemEmail(@Body() body: UpsertSystemEmailDto) {
    return this.managementService.createSystemEmail(body);
  }

  @Patch("system-emails/:id")
  @RequirePermissions("management.write")
  updateSystemEmail(@Param("id") id: string, @Body() body: UpsertSystemEmailDto) {
    return this.managementService.updateSystemEmail(id, body);
  }

  @Delete("system-emails/:id")
  @RequirePermissions("management.write")
  deleteSystemEmail(@Param("id") id: string) {
    return this.managementService.deleteSystemEmail(id);
  }

  @Post("statistics/reset")
  @RequirePermissions("management.write")
  resetStatistics() {
    return this.managementService.resetStatistics();
  }
}
