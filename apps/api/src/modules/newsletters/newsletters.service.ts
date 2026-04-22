import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma.service";

@Injectable()
export class NewslettersService {
  constructor(private readonly prisma: PrismaService) {}

  listCampaigns() {
    return this.prisma.newsletterCampaign.findMany({
      include: { recipientGroup: true },
      orderBy: { createdAt: "desc" }
    });
  }
}

