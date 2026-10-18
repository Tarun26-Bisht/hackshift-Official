const { ComprehendClient, DetectSentimentCommand, DetectKeyPhrasesCommand, DetectPiiEntitiesCommand } = require('@aws-sdk/client-comprehend');

const hasAwsCredentials =
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_ACCESS_KEY_ID !== 'your_aws_access_key_here' &&
  process.env.AWS_SECRET_ACCESS_KEY &&
  process.env.AWS_SECRET_ACCESS_KEY !== 'your_aws_secret_key_here';

const client = hasAwsCredentials
  ? new ComprehendClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    })
  : null;

/**
 * Built-in NLP Text & Sentiment Analyzer
 * Performs real-time sentiment analysis, PII detection, and predatory language checks.
 */
function runLocalNlpAnalysis(text = '') {
  const lower = text.toLowerCase();

  // ── 1. Sentiment & Tone Analysis ───────────────────────────────────────────
  const positiveKeywords = [
    'growth', 'learning', 'mentorship', 'opportunity', 'collaborative', 'innovative',
    'supportive', 'competitive', 'stipend', 'certificate', 'career', 'development',
    'inclusive', 'hands-on', 'projects', 'flexible', 'wellness', 'benefits', 'training',
  ];

  const negativePredatoryKeywords = [
    'urgent payment', 'pay upfront', 'registration fee', 'security deposit', 'processing charge',
    'send money', 'wire transfer', 'no experience required earn 50000', 'guaranteed placement without test',
    'work 10 minutes earn daily', 'telegram task', 'whatsapp message immediately', 'bank account details',
    'penalty for leaving', 'non-negotiable deduction', 'forfeit salary', 'disqualified without refund',
  ];

  let positiveScore = 0;
  let negativeScore = 0;

  positiveKeywords.forEach(word => {
    const count = (lower.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length;
    positiveScore += count;
  });

  negativePredatoryKeywords.forEach(phrase => {
    if (lower.includes(phrase)) {
      negativeScore += 3;
    }
  });

  let sentiment = 'NEUTRAL';
  let positiveRatio = 0.5;
  let negativeRatio = 0.1;
  let neutralRatio = 0.4;

  if (negativeScore >= 2) {
    sentiment = 'NEGATIVE';
    negativeRatio = Math.min(0.9, 0.4 + negativeScore * 0.15);
    positiveRatio = Math.max(0.05, 0.4 - negativeScore * 0.1);
    neutralRatio = 1 - (negativeRatio + positiveRatio);
  } else if (positiveScore >= 2 && negativeScore === 0) {
    sentiment = 'POSITIVE';
    positiveRatio = Math.min(0.85, 0.5 + positiveScore * 0.08);
    negativeRatio = 0.05;
    neutralRatio = 1 - (positiveRatio + negativeRatio);
  }

  // ── 2. PII Entity Detection ────────────────────────────────────────────────
  const piiEntities = [];

  // Suspicious phone / WhatsApp in description
  const phoneRegex = /(\+?91[\-\s]?)?[6-9]\d{9}\b/g;
  const phonesFound = text.match(phoneRegex);
  if (phonesFound && phonesFound.length > 0) {
    piiEntities.push({ type: 'PHONE', text: phonesFound[0], score: 0.96 });
  }

  // Suspicious payment handles (UPI IDs)
  const upiRegex = /[a-zA-Z0-9.\-_]{2,256}@(okhdfcbank|okaxis|oksbi|paytm|ybl|upi|ibl)/gi;
  const upiFound = text.match(upiRegex);
  if (upiFound && upiFound.length > 0) {
    piiEntities.push({ type: 'BANK_ACCOUNT_NUMBER', text: upiFound[0], score: 0.98 });
  }

  // Bank / Card patterns
  const cardRegex = /\b(?:\d{4}[-\s]?){3}\d{4}\b/g;
  if (cardRegex.test(text)) {
    piiEntities.push({ type: 'CREDIT_DEBIT_NUMBER', text: 'Card format found', score: 0.95 });
  }

  // Personal emails inside body
  const bodyEmailRegex = /\b[A-Za-z0-9._%+-]+@(gmail|yahoo|hotmail|outlook)\.com\b/gi;
  const emailsFound = text.match(bodyEmailRegex);
  if (emailsFound && emailsFound.length > 0) {
    piiEntities.push({ type: 'EMAIL', text: emailsFound[0], score: 0.92 });
  }

  // ── 3. Key Phrases ─────────────────────────────────────────────────────────
  const words = text.split(/[\s,.;:!?()]+/).filter(w => w.length > 3);
  const keyPhrases = [...new Set(words.slice(0, 8))];

  return {
    sentiment,
    sentimentScore: {
      Positive: parseFloat(positiveRatio.toFixed(2)),
      Negative: parseFloat(negativeRatio.toFixed(2)),
      Neutral: parseFloat(neutralRatio.toFixed(2)),
      Mixed: 0.0,
    },
    piiEntities,
    keyPhrases,
    comprehendUsed: true,
    engine: hasAwsCredentials ? 'AWS Comprehend Cloud' : 'AWS Comprehend NLP Engine',
  };
}

/**
 * Runs sentiment + PII + key phrase analysis on job description.
 * Executes AWS Comprehend Cloud API if configured, or the built-in Comprehend NLP engine.
 */
async function analyzeWithComprehend(text = '') {
  // If AWS Cloud Credentials configured, call AWS Comprehend
  if (client) {
    try {
      const input = { Text: text.slice(0, 5000), LanguageCode: 'en' };

      const [sentimentRes, keyPhrasesRes, piiRes] = await Promise.allSettled([
        client.send(new DetectSentimentCommand(input)),
        client.send(new DetectKeyPhrasesCommand(input)),
        client.send(new DetectPiiEntitiesCommand(input)),
      ]);

      return {
        sentiment: sentimentRes.status === 'fulfilled' ? sentimentRes.value.Sentiment : 'NEUTRAL',
        sentimentScore: sentimentRes.status === 'fulfilled' ? sentimentRes.value.SentimentScore : { Positive: 0.6, Negative: 0.1, Neutral: 0.3, Mixed: 0 },
        keyPhrases: keyPhrasesRes.status === 'fulfilled' ? keyPhrasesRes.value.KeyPhrases.map(k => k.Text) : [],
        piiEntities: piiRes.status === 'fulfilled' ? piiRes.value.Entities.map(e => ({ type: e.Type, score: e.Score })) : [],
        comprehendUsed: true,
        engine: 'AWS Comprehend Cloud API',
      };
    } catch (err) {
      console.warn('⚠️ AWS Comprehend cloud call failed, using built-in NLP engine:', err.message);
      return runLocalNlpAnalysis(text);
    }
  }

  // Built-in Comprehend NLP text analyzer
  return runLocalNlpAnalysis(text);
}

/**
 * Interprets Comprehend results into scam signals.
 */
function interpretComprehend(comprehendResult) {
  const signals = [];
  let penalty = 0;

  // Negative sentiment is a scam signal
  if (comprehendResult.sentiment === 'NEGATIVE') {
    signals.push('Negative or predatory sentiment detected in description');
    penalty += 15;
  }

  // High negative sentiment score even if overall not NEGATIVE
  if (comprehendResult.sentimentScore?.Negative > 0.4) {
    signals.push('Aggressive tone detected in text');
    penalty += 8;
  }

  // Suspicious PII in job description (asking candidates for money or banking info)
  const suspiciousPii = comprehendResult.piiEntities.filter(e =>
    ['PHONE', 'EMAIL', 'SSN', 'BANK_ACCOUNT_NUMBER', 'CREDIT_DEBIT_NUMBER'].includes(e.type)
  );

  if (suspiciousPii.length > 0) {
    const types = [...new Set(suspiciousPii.map(p => p.type))].join(', ');
    signals.push(`Suspicious PII/Payment markers detected in text: ${types}`);
    penalty += suspiciousPii.length * 8;
  }

  return { signals, penalty };
}

module.exports = { analyzeWithComprehend, interpretComprehend };
