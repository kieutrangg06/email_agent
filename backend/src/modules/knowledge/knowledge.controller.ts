import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import {
  KnowledgeService,
  CreateKnowledgeDto,
  SearchKnowledgeDto,
} from './knowledge.service';

@Controller('api/v1/knowledge')
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @Post()
  async createKnowledge(@Body() body: CreateKnowledgeDto) {
    return this.knowledgeService.create(body);
  }

  @Get()
  async getKnowledge(
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    return this.knowledgeService.findAll(category, search);
  }

  @Post('search')
  async searchKnowledge(@Body() body: SearchKnowledgeDto) {
    return this.knowledgeService.searchByVector(
      body.query_embedding,
      body.top_k,
      body.query_text || body.query,
    );
  }

  @Get(':id')
  async getKnowledgeById(@Param('id', ParseIntPipe) id: number) {
    return this.knowledgeService.findOne(id);
  }

  @Delete(':id')
  async deleteKnowledge(@Param('id', ParseIntPipe) id: number) {
    return this.knowledgeService.delete(id);
  }
}
