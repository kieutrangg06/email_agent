import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Headers,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';

export class LoginDto {
  email: string;
  password: string;
}

export class RegisterDto {
  full_name?: string;
  fullName?: string;
  email: string;
  password: string;
  role?: string;
}

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: LoginDto) {
    if (!body || !body.email || !body.password) {
      throw new BadRequestException('Vui lòng cung cấp email và mật khẩu');
    }
    return this.authService.login(body.email, body.password);
  }

  @Post('register')
  async register(@Body() body: RegisterDto) {
    const fullName = body.full_name || body.fullName || 'User';
    if (!body || !body.email || !body.password) {
      throw new BadRequestException('Vui lòng cung cấp email và mật khẩu');
    }
    return this.authService.register(fullName, body.email, body.password, body.role);
  }

  @Get('validate-reviewer')
  async validateReviewer(@Query('email') email: string) {
    if (!email) {
      throw new BadRequestException('Query param ?email=xxx là bắt buộc');
    }
    return this.authService.validateReviewer(email);
  }

  @Post('validate-reviewer')
  async validateReviewerPost(@Body() body: { email?: string; reviewer_email?: string }) {
    const email = body.email || body.reviewer_email;
    if (!email) {
      throw new BadRequestException('Email hoặc reviewer_email là bắt buộc trong body');
    }
    return this.authService.validateReviewer(email);
  }

  @Get('profile')
  async getProfile(@Headers('authorization') authHeader: string) {
    if (!authHeader) {
      throw new UnauthorizedException('Thiếu header Authorization');
    }
    const token = authHeader.replace(/^Bearer\s+/i, '');
    const decoded = this.authService.validateToken(token);
    return {
      success: true,
      user: decoded,
    };
  }
}
