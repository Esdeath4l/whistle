/**
 * AI Moderation Service for Whistle App
 * Detects offensive content, spam, and abuse in report submissions
 */

export interface ModerationResult {
  isFlagged: boolean;
  reason?: string;
  confidence: number;
  detectedTerms: string[];
}

// Offensive words list (simplified for demo - in production use more comprehensive list)
const OFFENSIVE_TERMS = [
  // Explicit content
  "fuck",
  "shit",
  "damn",
  "bitch",
  "ass",
  "crap",
  // Harassment terms
  "idiot",
  "stupid",
  "moron",
  "loser",
  "pathetic",
  "worthless",
  // Hate speech (mild examples for demo)
  "hate",
  "kill",
  "die",
  "murder",
  "threat",
  "revenge",
  // Spam indicators
  "click here",
  "free money",
  "win now",
  "call now",
  "buy now",
  "urgent",
  "limited time",
  "act fast",
  "don't miss",
  // Inappropriate content
  "nude",
  "naked",
  "porn",
  "sex",
  "xxx",
  // Bullying terms
  "ugly",
  "fat",
  "gross",
  "disgusting",
  "freak",
  "weirdo",
];

// Spam patterns
const SPAM_PATTERNS = [
  /(.)\1{4,}/g, // Repeated characters (aaaaa)
  /\b\d{10,}\b/g, // Long numbers (phone numbers, etc.)
  /[A-Z]{5,}/g, // All caps words
  /(https?:\/\/[^\s]+)/g, // URLs
  /(\$\d+|\d+\$)/g, // Money amounts
  /[!]{3,}/g, // Multiple exclamation marks
];

/**
 * Analyzes text content for potential violations
 */
export function moderateContent(text: string): ModerationResult {
  if (!text || text.trim().length === 0) {
    return {
      isFlagged: false,
      confidence: 0,
      detectedTerms: [],
    };
  }

  const lowercaseText = text.toLowerCase();
  const detectedTerms: string[] = [];
  let totalScore = 0;
  let maxScore = 0;

  // Check for offensive terms
  OFFENSIVE_TERMS.forEach((term) => {
    const regex = new RegExp(
      `\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
      "gi",
    );
    const matches = text.match(regex);
    if (matches) {
      detectedTerms.push(term);
      const termScore = getThreatScore(term);
      totalScore += termScore * matches.length;
      maxScore = Math.max(maxScore, termScore);
    }
  });

  // Check for spam patterns
  let spamScore = 0;
  SPAM_PATTERNS.forEach((pattern) => {
    const matches = text.match(pattern);
    if (matches) {
      spamScore += matches.length * 10;
      if (pattern.source.includes("https?")) {
        detectedTerms.push("suspicious_link");
      } else if (pattern.source.includes("\\$")) {
        detectedTerms.push("money_reference");
      } else if (pattern.source.includes("[A-Z]")) {
        detectedTerms.push("excessive_caps");
      }
    }
  });

  // Calculate confidence based on various factors
  const textLength = text.length;
  const wordCount = text.split(/\s+/).length;

  // Normalize scores
  const normalizedOffensiveScore = Math.min(
    totalScore / Math.max(wordCount, 1),
    100,
  );
  const normalizedSpamScore = Math.min(
    (spamScore / Math.max(textLength, 1)) * 100,
    100,
  );

  const finalScore = Math.max(normalizedOffensiveScore, normalizedSpamScore);
  const confidence = Math.min(finalScore / 100, 1);

  // Determine if content should be flagged
  const isFlagged = finalScore > 20 || maxScore > 50; // Adjustable thresholds

  let reason = "";
  if (isFlagged) {
    if (normalizedOffensiveScore > normalizedSpamScore) {
      reason = "Potentially offensive or inappropriate language detected";
    } else {
      reason = "Potential spam or promotional content detected";
    }
  }

  return {
    isFlagged,
    reason,
    confidence,
    detectedTerms,
  };
}

/**
 * Returns threat score for specific terms
 */
function getThreatScore(term: string): number {
  const highThreat = ["kill", "die", "murder", "threat", "revenge", "hate"];
  const mediumThreat = ["fuck", "bitch", "worthless", "pathetic"];
  const lowThreat = ["damn", "crap", "stupid", "idiot"];

  if (highThreat.includes(term.toLowerCase())) return 80;
  if (mediumThreat.includes(term.toLowerCase())) return 50;
  if (lowThreat.includes(term.toLowerCase())) return 20;
  return 10; // Default score for other terms
}

/**
 * Advanced content analysis for suspicious patterns
 */
export function analyzeContentPatterns(text: string): {
  hasRepeatedChars: boolean;
  hasExcessiveCaps: boolean;
  hasUrls: boolean;
  hasSuspiciousNumbers: boolean;
  suspiciousPatterns: string[];
} {
  const patterns: string[] = [];

  const hasRepeatedChars = /(.)\1{4,}/.test(text);
  if (hasRepeatedChars) patterns.push("repeated_characters");

  const hasExcessiveCaps = /[A-Z]{5,}/.test(text);
  if (hasExcessiveCaps) patterns.push("excessive_capitals");

  const hasUrls = /(https?:\/\/[^\s]+)/.test(text);
  if (hasUrls) patterns.push("contains_urls");

  const hasSuspiciousNumbers = /\b\d{10,}\b/.test(text);
  if (hasSuspiciousNumbers) patterns.push("long_numbers");

  return {
    hasRepeatedChars,
    hasExcessiveCaps,
    hasUrls,
    hasSuspiciousNumbers,
    suspiciousPatterns: patterns,
  };
}

/**
 * Get user-friendly moderation message
 */
export function getModerationMessage(result: ModerationResult): string {
  if (!result.isFlagged) return "";

  const confidence = Math.round(result.confidence * 100);
  return `⚠️ Content flagged for review (${confidence}% confidence): ${result.reason}`;
}
