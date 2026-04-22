import { Body, Controller, Get, Post } from "@nestjs/common";
import { PrivacyService } from "./privacy.service";
import { IsEmail, IsIn, IsOptional, IsString } from "class-validator";

class CreatePrivacyRequestDto {
  @IsIn(["access", "correction", "anonymization", "deletion"])
  type!: "access" | "correction" | "anonymization" | "deletion";

  @IsEmail()
  subjectEmail!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

@Controller("privacy")
export class PrivacyController {
  constructor(private readonly privacyService: PrivacyService) {}

  @Get("policy")
  getPolicy() {
    return this.privacyService.getPolicySnapshot();
  }

  @Post("requests")
  createRequest(@Body() body: CreatePrivacyRequestDto) {
    return this.privacyService.createRequest(body);
  }
}

