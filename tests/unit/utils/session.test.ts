import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { SessionManager } from '@/lib/utils/session'

// Mock crypto functions
vi.mock('crypto', () => ({
  createCipheriv: vi.fn(),
  createDecipheriv: vi.fn(),
  randomBytes: vi.fn(),
  scryptSync: vi.fn(),
}))

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
})

describe('SessionManager', () => {
  let sessionManager: SessionManager

  beforeEach(async () => {
    // Reset singleton instance
    ;(SessionManager as any).instance = null
    sessionManager = SessionManager.getInstance()
    vi.clearAllMocks()

    // Mock crypto functions
    const mockCrypto = vi.mocked(await import('crypto'))

    const mockCipher = {
      update: vi.fn().mockReturnValue('encrypted_data'),
      final: vi.fn().mockReturnValue(''),
      getAuthTag: vi.fn().mockReturnValue(Buffer.from('auth_tag', 'utf8')),
    }

    const mockDecipher = {
      setAuthTag: vi.fn(),
      update: vi.fn().mockReturnValue('decrypted'),
      final: vi.fn().mockReturnValue('_data'),
    }

    mockCrypto.createCipheriv.mockReturnValue(mockCipher as any)
    mockCrypto.createDecipheriv.mockReturnValue(mockDecipher as any)
    mockCrypto.randomBytes.mockReturnValue(Buffer.from('random_bytes', 'utf8'))
    mockCrypto.scryptSync.mockReturnValue(Buffer.from('derived_key'.repeat(4), 'utf8'))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = SessionManager.getInstance()
      const instance2 = SessionManager.getInstance()

      expect(instance1).toBe(instance2)
      expect(instance1).toBeInstanceOf(SessionManager)
    })
  })

  describe('storeSession', () => {
    const validPoesessid = 'a1b2c3d4e5f6789012345678901234ab'

    it('should encrypt and store session in localStorage', () => {
      sessionManager.storeSession(validPoesessid)

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'poe_session',
        expect.stringContaining('"data":"encrypted_data"')
      )
    })

    it('should handle storage when localStorage is not available', () => {
      // Temporarily remove localStorage
      const originalLocalStorage = global.window
      delete (global as any).window

      expect(() => {
        sessionManager.storeSession(validPoesessid)
      }).not.toThrow()

      // Restore
      ;(global as any).window = originalLocalStorage
    })

    it('should throw error when encryption fails', async () => {
      const mockCrypto = vi.mocked(await import('crypto'))
      mockCrypto.createCipheriv.mockImplementation(() => {
        throw new Error('Encryption failed')
      })

      expect(() => {
        sessionManager.storeSession(validPoesessid)
      }).toThrow('Failed to store session securely')
    })
  })

  describe('getSession', () => {
    it('should decrypt and return stored session', () => {
      const encryptedSession = {
        data: 'encrypted_data',
        salt: 'salt_hex',
        iv: 'iv_hex',
        tag: 'tag_hex',
      }

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(encryptedSession))

      const result = sessionManager.getSession()

      expect(result).toBe('decrypted_data')
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('poe_session')
    })

    it('should return null when no session is stored', () => {
      mockLocalStorage.getItem.mockReturnValue(null)

      const result = sessionManager.getSession()

      expect(result).toBeNull()
    })

    it('should return null when localStorage is not available', () => {
      // Temporarily remove localStorage
      const originalLocalStorage = global.window
      delete (global as any).window

      const result = sessionManager.getSession()

      expect(result).toBeNull()

      // Restore
      ;(global as any).window = originalLocalStorage
    })

    it('should return null and clear session when decryption fails', async () => {
      const invalidSession = JSON.stringify({
        data: 'invalid_encrypted_data',
        salt: 'salt_hex',
        iv: 'iv_hex',
        tag: 'tag_hex',
      })

      mockLocalStorage.getItem.mockReturnValue(invalidSession)

      const mockCrypto = vi.mocked(await import('crypto'))
      mockCrypto.createDecipheriv.mockImplementation(() => {
        throw new Error('Decryption failed')
      })

      const result = sessionManager.getSession()

      expect(result).toBeNull()
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('poe_session')
    })

    it('should return null when stored data is invalid JSON', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json')

      const result = sessionManager.getSession()

      expect(result).toBeNull()
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('poe_session')
    })
  })

  describe('clearSession', () => {
    it('should remove session from localStorage', () => {
      sessionManager.clearSession()

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('poe_session')
    })

    it('should handle clearing when localStorage is not available', () => {
      // Temporarily remove localStorage
      const originalLocalStorage = global.window
      delete (global as any).window

      expect(() => {
        sessionManager.clearSession()
      }).not.toThrow()

      // Restore
      ;(global as any).window = originalLocalStorage
    })

    it('should handle localStorage errors gracefully', () => {
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw new Error('localStorage error')
      })

      expect(() => {
        sessionManager.clearSession()
      }).not.toThrow()
    })
  })

  describe('hasValidSession', () => {
    it('should return true for valid session', async () => {
      const validPoesessid = 'a1b2c3d4e5f6789012345678901234ab'
      const encryptedSession = {
        data: 'encrypted_data',
        salt: 'salt_hex',
        iv: 'iv_hex',
        tag: 'tag_hex',
      }

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(encryptedSession))

      // Mock decryption to return valid POESESSID
      const mockDecipher = {
        setAuthTag: vi.fn(),
        update: vi.fn().mockReturnValue(validPoesessid.slice(0, -4)),
        final: vi.fn().mockReturnValue(validPoesessid.slice(-4)),
      }

      const mockCrypto = vi.mocked(await import('crypto'))
      mockCrypto.createDecipheriv.mockReturnValue(mockDecipher as any)

      const result = sessionManager.hasValidSession()

      expect(result).toBe(true)
    })

    it('should return false for invalid POESESSID format', async () => {
      const encryptedSession = {
        data: 'encrypted_data',
        salt: 'salt_hex',
        iv: 'iv_hex',
        tag: 'tag_hex',
      }

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(encryptedSession))

      // Mock decryption to return invalid POESESSID
      const mockDecipher = {
        setAuthTag: vi.fn(),
        update: vi.fn().mockReturnValue('invalid_session'),
        final: vi.fn().mockReturnValue('_id'),
      }

      const mockCrypto = vi.mocked(await import('crypto'))
      mockCrypto.createDecipheriv.mockReturnValue(mockDecipher as any)

      const result = sessionManager.hasValidSession()

      expect(result).toBe(false)
    })

    it('should return false when no session exists', () => {
      mockLocalStorage.getItem.mockReturnValue(null)

      const result = sessionManager.hasValidSession()

      expect(result).toBe(false)
    })

    it('should return false when session retrieval fails', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json')

      const result = sessionManager.hasValidSession()

      expect(result).toBe(false)
    })
  })

  describe('POESESSID validation', () => {
    it('should accept valid 32-character hex strings', async () => {
      const validIds = [
        'a1b2c3d4e5f6789012345678901234ab',
        'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
        '00000000000000000000000000000000',
        'ffffffffffffffffffffffffffffffff',
      ]

      const mockCrypto = vi.mocked(await import('crypto'))

      validIds.forEach((id) => {
        const encryptedSession = {
          data: 'encrypted_data',
          salt: 'salt_hex',
          iv: 'iv_hex',
          tag: 'tag_hex',
        }

        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(encryptedSession))

        const mockDecipher = {
          setAuthTag: vi.fn(),
          update: vi.fn().mockReturnValue(id.slice(0, -4)),
          final: vi.fn().mockReturnValue(id.slice(-4)),
        }

        mockCrypto.createDecipheriv.mockReturnValue(mockDecipher as any)

        expect(sessionManager.hasValidSession()).toBe(true)
      })
    })

    it('should reject invalid POESESSID formats', async () => {
      const invalidIds = [
        'too_short',
        'this_is_way_too_long_to_be_a_valid_session',
        'contains-invalid-chars!@#$%^&*()',
        'a1b2c3d4e5f6789012345678901234a', // 31 chars
        'a1b2c3d4e5f6789012345678901234abc', // 33 chars
        '',
        '32_characters_but_not_hex_only!',
      ]

      const mockCrypto = vi.mocked(await import('crypto'))

      invalidIds.forEach((id) => {
        const encryptedSession = {
          data: 'encrypted_data',
          salt: 'salt_hex',
          iv: 'iv_hex',
          tag: 'tag_hex',
        }

        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(encryptedSession))

        const mockDecipher = {
          setAuthTag: vi.fn(),
          update: vi.fn().mockReturnValue(id.slice(0, Math.max(0, id.length - 4))),
          final: vi.fn().mockReturnValue(id.slice(Math.max(0, id.length - 4))),
        }

        mockCrypto.createDecipheriv.mockReturnValue(mockDecipher as any)

        expect(sessionManager.hasValidSession()).toBe(false)
      })
    })
  })
})
