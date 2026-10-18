const { ComprehendClient, DetectSentimentCommand, DetectKeyPhrasesCommand, DetectPiiEntitiesCommand } = require('@aws-sdk/client-comprehend');

const client = new ComprehendClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Runs sentiment + PII + key phrase analysis on job description.
 * Falls back gracefully on any error.
 */
async function analyzeWithComprehend(text) {
  const fallback = {
    sentiment: 'NEUTRAL',
    sentimentScore: { Positive: 0.5, Negative: 0.1, Neutral: 0.4, Mixed: 0 },
    piiEntities: [],
    keyPhrases: [],
    comprehendUsed: false,
  };

  if (!process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID === 'your_aws_access_key_here') {
    return fallback;
  }

  try {
    const input = { Text: text.slice(0, 5000), LanguageCode: 'en' }; // Comprehend max 5000 bytes

    const [sentimentRes, keyPhrasesRes, piiRes] = await Promise.allSettled([
      client.send(new DetectSentimentCommand(input)),
      client.send(new DetectKeyPhrasesCommand(input)),
      client.send(new DetectPiiEntitiesCommand(input)),
    ]);

    return {
      sentiment: sentimentRes.status === 'fulfilled' ? sentimentRes.value.Sentiment : 'NEUTRAL',
      sentimentScore: sentimentRes.status === 'fulfilled' ? sentimentRes.value.SentimentScore : fallback.sentimentScore,
      keyPhrases: keyPhrasesRes.status === 'fulfilled'
        ? keyPhrasesRes.value.KeyPhrases.map(k => k.Text)
        : [],
      piiEntities: piiRes.status === 'fulfilled'
        ? piiRes.value.Entities.map(e => ({ type: e.Type, score: e.Score }))
        : [],
      comprehendUsed: true,
    };
  } catch (err) {
    console.warn('⚠️  Comprehend fallback:', err.message);
    return fallback;
  }
}

/**
 * Interprets Comprehend results into scam signals.
 */
function interpretComprehend(comprehendResult) {
  const signals = [];
  let penalty = 0;

  // Negative sentiment is a scam signal
  if (comprehendResult.sentiment === 'NEGATIVE') {
    signals.push('Negative sentiment detected in description');
    penalty += 10;
  }

  // High negative sentiment score even if overall not NEGATIVE
  if (comprehendResult.sentimentScore?.Negative > 0.4) {
    signals.push('High negative tone in description');
    penalty += 5;
  }

  // PII in job description is suspicious (hidden phone/email in text body)
  const suspiciousPii = comprehendResult.piiEntities.filter(e =>
    ['PHONE', 'EMAIL', 'SSN', 'BANK_ACCOUNT_NUMBER', 'CREDIT_DEBIT_NUMBER'].includes(e.type)
  );
  if (suspiciousPii.length > 0) {
    signals.push(`PII detected in description: ${suspiciousPii.map(p => p.type).join(', ')}`);
    penalty += suspiciousPii.length * 5;
  }

  return { signals, penalty };
}

module.exports = { analyzeWithComprehend, interpretComprehend };
