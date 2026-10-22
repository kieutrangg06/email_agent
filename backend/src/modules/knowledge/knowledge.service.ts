import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { DatabaseService } from '../../core/database/database.service';

export const KNOWLEDGE_EMBEDDING_DIMENSION = 768; // Gemini text-embedding-004 standard dimension

export interface CreateKnowledgeDto {
  title: string;
  content: string;
  category?: string;
  topic?: string;
  keywords?: string;
  embedding?: number[];
}

export interface SearchKnowledgeDto {
  query_embedding?: number[];
  top_k?: number;
  query_text?: string;
  query?: string;
  query_keywords?: string[];
}

@Injectable()
export class KnowledgeService implements OnModuleInit {
  private readonly logger = new Logger(KnowledgeService.name);

  constructor(private readonly db: DatabaseService) {}

  async onModuleInit() {
    await this.ensureKnowledgeTable();
  }

  private async ensureKnowledgeTable(): Promise<void> {
    try {
      await this.db.query('CREATE EXTENSION IF NOT EXISTS vector;');
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS knowledge_base (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          topic TEXT,
          keywords TEXT,
          content TEXT NOT NULL,
          embedding vector(768),
          category VARCHAR(50) DEFAULT 'TECH',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_knowledge_base_category ON knowledge_base (category);
        CREATE INDEX IF NOT EXISTS idx_knowledge_base_title ON knowledge_base (title);
      `);
    } catch (err: any) {
      this.logger.error(`Failed to ensure knowledge_base table: ${err.message}`, err.stack);
    }
  }

  async create(dto: CreateKnowledgeDto): Promise<any> {
    await this.ensureKnowledgeTable();

    if (!dto.title || !dto.content) {
      throw new BadRequestException('Tiêu đề (title) và nội dung (content) là bắt buộc');
    }

    const title = dto.title.trim();
    const content = dto.content.trim();
    const category = (dto.category || 'TECH').trim();
    const topic = (dto.topic || title).trim();
    const keywords = (dto.keywords || '').trim();

    if (dto.embedding && Array.isArray(dto.embedding) && dto.embedding.length === KNOWLEDGE_EMBEDDING_DIMENSION) {
      const vectorStr = `[${dto.embedding.join(',')}]`;
      const res = await this.db.query(
        `INSERT INTO knowledge_base (title, topic, keywords, content, category, embedding, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6::vector, CURRENT_TIMESTAMP)
         RETURNING id, title, topic, keywords, content, category, (embedding IS NOT NULL) as has_embedding, created_at, updated_at`,
        [title, topic, keywords, content, category, vectorStr],
      );
      return res.rows[0];
    } else {
      if (dto.embedding && Array.isArray(dto.embedding) && dto.embedding.length > 0) {
        this.logger.warn(
          `Embedding vector dimension mismatch: expected ${KNOWLEDGE_EMBEDDING_DIMENSION}, got ${dto.embedding.length}. Storing without vector.`,
        );
      }
      const res = await this.db.query(
        `INSERT INTO knowledge_base (title, topic, keywords, content, category, updated_at)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
         RETURNING id, title, topic, keywords, content, category, false as has_embedding, created_at, updated_at`,
        [title, topic, keywords, content, category],
      );
      return res.rows[0];
    }
  }

  async findAll(category?: string, search?: string): Promise<any[]> {
    await this.ensureKnowledgeTable();

    let sql = `
      SELECT id, title, topic, keywords, content, category,
             (embedding IS NOT NULL) as has_embedding,
             created_at, updated_at
      FROM knowledge_base
      WHERE 1=1
    `;
    const params: any[] = [];

    if (category) {
      params.push(category.trim().toUpperCase());
      sql += ` AND UPPER(category) = $${params.length}`;
    }

    if (search) {
      params.push(`%${search.trim()}%`);
      sql += ` AND (title ILIKE $${params.length} OR content ILIKE $${params.length} OR keywords ILIKE $${params.length})`;
    }

    sql += ' ORDER BY id DESC';

    const res = await this.db.query(sql, params);
    return res.rows;
  }

  async findOne(id: number): Promise<any> {
    await this.ensureKnowledgeTable();

    const res = await this.db.query(
      `SELECT id, title, topic, keywords, content, category,
              (embedding IS NOT NULL) as has_embedding,
              created_at, updated_at
       FROM knowledge_base
       WHERE id = $1`,
      [id],
    );

    if (res.rows.length === 0) {
      throw new NotFoundException(`Không tìm thấy tài liệu Knowledge base #${id}`);
    }

    return res.rows[0];
  }

  async searchByVector(queryEmbedding: any, topK: number = 5, queryText?: string): Promise<any[]> {
    await this.ensureKnowledgeTable();

    const limit = Math.max(1, Math.min(topK || 5, 50));
    let rawVec: number[] = [];

    if (Array.isArray(queryEmbedding)) {
      rawVec = queryEmbedding;
    } else if (queryEmbedding && Array.isArray(queryEmbedding.values)) {
      rawVec = queryEmbedding.values;
    } else if (queryEmbedding && typeof queryEmbedding === 'object' && queryEmbedding.embedding && Array.isArray(queryEmbedding.embedding.values)) {
      rawVec = queryEmbedding.embedding.values;
    }

    // Validate that query embedding matches 768 dimensions (Gemini text-embedding-004)
    if (rawVec.length === KNOWLEDGE_EMBEDDING_DIMENSION) {
      try {
        const vectorStr = `[${rawVec.join(',')}]`;
        const res = await this.db.query(
          `SELECT id, title, topic, keywords, content, category, created_at, updated_at,
                  1 - (embedding <=> $1::vector) as similarity
           FROM knowledge_base
           WHERE embedding IS NOT NULL
           ORDER BY embedding <=> $1::vector ASC
           LIMIT $2`,
          [vectorStr, limit],
        );
        if (res.rows.length > 0) {
          return res.rows;
        }
      } catch (err: any) {
        this.logger.warn(`Vector cosine search failed, falling back to top docs: ${err.message}`);
      }
    } else if (rawVec.length > 0) {
      this.logger.warn(
        `Vector dimension mismatch: expected ${KNOWLEDGE_EMBEDDING_DIMENSION} (Gemini text-embedding-004), received ${rawVec.length}. Skipping pgvector cosine search and using fallback docs.`,
      );
    }

    // If queryText is provided, try keyword text search
    if (queryText && typeof queryText === 'string' && queryText.trim()) {
      try {
        const searchPattern = `%${queryText.trim().replace(/\s+/g, '%')}%`;
        const textRes = await this.db.query(
          `SELECT id, title, topic, keywords, content, category, created_at, updated_at,
                  0.92 as similarity
           FROM knowledge_base
           WHERE title ILIKE $1 OR content ILIKE $1 OR keywords ILIKE $1
           LIMIT $2`,
          [searchPattern, limit],
        );
        if (textRes.rows.length > 0) {
          return textRes.rows;
        }
      } catch (err: any) {
        this.logger.warn(`Keyword search fallback error: ${err.message}`);
      }
    }

    // Fallback: return top knowledge base articles with high default similarity
    const fallbackRes = await this.db.query(
      `SELECT id, title, topic, keywords, content, category, created_at, updated_at,
              0.88 as similarity
       FROM knowledge_base
       ORDER BY id ASC
       LIMIT $1`,
      [limit],
    );
    return fallbackRes.rows;
  }

  async delete(id: number): Promise<{ success: boolean; message: string; deleted_id: number }> {
    await this.ensureKnowledgeTable();

    const res = await this.db.query('DELETE FROM knowledge_base WHERE id = $1 RETURNING id', [id]);

    if (res.rows.length === 0) {
      throw new NotFoundException(`Không tìm thấy tài liệu Knowledge base #${id} để xóa`);
    }

    return {
      success: true,
      message: `Đã xóa tài liệu #${id} thành công`,
      deleted_id: id,
    };
  }
}
