import crypto from "crypto";
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

// In-memory persistent database for users, sessions, and user chat conversations
class AuthStore {
  private users: Map<string, StoredUser> = new Map(); // email -> StoredUser
  private usersById: Map<string, StoredUser> = new Map(); // userId -> StoredUser
  private sessions: Map<string, string> = new Map(); // sessionToken -> userId
  private userChatSessions: Map<string, ChatSession[]> = new Map(); // userId -> ChatSession[]

  constructor() {
    // Seed default student account if not present
    this.seedDefaultUser();
  }

  private seedDefaultUser() {
    const defaultEmail = "kalpnaneware1@gmail.com";
    const userId = "usr_demo_kalpna_001";
    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = this.hashPassword("student123", salt);

    const defaultUser: StoredUser = {
      userId,
      email: defaultEmail,
      passwordHash,
      salt,
      displayName: "Kalpna Neware",
      photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      studentGrade: "high_school",
      preferredSubject: "mathematics",
      learningGoals: "Master competitive exams, advanced calculus, and physics concepts.",
      customInstructions: "Provide step-by-step rigorous workings with formulas highlighted.",
      authProvider: "google",
      createdAt: Date.now() - 86400000 * 7,
      lastLoginAt: Date.now(),
    };

    this.users.set(defaultEmail.toLowerCase(), defaultUser);
    this.usersById.set(userId, defaultUser);
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
    this.sessions.set(token, userId);
    return token;
  }

  public getUserByToken(token?: string): StoredUser | null {
    if (!token) return null;
    const cleanToken = token.replace(/^Bearer\s+/i, "").trim();
    const userId = this.sessions.get(cleanToken);
    if (!userId) return null;
    return this.usersById.get(userId) || null;
  }

  public removeSessionToken(token?: string): void {
    if (!token) return;
    const cleanToken = token.replace(/^Bearer\s+/i, "").trim();
    this.sessions.delete(cleanToken);
  }

  public findUserByEmail(email: string): StoredUser | null {
    return this.users.get(email.toLowerCase().trim()) || null;
  }

  public findUserById(userId: string): StoredUser | null {
    return this.usersById.get(userId) || null;
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
    if (this.users.has(normalizedEmail)) {
      throw new Error("An account with this email address already exists. Please sign in.");
    }

    const userId = "usr_" + crypto.randomBytes(8).toString("hex");
    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = params.password ? this.hashPassword(params.password, salt) : undefined;

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
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
    };

    this.users.set(normalizedEmail, storedUser);
    this.usersById.set(userId, storedUser);

    const token = this.createSessionToken(userId);
    return {
      user: this.toPublicProfile(storedUser),
      token,
    };
  }

  public loginUser(email: string, password: string): { user: UserProfile; token: string } {
    const normalizedEmail = email.toLowerCase().trim();
    const user = this.users.get(normalizedEmail);

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

    user.lastLoginAt = Date.now();
    const token = this.createSessionToken(user.userId);

    return {
      user: this.toPublicProfile(user),
      token,
    };
  }

  public googleSignIn(params: {
    email: string;
    displayName: string;
    photoURL?: string;
    studentGrade?: StudentGrade;
    preferredSubject?: SubjectFocus;
  }): { user: UserProfile; token: string } {
    const normalizedEmail = params.email.toLowerCase().trim();
    let user = this.users.get(normalizedEmail);

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
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
      };
      this.users.set(normalizedEmail, user);
      this.usersById.set(userId, user);
    } else {
      user.lastLoginAt = Date.now();
      if (params.photoURL && (!user.photoURL || user.photoURL.includes("dicebear"))) {
        user.photoURL = params.photoURL;
      }
      if (params.displayName && user.displayName.includes("Scholar")) {
        user.displayName = params.displayName;
      }
    }

    const token = this.createSessionToken(user.userId);
    return {
      user: this.toPublicProfile(user),
      token,
    };
  }

  public updateProfile(
    userId: string,
    updates: Partial<UserProfile>
  ): UserProfile {
    const user = this.usersById.get(userId);
    if (!user) {
      throw new Error("User not found.");
    }

    if (updates.displayName) user.displayName = updates.displayName.trim();
    if (updates.studentGrade) user.studentGrade = updates.studentGrade;
    if (updates.preferredSubject) user.preferredSubject = updates.preferredSubject;
    if (updates.learningGoals !== undefined) user.learningGoals = updates.learningGoals;
    if (updates.customInstructions !== undefined) user.customInstructions = updates.customInstructions;
    if (updates.photoURL) user.photoURL = updates.photoURL;

    return this.toPublicProfile(user);
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

  // Conversation session isolation per user
  public getUserSessions(userId: string): ChatSession[] {
    return this.userChatSessions.get(userId) || [];
  }

  public saveUserSessions(userId: string, sessions: ChatSession[]): void {
    this.userChatSessions.set(userId, sessions);
  }
}

export const authStore = new AuthStore();
