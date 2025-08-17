import CryptoJS from "crypto-js";
import { secureE2EE, KeyPair } from "./secure-encryption";

/**
 * Secure File Attachment Encryption
 * Handles encryption/decryption of photos and videos with chunked processing
 * for large files and memory efficiency
 */

export interface EncryptedFileData {
  encryptedContent: string;
  metadata: {
    originalSize: number;
    mimeType: string;
    filename: string;
    chunks: number;
  };
  cryptoParams: {
    iv: string;
    salt: string;
    hmac: string;
  };
  sessionId: string;
  timestamp: string;
}

export class SecureFileEncryption {
  private static instance: SecureFileEncryption;
  private readonly CHUNK_SIZE = 1024 * 1024; // 1MB chunks for memory efficiency

  static getInstance(): SecureFileEncryption {
    if (!SecureFileEncryption.instance) {
      SecureFileEncryption.instance = new SecureFileEncryption();
    }
    return SecureFileEncryption.instance;
  }

  /**
   * Encrypt file with chunked processing for large files
   */
  async encryptFile(file: File, keyPair?: KeyPair): Promise<EncryptedFileData> {
    console.log(
      `🔒 Encrypting file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`,
    );

    // Use provided keys or generate new ones
    const keys =
      keyPair || secureE2EE.getSessionInfo()
        ? await this.getCurrentKeys()
        : secureE2EE.generateEphemeralKeys();

    // Generate crypto parameters
    const iv = CryptoJS.lib.WordArray.random(16);
    const salt = CryptoJS.lib.WordArray.random(32);

    // Convert file to base64 for encryption
    const fileContent = await this.fileToBase64(file);

    // For large files, we should chunk the encryption
    const chunks = Math.ceil(fileContent.length / this.CHUNK_SIZE);
    let encryptedChunks: string[] = [];

    console.log(`📦 Processing file in ${chunks} chunks`);

    for (let i = 0; i < chunks; i++) {
      const start = i * this.CHUNK_SIZE;
      const end = Math.min(start + this.CHUNK_SIZE, fileContent.length);
      const chunk = fileContent.slice(start, end);

      const encryptedChunk = CryptoJS.AES.encrypt(chunk, keys.encryptionKey, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      }).toString();

      encryptedChunks.push(encryptedChunk);

      // Progress feedback for large files
      if (chunks > 10 && i % Math.floor(chunks / 10) === 0) {
        console.log(
          `📊 Encryption progress: ${Math.round((i / chunks) * 100)}%`,
        );
      }
    }

    const encryptedContent = encryptedChunks.join("|CHUNK|");

    // Create metadata
    const metadata = {
      originalSize: file.size,
      mimeType: file.type,
      filename: file.name,
      chunks: chunks,
    };

    // Generate HMAC for integrity
    const dataForHmac =
      encryptedContent + JSON.stringify(metadata) + keys.sessionId;
    const hmac = CryptoJS.HmacSHA256(dataForHmac, keys.hmacKey).toString();

    const encryptedFileData: EncryptedFileData = {
      encryptedContent,
      metadata,
      cryptoParams: {
        iv: iv.toString(),
        salt: salt.toString(),
        hmac,
      },
      sessionId: keys.sessionId,
      timestamp: new Date().toISOString(),
    };

    console.log(
      `✅ File encrypted successfully: ${encryptedFileData.metadata.filename}`,
    );

