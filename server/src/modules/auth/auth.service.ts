import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { AppError } from "../../common/errors/app-error.js";
import { AppRole, isAppRole } from "../../common/constants/roles.js";
import type { JwtPayload } from "../../common/types/auth.js";
import type { LoginInput, RegisterInput } from "./auth.validation.js";
import { AuthRepository } from "./auth.repository.js";

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date | null;
};

type AuthResponse = {
  token: string;
  user: AuthUser;
};


export class AuthService {
  constructor(private readonly authRepository: AuthRepository) { }

  private getJwtSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new AppError("JWT_SECRET is not configured", 500);
    }
    return secret;
  }


  private generateToken(payload: JwtPayload): string {
    const secret = process.env.JWT_SECRET as string;
    return jwt.sign(payload, secret, {
      expiresIn: process.env.JWT_EXPIRES_IN as any // Using 'any' here bypasses the strict overload check
    });

    /*return jwt.sign(payload, this.getJwtSecret(), {
      expiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
    });*/
  }

  private sanitizeUser(user: Record<string, any>): AuthUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  async register(payload: RegisterInput): Promise<AuthResponse> {
    const existingUser = await this.authRepository.findUserByEmail(payload.email);
    if (existingUser) {
      throw new AppError("Email is already registered", 409);
    }

    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 10);
    const hashedPassword = await bcrypt.hash(payload.password, saltRounds);

    const user = await this.authRepository.createUser({
      name: payload.name,
      email: payload.email,
      password: hashedPassword,
      role: payload.role || AppRole.PATIENT,
    });

    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      role: isAppRole(user.role) ? user.role : AppRole.PATIENT,
    });

    return {
      token,
      user: this.sanitizeUser(user),
    };
  }

  async login(payload: LoginInput): Promise<AuthResponse> {
    const user = await this.authRepository.findUserByEmail(payload.email);

    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    const isPasswordValid = await bcrypt.compare(payload.password, user.password);
    if (!isPasswordValid) {
      throw new AppError("Invalid email or password", 401);
    }

    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      role: isAppRole(user.role) ? user.role : AppRole.PATIENT,
    });

    return {
      token,
      user: this.sanitizeUser(user),
    };
  }

  async getMe(userId: string): Promise<AuthUser> {
    const user = await this.authRepository.findUserById(userId);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return this.sanitizeUser(user);
  }
}

export const authService = new AuthService(new AuthRepository());
