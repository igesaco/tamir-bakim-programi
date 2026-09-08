import {
  IsHexColor,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateOrganizationBrandingDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  logoUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  panelTitle?: string;

  @IsOptional()
  @IsHexColor()
  primaryColor?: string;

  @IsOptional()
  @IsHexColor()
  secondaryColor?: string;

  @IsOptional()
  @IsHexColor()
  sidebarColor?: string;

  @IsOptional()
  @IsIn(['classic', 'desktop', 'focus'])
  defaultPanelMode?: string;

  @IsOptional()
  @IsIn(['soft', 'technical', 'graphite'])
  defaultWallpaper?: string;
}
