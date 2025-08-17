import CryptoJS from "crypto-js";

// Encryption key for E2E encryption (in production, this would be more secure)
const ENCRYPTION_KEY = "whistle-secure-key-2024-harassment-reporting-system";

export interface EncryptedData {
  encryptedMessage: string;
  encryptedCategory: string;
  encryptedPhotoUrl?: string;
  encryptedVideoUrl?: string;
  encryptedVideoMetadata?: string;
  iv: string;
  timestamp: string;
}

/**
 * Encrypt sensitive report data using AES-256 encryption
 */
export function encryptReportData(data: {
  message: string;
  category: string;
  photo_url?: string;
  video_url?: string;
  video_metadata?: any;
}): EncryptedData {
  const iv = CryptoJS.lib.WordArray.random(16);
  const timestamp = new Date().toISOString();

  const encryptedMessage = CryptoJS.AES.encrypt(data.message, ENCRYPTION_KEY, {
    iv,
  }).toString();
  const encryptedCategory = CryptoJS.AES.encrypt(
    data.category,
    ENCRYPTION_KEY,
    { iv },
  ).toString();
  const encryptedPhotoUrl = data.photo_url
    ? CryptoJS.AES.encrypt(data.photo_url, ENCRYPTION_KEY, { iv }).toString()
    : undefined;
  const encryptedVideoUrl = data.video_url
    ? CryptoJS.AES.encrypt(data.video_url, ENCRYPTION_KEY, { iv }).toString()
    : undefined;
  const encryptedVideoMetadata = data.video_metadata
    ? CryptoJS.AES.encrypt(
        JSON.stringify(data.video_metadata),
        ENCRYPTION_KEY,
        { iv },
      ).toString()
    : undefined;

  return {
    encryptedMessage,
    encryptedCategory,
    encryptedPhotoUrl,
    encryptedVideoUrl,
    encryptedVideoMetadata,
    iv: iv.toString(),
    timestamp,
  };
}

/**
 * Safe UTF-8 decryption helper function
 */
function safeDecrypt(encryptedText: string, key: string, iv: CryptoJS.lib.WordArray): string {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedText, key, { iv });

    // Attempt UTF-8 conversion with error handling
    let utf8String: string;
    try {
      utf8String = decrypted.toString(CryptoJS.enc.Utf8);
    } catch (utf8Error) {
      // UTF-8 conversion failed - likely wrong key or incompatible encryption format
      // Don't log this as error since it's expected for incompatible data
      throw new Error('Incompatible encryption format or wrong decryption key');
    }

    // Only reject if we got null/undefined (not empty strings which can be valid)
    if (utf8String === null || utf8String === undefined) {
      throw new Error('Decryption resulted in null data');
    }

    // Check for excessive null bytes (more than 50% of the string) as sign of decryption failure
    const nullByteCount = (utf8String.match(/\0/g) || []).length;
    if (nullByteCount > utf8String.length / 2) {
      throw new Error('Decryption resulted in corrupted data (too many null bytes)');
    }

    return utf8String;
  } catch (error) {
    // If it's our custom error, re-throw it
    if (error.message.includes('Decryption resulted in') || error.message.includes('Incompatible encryption')) {
      throw error;
    }

    // Only log unexpected errors, not expected decryption failures
    if (!error.message.includes('Malformed UTF-8')) {
      console.error('Safe decrypt failed:', error);
    }
    throw new Error(`Decryption failed: ${error.message}`);
  }
}

/**
 * Decrypt report data for admin viewing
 */
export function decryptReportData(encryptedData: EncryptedData): {
  message: string;
  category: string;
  photo_url?: string;
  video_url?: string;
  video_metadata?: any;
} {
  try {
    const iv = CryptoJS.enc.Hex.parse(encryptedData.iv);

    const decryptedMessage = safeDecrypt(encryptedData.encryptedMessage, ENCRYPTION_KEY, iv);
    const decryptedCategory = safeDecrypt(encryptedData.encryptedCategory, ENCRYPTION_KEY, iv);

    const decryptedPhotoUrl = encryptedData.encryptedPhotoUrl
      ? safeDecrypt(encryptedData.encryptedPhotoUrl, ENCRYPTION_KEY, iv)
      : undefined;

    const decryptedVideoUrl = encryptedData.encryptedVideoUrl
      ? safeDecrypt(encryptedData.encryptedVideoUrl, ENCRYPTION_KEY, iv)
      : undefined;

  let decryptedVideoMetadata: any = undefined;
  if (encryptedData.encryptedVideoMetadata) {
    try {
      const decryptedMetadataString = CryptoJS.AES.decrypt(
        encryptedData.encryptedVideoMetadata,
        ENCRYPTION_KEY,
        {
          iv,
        },
      ).toString(CryptoJS.enc.Utf8);

      // Only parse if we have a non-empty string
      if (decryptedMetadataString && decryptedMetadataString.trim()) {
        decryptedVideoMetadata = JSON.parse(decryptedMetadataString);
      }
    } catch (error) {
      console.error("Failed to decrypt or parse video metadata:", error);
      decryptedVideoMetadata = undefined;
    }
  }

    return {
      message: decryptedMessage,
      category: decryptedCategory,
      photo_url: decryptedPhotoUrl,
      video_url: decryptedVideoUrl,
      video_metadata: decryptedVideoMetadata,
    };
  } catch (error) {
    console.error('Legacy decryption failed:', error);
    throw new Error(`Legacy decryption failed: ${error.message}`);
  }
}

/**
 * Hash admin credentials for secure storage
 */
export function hashAdminCredentials(
  username: string,
  password: string,
): string {
  return CryptoJS.SHA256(username + password + ENCRYPTION_KEY).toString();
}

/**
 * Verify admin credentials
 */
export function verifyAdminCredentials(
  username: string,
  password: string,
  storedHash: string,
): boolean {
  const computedHash = hashAdminCredentials(username, password);
  return computedHash === storedHash;
}
