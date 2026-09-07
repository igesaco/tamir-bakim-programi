import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { InspectionsService } from './inspections.service';
import { CreateInspectionDto } from './dto/create-inspection.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('inspections')
export class InspectionsController {
  constructor(
    private readonly inspectionsService: InspectionsService,
  ) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateInspectionDto) {
    return this.inspectionsService.create(
      req.user.organizationId,
      req.user.branchId,
      req.user.sub,
      dto,
    );
  }

  @Get()
  findAll(@Req() req: any) {
    return this.inspectionsService.findAll(
      req.user.organizationId,
    );
  }

  @Patch(':id/complete')
  complete(@Req() req: any, @Param('id') id: string) {
    return this.inspectionsService.complete(
      req.user.organizationId,
      id,
    );
  }
}
