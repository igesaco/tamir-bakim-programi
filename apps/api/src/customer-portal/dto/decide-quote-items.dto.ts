import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsBoolean, IsString, ValidateNested } from 'class-validator';

class QuoteItemDecisionDto {
  @IsString()
  itemId: string;

  @IsBoolean()
  approved: boolean;
}

export class DecideQuoteItemsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => QuoteItemDecisionDto)
  decisions: QuoteItemDecisionDto[];
}
