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
    const utf8String = decrypted.toString(CryptoJS.enc.Utf8);

    // Check if the result is empty or contains only null bytes (sign of decryption failure)
    if (!utf8String || utf8String.trim() === '' || utf8String.includes('\0')) {
      throw new Error('Decryption resulted in invalid or empty data');
    }

    return utf8String;
  } catch (error) {
    console.error('Safe decrypt failed:', error);
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
