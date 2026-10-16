import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { AuditService, CreateAuditLogDto } from './audit.service';

@Controller('api/v1/audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Post('logs')
  async createLog(@Body() body: CreateAuditLogDto) {
    return this.auditService.createLog(body);
  }

  @Get('logs/count')
  async getCounts() {
    return this.auditService.getCountsByEventType();
  }

  @Get('logs')
  async getLogs(
    @Query('workflow_id') workflowId?: string,
    @Query('event_type') eventType?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    const offsetNum = offset ? parseInt(offset, 10) : 0;
    return this.auditService.getLogs(workflowId, eventType, limitNum, offsetNum);
  }
}
