import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'
import { ApiLogger } from './logger'

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32
const IV_LENGTH = 16
const SALT_LENGTH = 32
const SESSION_KEY = 'poe_session'

interface EncryptedSession {
  data: string
  salt: string
  iv: string
  tag: string
}

export class SessionManager {
  private static instance: SessionManager | null = null
  private encryptionPassword: string

  private constructor() {
    // Use environment variable or generate a secure password
    this.encryptionPassword = process.env.SESSION_ENCRYPTION_KEY || this.generateSecurePassword()

    if (!process.env.SESSION_ENCRYPTION_KEY) {
      // This is just a warning, not an error - we can auto-generate a key
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.warn('SESSION_ENCRYPTION_KEY not found in environment - using auto-generated key')
      }
    }
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager()
    }
    return SessionManager.instance
  }

  /**
   * Encrypts and stores POESESSID in localStorage
   */
  public storeSession(poesessid: string): void {
    try {
      const encrypted = this.encrypt(poesessid)

      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(encrypted))
        ApiLogger.logCacheOperation('write', {
          context: 'session_storage',
          encrypted: true,
          storage_type: 'localStorage',
        })
      }
    } catch (error) {
      ApiLogger.logError('SessionManager.storeSession', error as Error, {
        context: 'session_encryption_failed',
      })
      throw new Error('Failed to store session securely')
    }
  }

  /**
   * Retrieves and decrypts POESESSID from localStorage or environment
   */
  public getSession(): string | null {
    try {
      // Server-side: check environment variable first
      if (typeof window === 'undefined') {
        const envSession = process.env.POESESSID
        if (envSession && this.isValidPoesessid(envSession)) {
          return envSession
        }
        return null
      }

      // Client-side: check localStorage
      if (!window.localStorage) {
        return null
      }

      const storedData = localStorage.getItem(SESSION_KEY)
      if (!storedData) {
        return null
      }

      const encrypted: EncryptedSession = JSON.parse(storedData)
      const decrypted = this.decrypt(encrypted)

      ApiLogger.logCacheOperation('read', {
        context: 'session_retrieval',
        encrypted: true,
        storage_type: 'localStorage',
      })

      return decrypted
    } catch (error) {
      ApiLogger.logError('SessionManager.getSession', error as Error, {
        context: 'session_decryption_failed',
      })
      this.clearSession() // Clear corrupted session
      return null
    }
  }

  /**
   * Removes session from localStorage
   */
  public clearSession(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(SESSION_KEY)
        ApiLogger.logCacheOperation('cleanup', {
          context: 'session_cleared',
          storage_type: 'localStorage',
        })
      }
    } catch (error) {
      ApiLogger.logError('SessionManager.clearSession', error as Error)
    }
  }

  /**
   * Validates if session exists and is properly formatted
   */
  public hasValidSession(): boolean {
    // Server-side: check environment variable directly for better performance
    if (typeof window === 'undefined') {
      const envSession = process.env.POESESSID
      return envSession !== undefined && this.isValidPoesessid(envSession)
    }

    // Client-side: check stored session
    const session = this.getSession()
    return session !== null && session.length > 0 && this.isValidPoesessid(session)
  }

  /**
   * Basic validation for POESESSID format
   */
  private isValidPoesessid(poesessid: string): boolean {
    // POESESSID is typically a 32-character hexadecimal string
    const poesessidPattern = /^[a-f0-9]{32}$/i
    return poesessidPattern.test(poesessid)
  }

  /**
   * Encrypts data using AES-256-GCM
   */
  private encrypt(data: string): EncryptedSession {
    const salt = randomBytes(SALT_LENGTH)
    const iv = randomBytes(IV_LENGTH)
    const key = scryptSync(this.encryptionPassword, salt, KEY_LENGTH)

    const cipher = createCipheriv(ALGORITHM, key, iv)

    let encrypted = cipher.update(data, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    const tag = cipher.getAuthTag()

    return {
      data: encrypted,
      salt: salt.toString('hex'),
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
    }
  }

  /**
   * Decrypts data using AES-256-GCM
   */
  private decrypt(encrypted: EncryptedSession): string {
    const salt = Buffer.from(encrypted.salt, 'hex')
    const iv = Buffer.from(encrypted.iv, 'hex')
    const tag = Buffer.from(encrypted.tag, 'hex')
    const key = scryptSync(this.encryptionPassword, salt, KEY_LENGTH)

    const decipher = createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)

    let decrypted = decipher.update(encrypted.data, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  }

  /**
   * Generates a secure password for encryption
   */
  private generateSecurePassword(): string {
    return randomBytes(32).toString('hex')
  }
}

export const sessionManager = SessionManager.getInstance()
