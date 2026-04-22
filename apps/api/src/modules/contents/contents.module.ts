import { Module } from "@nestjs/common";
import { ContentsController } from "./contents.controller";
import { ContentsService } from "./contents.service";
import { PrismaService } from "../../infra/prisma.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [ContentsController],
  providers: [ContentsService, PrismaService]
})
export class ContentsModule {}
