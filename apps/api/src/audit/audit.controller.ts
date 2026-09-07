import {
  Controller,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuditService } from './audit.service';

@UseGuards(AuthGuard('jwt'))
@Controller('audit')
export class AuditController {
  constructor(
    private readonly auditService: AuditService,
  ) {}

  @Get()
  findAll(@Req() req: any) {
    return this.auditService.findAll(
      req.user.organizationId,
    );
  }
}
