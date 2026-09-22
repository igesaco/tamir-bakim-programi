import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AiService } from './ai.service';
import { DiagnoseDto } from './dto/diagnose.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('diagnose')
  diagnose(@Body() dto: DiagnoseDto) {
    return this.aiService.diagnose(dto);
  }
}
