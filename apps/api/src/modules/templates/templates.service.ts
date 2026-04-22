import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma.service";

@Injectable()
export class TemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.template.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" }
    });
  }
}

