import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma.service";

@Injectable()
export class PrivacyService {
  constructor(private readonly prisma: PrismaService) {}

  getPolicySnapshot() {
    return {
      dataProtectionOfficer: {
        name: process.env.LGPD_DPO_NAME,
        email: process.env.LGPD_DPO_EMAIL
      },
      retentionDays: Number(process.env.LGPD_RETENTION_DAYS ?? 365),
      principles: [
        "minimizacao de dados",
        "controle de acesso",
        "auditoria",
        "retencao limitada",
        "consentimento rastreavel"
      ]
    };
  }

  createRequest(payload: { type: string; subjectEmail: string; description?: string }) {
    return this.prisma.privacyRequest.create({
      data: payload
    });
  }
}

