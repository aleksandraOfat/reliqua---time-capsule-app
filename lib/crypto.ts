import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'

function getKey(): Buffer {
    const hexKey = process.env.CAPSULE_ENCRYPTION_KEY
    if (!hexKey || hexKey.length !== 64){
        throw new Error(
            'CAPSULE_ENCRYPTION_KEY is missing or invalid (expected 64 hex characters).'
        )
    }
    return Buffer.from(hexKey, 'hex')
}

export function encrypt(plainText: string): string {
    const key = getKey()
    const iv = crypto.randomBytes(12)
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

    const encrypted = Buffer.concat([
        cipher.update(plainText, 'utf8'),
        cipher.final(),
    ])
    const authTag = cipher.getAuthTag()

    return [
        iv.toString('hex'),
        authTag.toString('hex'),
        encrypted.toString('hex'),
    ].join(':')
}

export function decrypt(payload: string): string {
    const key = getKey()
    const [ivHex, authTagHex, encryptedHex] = payload.split(':')

    if (!ivHex || !authTagHex || !encryptedHex) {
        throw new Error('Invalid encrypted payload format.')
    }

    const decipher = crypto.createDecipheriv(
        ALGORITHM,
        key,
        Buffer.from(ivHex, 'hex')
    )
    decipher.setAuthTag(Buffer.from(authTagHex,'hex'))

    const decrypted = Buffer.concat([
        decipher.update(Buffer.from(encryptedHex, 'hex')),
        decipher.final(),
    ])

    return decrypted.toString('utf8')
}

export function encryptBuffer(data: Buffer): Buffer {
    const key = getKey()
    const iv = crypto.randomBytes(12)
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
    const encrypted = Buffer.concat([cipher.update(data), cipher.final()])
    const authTag = cipher.getAuthTag()
    return Buffer.concat([iv, authTag, encrypted])
}

export function decryptBuffer(payload: Buffer): Buffer {
    const key = getKey()
    const iv = payload.subarray(0, 12)
    const authTag = payload.subarray(12, 28)
    const encrypted = payload.subarray(28)
    const  decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)
    return Buffer.concat([decipher.update(encrypted), decipher.final()])
}