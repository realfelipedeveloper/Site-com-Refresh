import { Module } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma.service";
import { AuthModule } from "../auth/auth.module";
import { ManagementController } from "./management.controller";
import { ManagementService } from "./management.service";

@Module({
  imports: [AuthModule],
  controllers: [ManagementController],
  providers: [ManagementService, PrismaService]
})
export class ManagementModule {}
