import { Body, Controller, Get, Post } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';

@Controller('organizations')
export class OrganizationsController {
  constructor(
    private readonly organizationsService: OrganizationsService,
  ) {}

  @Post()
  create(@Body() data: CreateOrganizationDto) {
    return this.organizationsService.create(data);
  }

  @Get()
  findAll() {
    return this.organizationsService.findAll();
  }
}