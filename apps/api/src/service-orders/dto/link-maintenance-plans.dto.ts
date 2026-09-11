import { ArrayMaxSize, ArrayUnique, IsArray, IsString } from 'class-validator';
export class LinkMaintenancePlansDto {
  @IsArray() @ArrayUnique() @ArrayMaxSize(50) @IsString({ each: true }) ids: string[];
}
