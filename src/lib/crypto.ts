import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

// Retrieves the encryption key from environment variables
function getEncryptionKey(): Buffer {
  const key = process.env.AADHAAR_ENCRYPTION_KEY;
  if (!key) {
    throw new Error("AADHAAR_ENCRYPTION_KEY environment variable is not set");
  }
  // Ensure key is exactly 32 bytes. If not, hash it or pad it to 32 bytes.
  if (key.length === 32) {
    return Buffer.from(key, "utf-8");
  }
  // Fallback: create a 32-byte digest of the key
  return crypto.createHash("sha256").update(key).digest();
}

/**
 * Encrypts a string into a combined format: 'iv:authTag:encryptedText'
 */
export function encryptString(text: string): string {
  if (!text) return "";
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    
    const authTag = cipher.getAuthTag().toString("hex");
    
    return `${iv.toString("hex")}:${authTag}:${encrypted}`;
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt Aadhaar number");
  }
}

/**
 * Decrypts a combined format: 'iv:authTag:encryptedText' back to string
 */
export function decryptString(encryptedText: string): string {
  if (!encryptedText) return "";
  try {
    const parts = encryptedText.split(":");
    if (parts.length !== 3) {
      // Return as is if it doesn't look like our encrypted format (or is empty)
      return encryptedText;
    }
    
    const [ivHex, authTagHex, encryptedDataHex] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const encrypted = Buffer.from(encryptedDataHex, "hex");
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]).toString("utf8");
    
    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    return "[Decryption Failed - Check Key]";
  }
}

/**
 * Encrypts a Buffer and returns a single Buffer in the format:
 * [ IV (12 bytes) ] [ Auth Tag (16 bytes) ] [ Encrypted Data ]
 */
export function encryptBuffer(buffer: Buffer): Buffer {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    const encryptedData = Buffer.concat([cipher.update(buffer), cipher.final()]);
    const authTag = cipher.getAuthTag();
    
    // Concatenate [IV][AuthTag][EncryptedData]
    return Buffer.concat([iv, authTag, encryptedData]);
  } catch (error) {
    console.error("Buffer encryption error:", error);
    throw new Error("Failed to encrypt Aadhaar document file");
  }
}

/**
 * Decrypts a Buffer that was encrypted using encryptBuffer
 */
export function decryptBuffer(buffer: Buffer): Buffer {
  try {
    if (buffer.length < IV_LENGTH + AUTH_TAG_LENGTH) {
      throw new Error("Buffer is too short to contain IV and Auth Tag");
    }
    
    const key = getEncryptionKey();
    const iv = buffer.subarray(0, IV_LENGTH);
    const authTag = buffer.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encryptedData = buffer.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    return Buffer.concat([decipher.update(encryptedData), decipher.final()]);
  } catch (error) {
    console.error("Buffer decryption error:", error);
    throw new Error("Failed to decrypt Aadhaar document file. Invalid key or corrupted file.");
  }
}
