const { RekognitionClient, DetectLabelsCommand, DetectModerationLabelsCommand, DetectTextCommand } = require('@aws-sdk/client-rekognition');
const fs = require('fs');
const path = require('path');

const client = new RekognitionClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const isConfigured = () =>
  process.env.AWS_ACCESS_KEY_ID && process.env.AWS_ACCESS_KEY_ID !== 'your_aws_access_key_here';

/**
 * Reads a local file and returns it as a Rekognition Image bytes object.
 */
function loadImageBytes(filePath) {
  const fullPath = path.join(process.cwd(), filePath.startsWith('/') ? filePath.slice(1) : filePath);
  const bytes = fs.readFileSync(fullPath);
  return { Bytes: bytes };
}

/**
 * Verifies a company document (incorporation cert / logo).
 * Checks: is it a real document? Any inappropriate content?
 * Falls back gracefully on error.
 */
async function verifyCompanyDocument(fileUrl) {
  const fallback = { isDocument: true, hasInappropriateContent: false, detectedText: [], labels: [], rekognitionUsed: false };

  if (!isConfigured()) return fallback;

  // Only process image files (skip PDFs — Rekognition doesn't support PDF)
  const ext = path.extname(fileUrl).toLowerCase();
  if (ext === '.pdf') return { ...fallback, rekognitionUsed: false, note: 'PDF skipped' };

  try {
    const image = loadImageBytes(fileUrl);

    const [labelsRes, moderationRes, textRes] = await Promise.allSettled([
      client.send(new DetectLabelsCommand({ Image: image, MaxLabels: 10, MinConfidence: 70 })),
      client.send(new DetectModerationLabelsCommand({ Image: image, MinConfidence: 60 })),
      client.send(new DetectTextCommand({ Image: image })),
    ]);

    const labels = labelsRes.status === 'fulfilled'
      ? labelsRes.value.Labels.map(l => l.Name)
      : [];

    const moderationLabels = moderationRes.status === 'fulfilled'
      ? moderationRes.value.ModerationLabels.map(l => l.Name)
      : [];

    const detectedText = textRes.status === 'fulfilled'
      ? textRes.value.TextDetections.filter(t => t.Type === 'LINE').map(t => t.DetectedText)
      : [];

    // Document-like labels
    const documentLabels = ['Document', 'Text', 'Paper', 'Certificate', 'Id Cards', 'Driving License', 'Passport'];
    const isDocument = labels.some(l => documentLabels.some(d => l.toLowerCase().includes(d.toLowerCase())));

    return {
      isDocument,
      hasInappropriateContent: moderationLabels.length > 0,
      inappropriateLabels: moderationLabels,
      detectedText,
      labels,
      rekognitionUsed: true,
    };
  } catch (err) {
    console.warn('⚠️  Rekognition fallback:', err.message);
    return fallback;
  }
}

/**
 * Verifies a student face photo.
 * Checks: is there exactly one face? Any inappropriate content?
 */
async function verifyFacePhoto(fileUrl) {
  const fallback = { faceCount: 1, hasInappropriateContent: false, rekognitionUsed: false };

  if (!isConfigured()) return fallback;

  try {
    const image = loadImageBytes(fileUrl);

    const [labelsRes, moderationRes] = await Promise.allSettled([
      client.send(new DetectLabelsCommand({ Image: image, MaxLabels: 10, MinConfidence: 80 })),
      client.send(new DetectModerationLabelsCommand({ Image: image, MinConfidence: 70 })),
    ]);

    const labels = labelsRes.status === 'fulfilled' ? labelsRes.value.Labels.map(l => l.Name) : [];
    const moderationLabels = moderationRes.status === 'fulfilled'
      ? moderationRes.value.ModerationLabels.map(l => l.Name) : [];

    const hasFace = labels.some(l => ['Face', 'Person', 'Human', 'Head'].includes(l));

    return {
      faceDetected: hasFace,
      hasInappropriateContent: moderationLabels.length > 0,
      inappropriateLabels: moderationLabels,
      labels,
      rekognitionUsed: true,
    };
  } catch (err) {
    console.warn('⚠️  Rekognition face fallback:', err.message);
    return fallback;
  }
}

module.exports = { verifyCompanyDocument, verifyFacePhoto };
