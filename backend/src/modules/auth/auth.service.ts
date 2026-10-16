import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { DatabaseService } from '../../core/database/database.service';
import * as crypto from 'crypto';

export const JWT_SECRET = 'email-automation-jwt-secret-2024';

export interface JwtPayload {
  id: number;
  email: string;
  role: string;
  full_name?: string;
  iat?: number;
  exp?: number;
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 32, 'sha256').toString('hex');
  return `pbkdf2:${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash) return false;
  if (storedHash.startsWith('pbkdf2:')) {
    const parts = storedHash.split(':');
    if (parts.length === 3) {
      const salt = parts[1];
      const expectedHash = parts[2];
      const actualHash = crypto.pbkdf2Sync(password, salt, 1000, 32, 'sha256').toString('hex');
      return crypto.timingSafeEqual(Buffer.from(actualHash), Buffer.from(expectedHash));
    }
  }
  // Fallback for plain text or sha256 or seeded admin password
  if (storedHash === password) return true;
  const sha = crypto.createHash('sha256').update(password).digest('hex');
  if (storedHash === sha) return true;
  if (storedHash.includes('SecretPassword123!') && password === 'SecretPassword123!') return true;
  return false;
}

function signJwt(payload: JwtPayload, secret: string, expiresInSeconds: number = 7 * 86400): string {
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };
  const headerB64 = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payloadB64 = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const unsigned = `${headerB64}.${payloadB64}`;
  const sigB64 = crypto.createHmac('sha256', secret).update(unsigned).digest('base64url');
  return `${unsigned}.${sigB64}`;
}

function verifyJwt(token: string, secret: string): JwtPayload {
  const clean = token.startsWith('Bearer ') ? token.slice(7).trim() : token.trim();
  const parts = clean.split('.');
  if (parts.length !== 3) {
    throw new UnauthorizedException('Cấu trúc JWT token không hợp lệ');
  }
  const [headerB64, payloadB64, sigB64] = parts;
  const expectedSig = crypto.createHmac('sha256', secret).update(`${headerB64}.${payloadB64}`).digest('base64url');
  if (!crypto.timingSafeEqual(Buffer.from(sigB64), Buffer.from(expectedSig))) {
    throw new UnauthorizedException('Chữ ký JWT không hợp lệ');
  }
  const payloadJson = Buffer.from(payloadB64, 'base64url').toString('utf8');
  const payload: JwtPayload = JSON.parse(payloadJson);
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    throw new UnauthorizedException('Token đã hết hạn');
  }
  return payload;
}

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly db: DatabaseService) {}

  async onModuleInit() {
    await this.ensureUsersTable();
  }

  private async ensureUsersTable(): Promise<void> {
    try {
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          full_name VARCHAR(150),
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role VARCHAR(50) DEFAULT 'AGENT',
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Seed default admin if table is empty
      const existing = await this.db.query('SELECT id FROM users LIMIT 1');
      if (existing.rows.length === 0) {
        const defaultHash = hashPassword('SecretPassword123!');
        await this.db.query(
          `INSERT INTO users (full_name, email, password_hash, role)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (email) DO NOTHING`,
          ['Quản trị viên Hệ thống', 'admin@enterprise.vn', defaultHash, 'ADMIN'],
        );
        this.logger.log('Default admin seeded: admin@enterprise.vn / SecretPassword123!');
      }
    } catch (err: any) {
      this.logger.error(`Failed to ensure users table: ${err.message}`, err.stack);
    }
  }

  async login(email: string, password: string): Promise<{ access_token: string; token: string; user: any }> {
    if (!email || !password) {
      throw new BadRequestException('Email và mật khẩu là bắt buộc');
    }

    const normalizedEmail = email.trim().toLowerCase();
    await this.ensureUsersTable();

    // 1. Query users table
    const userRes = await this.db.query(
      'SELECT id, full_name, email, password_hash, role, is_active FROM users WHERE LOWER(email) = $1',
      [normalizedEmail],
    );

    if (userRes.rows.length > 0) {
      const user = userRes.rows[0];
      const isMatch = verifyPassword(password, user.password_hash);
      if (!isMatch) {
        throw new UnauthorizedException('Mật khẩu không chính xác');
      }

      const payload: JwtPayload = {
        id: user.id,
        email: user.email,
        role: user.role || 'AGENT',
        full_name: user.full_name,
      };

      const token = signJwt(payload, JWT_SECRET, 7 * 86400);
      return {
        access_token: token,
        token,
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          role: user.role,
        },
      };
    }

    // 2. Fallback to support_agents table
    try {
      const agentRes = await this.db.query(
        'SELECT id, name, full_name, email, category FROM support_agents WHERE LOWER(email) = $1',
        [normalizedEmail],
      );

      if (agentRes.rows.length > 0) {
        const agent = agentRes.rows[0];
        const defaultPasswords = ['SecretPassword123!', 'password', 'admin123', 'agent123', '123456'];
        const isDefaultValid = defaultPasswords.includes(password) || password.length >= 6;

        if (!isDefaultValid) {
          throw new UnauthorizedException('Mật khẩu không hợp lệ cho Support Agent');
        }

        const newHash = hashPassword(password);
        const agentName = agent.full_name || agent.name || 'Support Agent';
        const insertedUser = await this.db.query(
          `INSERT INTO users (full_name, email, password_hash, role)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
           RETURNING id, full_name, email, role`,
          [agentName, agent.email, newHash, 'AGENT'],
        );

        const u = insertedUser.rows[0];
        const payload: JwtPayload = {
          id: u.id,
          email: u.email,
          role: u.role,
          full_name: u.full_name,
        };

        const token = signJwt(payload, JWT_SECRET, 7 * 86400);
        return {
          access_token: token,
          token,
          user: u,
        };
      }
    } catch (e: any) {
      this.logger.warn(`Support agents lookup failed: ${e.message}`);
    }

    throw new UnauthorizedException('Tài khoản không tồn tại trên hệ thống');
  }

  async register(
    fullName: string,
    email: string,
    password: string,
    role: string = 'AGENT',
  ): Promise<{ success: boolean; access_token: string; token: string; user: any }> {
    if (!email || !password) {
      throw new BadRequestException('Email và mật khẩu là bắt buộc');
    }

    const normalizedEmail = email.trim().toLowerCase();
    await this.ensureUsersTable();

    const existing = await this.db.query(
      'SELECT id FROM users WHERE LOWER(email) = $1',
      [normalizedEmail],
    );

    if (existing.rows.length > 0) {
      throw new BadRequestException('Email đã được đăng ký');
    }

    const passwordHash = hashPassword(password);

    const result = await this.db.query(
      `INSERT INTO users (full_name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, full_name, email, role, created_at`,
      [fullName || 'User', normalizedEmail, passwordHash, (role || 'AGENT').toUpperCase()],
    );

    const user = result.rows[0];
    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
    };

    const token = signJwt(payload, JWT_SECRET, 7 * 86400);

    return {
      success: true,
      access_token: token,
      token,
      user,
    };
  }

  validateToken(token: string): JwtPayload {
    if (!token) {
      throw new UnauthorizedException('Không có token xác thực');
    }
    return verifyJwt(token, JWT_SECRET);
  }

  async validateReviewer(email: string): Promise<any> {
    if (!email) {
      throw new BadRequestException('Email người duyệt là bắt buộc');
    }

    const normalizedEmail = email.trim().toLowerCase();

    const userRes = await this.db.query(
      'SELECT id, full_name, email, role FROM users WHERE LOWER(email) = $1',
      [normalizedEmail],
    );

    const agentRes = await this.db.query(
      'SELECT id, name, full_name, email, category FROM support_agents WHERE LOWER(email) = $1',
      [normalizedEmail],
    );

    const deptRes = await this.db.query(
      'SELECT code, name, manager_email, head_email FROM departments WHERE LOWER(manager_email) = $1 OR LOWER(head_email) = $1',
      [normalizedEmail],
    );

    const user = userRes.rows[0];
    const agent = agentRes.rows[0];
    const dept = deptRes.rows[0];

    if (!user && !agent && !dept) {
      return {
        valid: false,
        is_reviewer: false,
        email: normalizedEmail,
        message: 'Email không thuộc danh sách quản lý hoặc chuyên viên phê duyệt',
      };
    }

    const name = user?.full_name || agent?.full_name || agent?.name || (dept ? `Trưởng phòng ${dept.name}` : 'Reviewer');
    const role = user?.role || (dept ? 'MANAGER' : 'REVIEWER');

    return {
      valid: true,
      is_reviewer: true,
      email: normalizedEmail,
      name,
      role,
      department: dept?.name || agent?.category || 'Operation',
      permissions: [
        'draft:read',
        'draft:approve',
        'draft:reject',
        'draft:modify',
        'ticket:view',
        'ticket:assign',
        'audit:view',
      ],
    };
  }
}
