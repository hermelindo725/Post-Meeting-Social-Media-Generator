// Enterprise Encryption and Data Protection
import crypto from 'crypto'

export class EnterpriseEncryption {
  private static readonly ALGORITHM = 'aes-256-gcm'
  private static readonly KEY_LENGTH = 32
  private static readonly IV_LENGTH = 16
  private static readonly TAG_LENGTH = 16

  // Generate encryption key from password
  static generateKey(password: string, salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(password, salt, 100000, this.KEY_LENGTH, 'sha512')
  }

  // Encrypt sensitive data
  static encrypt(text: string, key: Buffer): {
    encrypted: string
    iv: string
    tag: string
    salt: string
  } {
    const salt = crypto.randomBytes(16)
    const derivedKey = this.generateKey(key.toString('hex'), salt)
    const iv = crypto.randomBytes(this.IV_LENGTH)
    
    const cipher = crypto.createCipher(this.ALGORITHM, derivedKey)
    cipher.setAAD(salt)
    
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const tag = cipher.getAuthTag()
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
      salt: salt.toString('hex')
    }
  }

  // Decrypt sensitive data
  static decrypt(
    encryptedData: string,
    key: Buffer,
    iv: string,
    tag: string,
    salt: string
  ): string {
    const saltBuffer = Buffer.from(salt, 'hex')
    const derivedKey = this.generateKey(key.toString('hex'), saltBuffer)
    const ivBuffer = Buffer.from(iv, 'hex')
    const tagBuffer = Buffer.from(tag, 'hex')
    
    const decipher = crypto.createDecipher(this.ALGORITHM, derivedKey)
    decipher.setAAD(saltBuffer)
    decipher.setAuthTag(tagBuffer)
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  }

  // Hash passwords with salt
  static hashPassword(password: string): { hash: string; salt: string } {
    const salt = crypto.randomBytes(32).toString('hex')
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')
    
    return { hash, salt }
  }

  // Verify password
  static verifyPassword(password: string, hash: string, salt: string): boolean {
    const hashVerify = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')
    return hash === hashVerify
  }

  // Generate secure random tokens
  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex')
  }

  // Generate API keys
  static generateApiKey(): string {
    const prefix = 'sk_'
    const randomPart = crypto.randomBytes(24).toString('hex')
    return `${prefix}${randomPart}`
  }

  // Encrypt PII data for GDPR compliance
  static encryptPII(data: any, key: Buffer): any {
    if (typeof data === 'string') {
      return this.encrypt(data, key)
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.encryptPII(item, key))
    }
    
    if (typeof data === 'object' && data !== null) {
      const encrypted: any = {}
      for (const [key, value] of Object.entries(data)) {
        encrypted[key] = this.encryptPII(value, key)
      }
      return encrypted
    }
    
    return data
  }

  // Decrypt PII data
  static decryptPII(data: any, key: Buffer): any {
    if (data && typeof data === 'object' && data.encrypted && data.iv && data.tag && data.salt) {
      return this.decrypt(data.encrypted, key, data.iv, data.tag, data.salt)
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.decryptPII(item, key))
    }
    
    if (typeof data === 'object' && data !== null) {
      const decrypted: any = {}
      for (const [key, value] of Object.entries(data)) {
        decrypted[key] = this.decryptPII(value, key)
      }
      return decrypted
    }
    
    return data
  }

  // Data masking for logs and debugging
  static maskSensitiveData(data: string, visibleChars: number = 4): string {
    if (data.length <= visibleChars * 2) {
      return '*'.repeat(data.length)
    }
    
    const start = data.substring(0, visibleChars)
    const end = data.substring(data.length - visibleChars)
    const middle = '*'.repeat(data.length - visibleChars * 2)
    
    return `${start}${middle}${end}`
  }

  // Generate data encryption key for user
  static generateUserEncryptionKey(userId: string): Buffer {
    const masterKey = process.env.MASTER_ENCRYPTION_KEY || 'default-master-key'
    const userSalt = crypto.createHash('sha256').update(userId).digest()
    return this.generateKey(masterKey, userSalt)
  }
}

// Data classification levels
export enum DataClassification {
  PUBLIC = 'public',
  INTERNAL = 'internal',
  CONFIDENTIAL = 'confidential',
  RESTRICTED = 'restricted'
}

// Data retention policies
export interface DataRetentionPolicy {
  classification: DataClassification
  retentionPeriod: number // in days
  autoDelete: boolean
  encryptionRequired: boolean
}

export class DataGovernance {
  private static readonly RETENTION_POLICIES: Record<DataClassification, DataRetentionPolicy> = {
    [DataClassification.PUBLIC]: {
      classification: DataClassification.PUBLIC,
      retentionPeriod: 365,
      autoDelete: false,
      encryptionRequired: false
    },
    [DataClassification.INTERNAL]: {
      classification: DataClassification.INTERNAL,
      retentionPeriod: 2555, // 7 years
      autoDelete: true,
      encryptionRequired: false
    },
    [DataClassification.CONFIDENTIAL]: {
      classification: DataClassification.CONFIDENTIAL,
      retentionPeriod: 2555, // 7 years
      autoDelete: true,
      encryptionRequired: true
    },
    [DataClassification.RESTRICTED]: {
      classification: DataClassification.RESTRICTED,
      retentionPeriod: 1095, // 3 years
      autoDelete: true,
      encryptionRequired: true
    }
  }

  static getRetentionPolicy(classification: DataClassification): DataRetentionPolicy {
    return this.RETENTION_POLICIES[classification]
  }

  static shouldRetainData(createdAt: Date, classification: DataClassification): boolean {
    const policy = this.getRetentionPolicy(classification)
    const retentionDate = new Date(createdAt.getTime() + policy.retentionPeriod * 24 * 60 * 60 * 1000)
    return new Date() < retentionDate
  }
}
