import crypto from "crypto";
import fs from "fs";
import path from "path";
import { DatabaseSync } from "node:sqlite";
import { UserProfile, StudentGrade, SubjectFocus, ChatSession } from "../types";

export interface StoredUser {
  userId: string;
  email: string;
  passwordHash?: string;
  salt?: string;
  displayName: string;
  photoURL?: string;
  studentGrade: StudentGrade;
  preferredSubject: SubjectFocus;
  learningGoals?: string;
  customInstructions?: string;
  authProvider: "password" | "google";
  createdAt: number;
  lastLoginAt: number;
}

interface UserRow {
  userId: string;
  email: string;
  passwordHash: string | null;
  salt: string | null;
  displayName: string;
  photoURL: string | null;
  studentGrade: string;
  preferredSubject: string;
  learningGoals: string | null;
  customInstructions: string | null;
  authProvider: string;
  createdAt: number;
  lastLoginAt: number;
}

interface ChatRow {
  id: string;
  userId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: string;
  studentGrade: string;
  subjectFocus: string;
}

const DB_PATH = path.join(process.cwd(), "data", "vishwamedha.sqlite");

class AuthStore {
  private db: DatabaseSync;

  constructor() {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new DatabaseSync(DB_PATH);
    this.initializeSchema();
    this.seedDefaultUser();
  }

