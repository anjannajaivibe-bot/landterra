export class SpamContentValidationError extends Error {
  public status = 400;

  constructor(message = 'Listing content contains prohibited terms or suspicious claims.') {
    super(message);
    this.name = 'SpamContentValidationError';
  }
}

export interface SpamScanResult {
  isBlocked: boolean;
  isSuspicious: boolean;
  blockedReason?: string;
  flaggedTerms: string[];
}

/**
 * Automated Pre-Submission Spam & Scam Keyword Filter
 * Scans title and description for fraudulent promises, advance payment solicitations,
 * fake document claims, and suspicious URL shorteners / off-platform chat links.
 */
export function scanListingContentForSpam(title = '', description = ''): SpamScanResult {
  const fullText = `${title || ''} ${description || ''}`.toLowerCase();

  // 1. Severe fraudulent / illegal claims that immediately block submission
  const BLOCKED_FRAUD_PATTERNS = [
    { pattern: /\bfake\s+deed\b/i, label: 'Fake Deed claims' },
    { pattern: /\b(disputed\s+land|kabja\s+land|illegal\s+possession)\b/i, label: 'Disputed or illegal possession land' },
    { pattern: /\b(advance\s+(money|payment|token)\s+before\s+(visit|seeing|site))\b/i, label: 'Advance payment solicitation before site visit' },
    { pattern: /\b(transfer\s+(advance|money)\s+to\s+(gpay|phonepe|paytm)\s+before\s+visit)\b/i, label: 'Off-platform advance payment demand' },
    { pattern: /\b(double\s+your\s+money|triple\s+your\s+money|100%\s+guaranteed\s+profit)\b/i, label: 'Unrealistic speculative financial guarantee' },
    { pattern: /\b(ponzi|money\s+doubling\s+scheme)\b/i, label: 'Financial fraud schemes' },
  ];

  for (const item of BLOCKED_FRAUD_PATTERNS) {
    if (item.pattern.test(fullText)) {
      return {
        isBlocked: true,
        isSuspicious: true,
        blockedReason: `Listing content contains prohibited terms: "${item.label}". BhoomiMitra strictly prohibits fraudulent promises, off-platform advance payment demands, and disputed properties.`,
        flaggedTerms: [item.label],
      };
    }
  }

  // 2. Suspicious terms and URL heuristics that flag the listing for mandatory manual admin review
  const SUSPICIOUS_TERMS_PATTERNS = [
    { pattern: /\bguaranteed\s+(return|returns|profit|income)\b/i, term: 'guaranteed returns' },
    { pattern: /\b(100%\s+return|risk\s+free\s+investment)\b/i, term: 'risk free investment' },
    { pattern: /\bwithout\s+documents\b/i, term: 'without documents' },
    { pattern: /\bno\s+documents\s+needed\b/i, term: 'no documents needed' },
    { pattern: /\b(earn\s+daily|earn\s+per\s+day)\b/i, term: 'daily earning claims' },
    { pattern: /\b(bitcoin|crypto|usdt|ethereum)\b/i, term: 'cryptocurrency solicitation' },
    { pattern: /(https?:\/\/)?(t\.me|telegram\.me)\/[a-zA-Z0-9_+]+/i, term: 'telegram channel link' },
    { pattern: /(https?:\/\/)?(bit\.ly|tinyurl\.com|cutt\.ly|is\.gd)\/[a-zA-Z0-9_-]+/i, term: 'url shortener link' },
  ];

  const flaggedTerms: string[] = [];
  for (const item of SUSPICIOUS_TERMS_PATTERNS) {
    if (item.pattern.test(fullText)) {
      flaggedTerms.push(item.term);
    }
  }

  return {
    isBlocked: false,
    isSuspicious: flaggedTerms.length > 0,
    flaggedTerms,
  };
}
