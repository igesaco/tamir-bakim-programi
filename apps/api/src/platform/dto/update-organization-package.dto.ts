import {
  IsString,
} from 'class-validator';

export class UpdateOrganizationPackageDto {
  @IsString()
  packageId: string;
}