  private initializeSchema() {
    this.db.exec(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS users (
        userId TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        passwordHash TEXT,
        salt TEXT,
        displayName TEXT NOT NULL,
        photoURL TEXT,
        studentGrade TEXT NOT NULL,
        preferredSubject TEXT NOT NULL,
        learningGoals TEXT,
        customInstructions TEXT,
        authProvider TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        lastLoginAt INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        createdAt INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS chat_sessions (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        title TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL,
        messages TEXT NOT NULL,
        studentGrade TEXT NOT NULL,
        subjectFocus TEXT NOT NULL
      );
    `);
  }

  private mapRowToUser(row: UserRow): StoredUser {
    return {
      userId: row.userId,
      email: row.email,
      passwordHash: row.passwordHash ?? undefined,
      salt: row.salt ?? undefined,
      displayName: row.displayName,
      photoURL: row.photoURL ?? undefined,
      studentGrade: row.studentGrade as StudentGrade,
      preferredSubject: row.preferredSubject as SubjectFocus,
      learningGoals: row.learningGoals ?? undefined,
      customInstructions: row.customInstructions ?? undefined,
      authProvider: row.authProvider as "password" | "google",
      createdAt: Number(row.createdAt),
      lastLoginAt: Number(row.lastLoginAt),
    };
  }

  private mapRowToChatSession(row: ChatRow): ChatSession {
    return {
      id: row.id,
      title: row.title,
      createdAt: Number(row.createdAt),
      updatedAt: Number(row.updatedAt),
      messages: JSON.parse(row.messages) as ChatSession["messages"],
      studentGrade: row.studentGrade as StudentGrade,
      subjectFocus: row.subjectFocus as SubjectFocus,
    };
  }

  private seedDefaultUser() {
    const defaultEmail = "kalpnaneware1@gmail.com";
    const existing = this.findUserByEmail(defaultEmail);
    if (existing) {
      return;
    }

    const userId = "usr_demo_kalpna_001";
    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = this.hashPassword("student123", salt);

    const now = Date.now();
    this.db.prepare(`
      INSERT INTO users (
        userId, email, passwordHash, salt, displayName, photoURL,
        studentGrade, preferredSubject, learningGoals, customInstructions,
        authProvider, createdAt, lastLoginAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      defaultEmail,
      passwordHash,
      salt,
      "Kalpna Neware",
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      "high_school",
      "mathematics",
      "Master competitive exams, advanced calculus, and physics concepts.",
      "Provide step-by-step rigorous workings with formulas highlighted.",
      "google",
      now - 86400000 * 7,
      now
    );
  }

  public hashPassword(password: string, salt: string): string {
    return crypto.scryptSync(password, salt, 64).toString("hex");
  }

  public verifyPassword(password: string, hash: string, salt: string): boolean {
    const calculatedHash = this.hashPassword(password, salt);
    try {
      const a = Buffer.from(calculatedHash, "hex");
      const b = Buffer.from(hash, "hex");
      return a.length === b.length && crypto.timingSafeEqual(a, b);
    } catch {
      return false;
    }
  }

  public createSessionToken(userId: string): string {
    const token = "vishwamedha_tok_" + crypto.randomBytes(32).toString("hex");
    this.db.prepare(`INSERT INTO sessions (token, userId, createdAt) VALUES (?, ?, ?)`)
      .run(token, userId, Date.now());
    return token;
  }

  public getUserByToken(token?: string): StoredUser | null {
    if (!token) return null;
    const cleanToken = token.replace(/^Bearer\s+/i, "").trim();
    const row = this.db.prepare(`SELECT u.* FROM sessions s JOIN users u ON u.userId = s.userId WHERE s.token = ?`).get(cleanToken) as unknown as UserRow | undefined;
    return row ? this.mapRowToUser(row) : null;
  }

  public removeSessionToken(token?: string): void {
    if (!token) return;
    const cleanToken = token.replace(/^Bearer\s+/i, "").trim();
    this.db.prepare(`DELETE FROM sessions WHERE token = ?`).run(cleanToken);
  }

  public findUserByEmail(email: string): StoredUser | null {
    const row = this.db.prepare(`SELECT * FROM users WHERE email = ?`).get(email.toLowerCase().trim()) as unknown as UserRow | undefined;
    return row ? this.mapRowToUser(row) : null;
  }

  public findUserById(userId: string): StoredUser | null {
    const row = this.db.prepare(`SELECT * FROM users WHERE userId = ?`).get(userId) as unknown as UserRow | undefined;
    return row ? this.mapRowToUser(row) : null;
  }

  public registerUser(params: {
    displayName: string;
    email: string;
    password?: string;
    studentGrade?: StudentGrade;
    preferredSubject?: SubjectFocus;
    photoURL?: string;
    authProvider?: "password" | "google";
  }): { user: UserProfile; token: string } {
    const normalizedEmail = params.email.toLowerCase().trim();
    if (this.findUserByEmail(normalizedEmail)) {
      throw new Error("An account with this email address already exists. Please sign in.");
    }

    const userId = "usr_" + crypto.randomBytes(8).toString("hex");
    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = params.password ? this.hashPassword(params.password, salt) : undefined;
    const now = Date.now();

    const storedUser: StoredUser = {
      userId,
      email: normalizedEmail,
      passwordHash,
      salt: params.password ? salt : undefined,
      displayName: params.displayName.trim() || "Student Scholar",
      photoURL: params.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${userId}`,
      studentGrade: params.studentGrade || "general",
      preferredSubject: params.preferredSubject || "all",
      learningGoals: "Excel in conceptual problem solving and scientific reasoning.",
      customInstructions: "Provide clear, methodical step-by-step explanations.",
      authProvider: params.authProvider || "password",
      createdAt: now,
      lastLoginAt: now,
    };

    this.db.prepare(`
      INSERT INTO users (
        userId, email, passwordHash, salt, displayName, photoURL,
        studentGrade, preferredSubject, learningGoals, customInstructions,
        authProvider, createdAt, lastLoginAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      storedUser.userId,
      storedUser.email,
      storedUser.passwordHash ?? null,
      storedUser.salt ?? null,
      storedUser.displayName,
      storedUser.photoURL ?? null,
      storedUser.studentGrade,
      storedUser.preferredSubject,
      storedUser.learningGoals ?? null,
      storedUser.customInstructions ?? null,
      storedUser.authProvider,
      storedUser.createdAt,
      storedUser.lastLoginAt
    );

    const token = this.createSessionToken(userId);
    return { user: this.toPublicProfile(storedUser), token };
  }

  public loginUser(email: string, password: string): { user: UserProfile; token: string } {
    const normalizedEmail = email.toLowerCase().trim();
    const user = this.findUserByEmail(normalizedEmail);

    if (!user) {
      throw new Error("No account found with this email address. Please sign up.");
    }

    if (!user.passwordHash || !user.salt) {
      if (user.authProvider === "google") {
        throw new Error("This account was created with Google. Please use 'Continue with Google'.");
      }
      throw new Error("Invalid account configuration. Please contact support.");
    }

    const isValid = this.verifyPassword(password, user.passwordHash, user.salt);
    if (!isValid) {
      throw new Error("Incorrect password. Please try again.");
    }

    this.db.prepare(`UPDATE users SET lastLoginAt = ? WHERE userId = ?`).run(Date.now(), user.userId);
    const token = this.createSessionToken(user.userId);
    return { user: this.toPublicProfile(user), token };
  }

  public googleSignIn(params: {
    email: string;
    displayName: string;
    photoURL?: string;
    studentGrade?: StudentGrade;
    preferredSubject?: SubjectFocus;
  }): { user: UserProfile; token: string } {
    const normalizedEmail = params.email.toLowerCase().trim();
    let user = this.findUserByEmail(normalizedEmail);
    const now = Date.now();

    if (!user) {
      const userId = "usr_g_" + crypto.randomBytes(8).toString("hex");
      user = {
        userId,
        email: normalizedEmail,
        displayName: params.displayName.trim() || normalizedEmail.split("@")[0] || "Google Student",
        photoURL: params.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${userId}`,
        studentGrade: params.studentGrade || "high_school",
        preferredSubject: params.preferredSubject || "mathematics",
        learningGoals: "Master high-school & college STEM concepts with Vishwamedha AI.",
        customInstructions: "Provide clear, rigorous proofs and formulas.",
        authProvider: "google",
        createdAt: now,
        lastLoginAt: now,
      };

      this.db.prepare(`
        INSERT INTO users (
          userId, email, passwordHash, salt, displayName, photoURL,
          studentGrade, preferredSubject, learningGoals, customInstructions,
          authProvider, createdAt, lastLoginAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        user.userId,
        user.email,
        null,
        null,
        user.displayName,
        user.photoURL ?? null,
        user.studentGrade,
        user.preferredSubject,
        user.learningGoals ?? null,
        user.customInstructions ?? null,
        user.authProvider,
        user.createdAt,
        user.lastLoginAt
      );
    } else {
      const updates: string[] = ["lastLoginAt = ?"];
      const values: any[] = [now, user.userId];

      if (params.photoURL && (!user.photoURL || user.photoURL.includes("dicebear"))) {
        updates.push("photoURL = ?");
        values.splice(1, 0, params.photoURL);
      }
      if (params.displayName && user.displayName.includes("Scholar")) {
        updates.push("displayName = ?");
        values.splice(1, 0, params.displayName);
      }

      const query = `UPDATE users SET ${updates.join(", ")} WHERE userId = ?`;
      this.db.prepare(query).run(...values);
      user = this.findUserById(user.userId)!;
    }

    const token = this.createSessionToken(user.userId);
    return { user: this.toPublicProfile(user), token };
  }

  public updateProfile(userId: string, updates: Partial<UserProfile>): UserProfile {
    const user = this.findUserById(userId);
    if (!user) {
      throw new Error("User not found.");
    }

    const fields: string[] = [];
    const values: any[] = [];

    if (updates.displayName) {
      fields.push("displayName = ?");
      values.push(updates.displayName.trim());
    }
    if (updates.studentGrade) {
      fields.push("studentGrade = ?");
      values.push(updates.studentGrade);
    }
    if (updates.preferredSubject) {
      fields.push("preferredSubject = ?");
      values.push(updates.preferredSubject);
    }
    if (updates.learningGoals !== undefined) {
      fields.push("learningGoals = ?");
      values.push(updates.learningGoals ?? null);
    }
    if (updates.customInstructions !== undefined) {
      fields.push("customInstructions = ?");
      values.push(updates.customInstructions ?? null);
    }
    if (updates.photoURL) {
      fields.push("photoURL = ?");
      values.push(updates.photoURL);
    }

    if (fields.length > 0) {
      const query = `UPDATE users SET ${fields.join(", ")} WHERE userId = ?`;
      this.db.prepare(query).run(...values, userId);
    }

    return this.toPublicProfile(this.findUserById(userId)!);
  }

  public toPublicProfile(user: StoredUser): UserProfile {
    return {
      userId: user.userId,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      studentGrade: user.studentGrade,
      preferredSubject: user.preferredSubject,
      learningGoals: user.learningGoals,
      customInstructions: user.customInstructions,
      authProvider: user.authProvider,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    };
  }

  public getUserSessions(userId: string): ChatSession[] {
    const rows = this.db.prepare(`SELECT * FROM chat_sessions WHERE userId = ? ORDER BY updatedAt DESC`).all(userId) as unknown as ChatRow[];
    return rows.map((row) => this.mapRowToChatSession(row));
  }

  public saveUserSessions(userId: string, sessions: ChatSession[]): void {
    this.db.prepare(`DELETE FROM chat_sessions WHERE userId = ?`).run(userId);

    const stmt = this.db.prepare(`
      INSERT INTO chat_sessions (id, userId, title, createdAt, updatedAt, messages, studentGrade, subjectFocus)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const session of sessions) {
      stmt.run(
        session.id,
        userId,
        session.title,
        session.createdAt,
        session.updatedAt,
        JSON.stringify(session.messages),
        session.studentGrade,
        session.subjectFocus
      );
    }
  }
}

export const authStore = new AuthStore();
