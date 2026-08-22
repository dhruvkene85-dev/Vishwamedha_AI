import { UserProfile, ChatSession } from '../types';

const AUTH_STORAGE_KEY = 'vishwamedha_auth_session';

export interface AuthSession {
  token: string;
  user: UserProfile;
}

export class AuthClient {
  private static cachedSession: AuthSession | null = null;

  public static getSession(): AuthSession | null {
    if (this.cachedSession) return this.cachedSession;
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) {
        this.cachedSession = JSON.parse(raw);
        return this.cachedSession;
      }
    } catch {
      // Ignore JSON parse errors
    }
    return null;
  }

  public static setSession(session: AuthSession | null): void {
    this.cachedSession = session;
    if (session) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }

  public static getCurrentUser(): UserProfile | null {
    const session = this.getSession();
    return session ? session.user : null;
  }

  public static getToken(): string | null {
    const session = this.getSession();
    return session ? session.token : null;
  }

  public static async signUp(data: {
    name: string;
    email: string;
    password: string;
    studentGrade?: string;
    preferredSubject?: string;
  }): Promise<{ user: UserProfile; token: string }> {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || 'Sign up failed');
    }
    this.setSession({ token: result.token, user: result.user });
    return result;
  }

  public static async login(data: {
    email: string;
    password: string;
  }): Promise<{ user: UserProfile; token: string }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || 'Login failed');
    }
    this.setSession({ token: result.token, user: result.user });
    return result;
  }

  public static async signInWithGoogle(data: {
    email: string;
    displayName: string;
    photoURL?: string;
    studentGrade?: string;
    preferredSubject?: string;
  }): Promise<{ user: UserProfile; token: string }> {
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || 'Google Sign-In failed');
    }
    this.setSession({ token: result.token, user: result.user });
    return result;
  }

  public static async signOut(): Promise<void> {
    const token = this.getToken();
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
      } catch {
        // Continue cleanup even if network request fails
      }
    }
    this.setSession(null);
  }

  public static async updateProfile(
    updates: Partial<UserProfile>
  ): Promise<UserProfile> {
    const token = this.getToken();
    if (!token) throw new Error('Not authenticated');

    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || 'Failed to update profile');
    }

    const currentSession = this.getSession();
    if (currentSession) {
      this.setSession({ ...currentSession, user: result.user });
    }
    return result.user;
  }

  // Fetch conversations isolated strictly for this user
  public static async fetchUserSessions(userId: string): Promise<ChatSession[]> {
    const token = this.getToken();
    if (token) {
      try {
        const res = await fetch('/api/user/sessions', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.sessions) && data.sessions.length > 0) {
            return data.sessions;
          }
        }
      } catch (err) {
        console.warn('Could not sync user sessions from server:', err);
      }
    }

    // LocalStorage fallback scoped strictly to this specific userId
    try {
      const localKey = `vishwamedha_sessions_${userId}`;
      const saved = localStorage.getItem(localKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }

    return [];
  }

  // Save conversations isolated strictly for this user
  public static async saveUserSessions(
    userId: string,
    sessions: ChatSession[]
  ): Promise<void> {
    // 1. Scoped local storage
    try {
      const localKey = `vishwamedha_sessions_${userId}`;
      localStorage.setItem(localKey, JSON.stringify(sessions));
    } catch {
      // ignore
    }

    // 2. Server sync if token available
    const token = this.getToken();
    if (token) {
      try {
        await fetch('/api/user/sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ sessions }),
        });
      } catch (err) {
        console.warn('Failed to persist user sessions to server:', err);
      }
    }
  }
}
