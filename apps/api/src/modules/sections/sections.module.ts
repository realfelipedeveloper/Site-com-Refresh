import { Module } from "@nestjs/common";
import { SectionsController } from "./sections.controller";
import { SectionsService } from "./sections.service";
import { PrismaService } from "../../infra/prisma.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [SectionsController],
  providers: [SectionsService, PrismaService]
})
export class SectionsModule {}
