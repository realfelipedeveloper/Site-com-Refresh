import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

type PasswordResetMailPayload = {
  expiresInMinutes: number;
  resetUrl: string;
  to: string;
  userName: string;
};

@Injectable()
export class PasswordResetMailService {
  private readonly logger = new Logger(PasswordResetMailService.name);

  constructor(private readonly configService: ConfigService) {}

  async assertPasswordResetTransportReady() {
    const smtpHost = this.getSmtpHost();

    if (!smtpHost) {
      throw new Error("SMTP_HOST nao configurado para recuperacao de senha.");
    }

    const transporter = nodemailer.createTransport(this.getTransportOptions(smtpHost));

    try {
      await transporter.verify();
    } finally {
      transporter.close();
    }
  }

  async sendPasswordResetInstructions(payload: PasswordResetMailPayload) {
    const smtpHost = this.getSmtpHost();

    if (!smtpHost) {
      this.logger.warn("SMTP_HOST nao configurado. Instrucoes de recuperacao nao foram enviadas.");
      return;
    }

    const transporter = nodemailer.createTransport(this.getTransportOptions(smtpHost));
    const from = this.configService.get<string>("SMTP_FROM")?.trim() || "no-reply@abbatech.local";

    try {
      await transporter.sendMail({
        from,
        to: payload.to,
        subject: "Recuperação de acesso - Refresh",
        text: this.buildTextBody(payload),
        html: this.buildHtmlBody(payload)
      });
    } finally {
      transporter.close();
    }
  }

  private getTransportOptions(host: string): SMTPTransport.Options {
    const port = Number(this.configService.get<string>("SMTP_PORT") ?? (host === "mailpit" ? 1025 : 587));
    const smtpUser = this.configService.get<string>("SMTP_USER")?.trim();
    const smtpPassword = this.configService.get<string>("SMTP_PASSWORD") ?? "";
    const configuredSecure = this.configService.get<string>("SMTP_SECURE")?.trim().toLowerCase();
    const secure = configuredSecure ? configuredSecure === "true" : port === 465;

    return {
      host,
      port,
      secure,
      ...(this.shouldUseAuth(host) && smtpUser ? { auth: { user: smtpUser, pass: smtpPassword } } : {})
    };
  }

  private getSmtpHost() {
    const configuredHost = this.configService.get<string>("SMTP_HOST")?.trim();

    if (configuredHost) {
      return configuredHost;
    }

    const appEnv = this.configService.get<string>("APP_ENV")?.trim().toLowerCase();
    if (appEnv === "development" || appEnv === "local-prod") {
      return "mailpit";
    }

    return undefined;
  }

  private shouldUseAuth(host: string) {
    const configuredValue = this.configService.get<string>("SMTP_REQUIRE_AUTH")?.trim().toLowerCase();

    if (configuredValue) {
      return configuredValue === "true";
    }

    return host !== "mailpit";
  }

  private buildTextBody(payload: PasswordResetMailPayload) {
    return [
      `Olá, ${payload.userName}.`,
      "",
      "Recebemos uma solicitação para recuperar seu acesso ao Refresh.",
      `Acesse o link abaixo para definir uma nova senha. O link expira em ${payload.expiresInMinutes} minutos.`,
      "",
      payload.resetUrl,
      "",
      "Se você não solicitou esta recuperação, ignore esta mensagem."
    ].join("\n");
  }

  private buildHtmlBody(payload: PasswordResetMailPayload) {
    return `
      <div style="font-family: Arial, sans-serif; color: #16324f; line-height: 1.55;">
        <h1 style="font-size: 20px; margin: 0 0 16px;">Recuperação de acesso</h1>
        <p>Olá, ${this.escapeHtml(payload.userName)}.</p>
        <p>Recebemos uma solicitação para recuperar seu acesso ao Refresh.</p>
        <p>Use o link abaixo para definir uma nova senha. O link expira em ${payload.expiresInMinutes} minutos.</p>
        <p>
          <a href="${this.escapeAttribute(payload.resetUrl)}" style="display: inline-block; background: #16324f; color: #ffffff; padding: 10px 14px; border-radius: 6px; text-decoration: none; font-weight: 700;">
            Redefinir senha
          </a>
        </p>
        <p style="font-size: 13px; color: #58708a;">Se você não solicitou esta recuperação, ignore esta mensagem.</p>
      </div>
    `;
  }

  private escapeHtml(value: string) {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  private escapeAttribute(value: string) {
    return this.escapeHtml(value);
  }
}
