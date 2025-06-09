import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Users } from '../entities/Users';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';

function isPasswordValid(password: string): boolean {
  return (
    password.length >= 12 &&
    (password.match(/[A-Z]/g) || []).length >= 2 &&
    (password.match(/[0-9]/g) || []).length >= 2 &&
    /[^A-Za-z0-9]/.test(password)
  );
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Users) private readonly userRepo: Repository<Users>,
    private readonly jwtService: JwtService,
  ) {}

  async register(email: string, password: string, name: string) {
    if (!isPasswordValid(password)) {
      throw new ConflictException('Password does not meet security requirements');
    }
    const existingUser = await this.userRepo.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    // Default role is 'user'
    const user = this.userRepo.create({ email, password: hashedPassword, name, role: 'user' });
    return this.userRepo.save(user);
  }

  async login(email: string, password: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  async validateGithubUser(profile: any) {
    const email = profile.emails?.[0]?.value;
    if (!email) throw new UnauthorizedException('No email from GitHub');
    let user = await this.userRepo.findOne({ where: { email } });
    if (!user) {
      // Always create as user
      const randomPassword = randomBytes(16).toString('hex');
      user = this.userRepo.create({
        email,
        name: profile.displayName || profile.username || email,
        password: await bcrypt.hash(randomPassword, 10),
        role: 'user',
      });
      await this.userRepo.save(user);
    }
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }

  // --- ADMIN ENDPOINTS ---
  async getAllUsers() {
    return this.userRepo.find();
  }
  async createUser(data: any) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = this.userRepo.create({ ...data, password: hashedPassword });
    return this.userRepo.save(user);
  }
  async updateUser(id: number, data: any) {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    await this.userRepo.update(id, data);
    return this.userRepo.findOne({ where: { id } });
  }
  async deleteUser(id: number) {
    return this.userRepo.delete(id);
  }
}