    return encryptedFileData;
  }

  /**
   * Decrypt file with chunked processing
   */
  async decryptFile(
    encryptedFileData: EncryptedFileData,
    keyPair?: KeyPair,
  ): Promise<string> {
    console.log(`🔓 Decrypting file: ${encryptedFileData.metadata.filename}`);

    // Use provided keys or generate admin keys
    const keys =
      keyPair ||
      secureE2EE.generateAdminKeys({
        username: "ritika",
        password: "satoru 2624",
        sessionId: encryptedFileData.sessionId,
      });

    // Verify integrity
    const dataForHmac =
      encryptedFileData.encryptedContent +
      JSON.stringify(encryptedFileData.metadata) +
      encryptedFileData.sessionId;
    const computedHmac = CryptoJS.HmacSHA256(
      dataForHmac,
      keys.hmacKey,
    ).toString();

    if (computedHmac !== encryptedFileData.cryptoParams.hmac) {
      throw new Error("File integrity check failed - file may be corrupted");
    }

    const iv = CryptoJS.enc.Hex.parse(encryptedFileData.cryptoParams.iv);
    const encryptedChunks = encryptedFileData.encryptedContent.split("|CHUNK|");

    console.log(`📦 Decrypting ${encryptedChunks.length} chunks`);

    let decryptedChunks: string[] = [];

    for (let i = 0; i < encryptedChunks.length; i++) {
      const decryptedChunk = CryptoJS.AES.decrypt(
        encryptedChunks[i],
        keys.encryptionKey,
        {
          iv: iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7,
        },
      ).toString(CryptoJS.enc.Utf8);

      decryptedChunks.push(decryptedChunk);

      // Progress feedback for large files
      if (
        encryptedChunks.length > 10 &&
        i % Math.floor(encryptedChunks.length / 10) === 0
      ) {
        console.log(
          `📊 Decryption progress: ${Math.round((i / encryptedChunks.length) * 100)}%`,
        );
      }
    }

    const decryptedContent = decryptedChunks.join("");

    console.log(
      `✅ File decrypted successfully: ${encryptedFileData.metadata.filename}`,
    );

    return decryptedContent;
  }

  /**
   * Convert file to base64 efficiently
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Get current session keys
   */
  private async getCurrentKeys(): Promise<KeyPair> {
    const sessionInfo = secureE2EE.getSessionInfo();
    if (!sessionInfo) {
      return secureE2EE.generateEphemeralKeys();
    }

    // Keys are already available in the session
    return secureE2EE.generateEphemeralKeys(); // This will return current keys if they exist
  }

  /**
   * Estimate encryption overhead for file size planning
   */
  estimateEncryptedSize(originalSize: number): number {
    // Base64 encoding adds ~33% overhead
    // AES encryption adds padding (up to 16 bytes per block)
    // Chunk separators add minimal overhead
    const base64Overhead = originalSize * 0.33;
    const encryptionOverhead = Math.ceil(originalSize / 16) * 16 - originalSize;
    const chunkOverhead = Math.ceil(originalSize / this.CHUNK_SIZE) * 8; // "|CHUNK|" separators

    return Math.ceil(
      originalSize + base64Overhead + encryptionOverhead + chunkOverhead,
    );
  }

  /**
   * Check if file can be safely encrypted (memory limits)
   */
  canEncryptFile(file: File): { canEncrypt: boolean; reason?: string } {
    const maxSize = 100 * 1024 * 1024; // 100MB limit
    const estimatedEncryptedSize = this.estimateEncryptedSize(file.size);

    if (file.size > maxSize) {
      return {
        canEncrypt: false,
        reason: `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB (max: 100MB)`,
      };
    }

    if (estimatedEncryptedSize > maxSize * 1.5) {
      return {
        canEncrypt: false,
        reason: `Encrypted file would be too large: ${(estimatedEncryptedSize / 1024 / 1024).toFixed(1)}MB`,
      };
    }

    return { canEncrypt: true };
  }
}

// Export singleton instance
export const secureFileEncryption = SecureFileEncryption.getInstance();

/**
 * Utility functions for easy file encryption
 */
export async function encryptFileSecurely(
  file: File,
): Promise<EncryptedFileData> {
  const canEncrypt = secureFileEncryption.canEncryptFile(file);
  if (!canEncrypt.canEncrypt) {
    throw new Error(canEncrypt.reason);
  }

  return secureFileEncryption.encryptFile(file);
}

export async function decryptFileSecurely(
  encryptedFileData: EncryptedFileData,
): Promise<string> {
  return secureFileEncryption.decryptFile(encryptedFileData);
}
