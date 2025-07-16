import CryptoJS from "crypto-js";

// Encryption key for E2E encryption (in production, this would be more secure)
const ENCRYPTION_KEY = "whistle-secure-key-2024-harassment-reporting-system";

export interface EncryptedData {
  encryptedMessage: string;
  encryptedCategory: string;
  encryptedPhotoUrl?: string;
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

  return {
    encryptedMessage,
    encryptedCategory,
    encryptedPhotoUrl,
    iv: iv.toString(),
    timestamp,
  };
}

/**
 * Decrypt report data for admin viewing
 */
export function decryptReportData(encryptedData: EncryptedData): {
  message: string;
  category: string;
  photo_url?: string;
} {
  const iv = CryptoJS.enc.Hex.parse(encryptedData.iv);

  const decryptedMessage = CryptoJS.AES.decrypt(
    encryptedData.encryptedMessage,
    ENCRYPTION_KEY,
    { iv },
  ).toString(CryptoJS.enc.Utf8);

  const decryptedCategory = CryptoJS.AES.decrypt(
    encryptedData.encryptedCategory,
    ENCRYPTION_KEY,
    { iv },
  ).toString(CryptoJS.enc.Utf8);

  const decryptedPhotoUrl = encryptedData.encryptedPhotoUrl
    ? CryptoJS.AES.decrypt(encryptedData.encryptedPhotoUrl, ENCRYPTION_KEY, {
        iv,
      }).toString(CryptoJS.enc.Utf8)
    : undefined;

  return {
    message: decryptedMessage,
    category: decryptedCategory,
    photo_url: decryptedPhotoUrl,
  };
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
