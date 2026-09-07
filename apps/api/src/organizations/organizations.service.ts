import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateOrganizationDto) {
    return this.prisma.organization.create({
      data,
    });
  }

  findAll() {
    return this.prisma.organization.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}