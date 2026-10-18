const BLOCKLIST = [
  // Pay to work scams
  'pay to apply', 'registration fee', 'training fee', 'deposit required',
  'pay before joining', 'refundable deposit', 'security deposit',

  // Unrealistic promises
  'earn lakhs', 'earn crores', 'guaranteed income', 'guaranteed salary',
  'earn from home', 'work from home earn', '100% placement guarantee',
  'no experience needed earn', 'unlimited earning', 'passive income',

  // MLM / pyramid
  'multi level', 'multilevel', 'network marketing', 'refer and earn',
  'downline', 'upline', 'chain marketing', 'direct selling',

  // Urgency / pressure
  'limited seats', 'apply immediately', 'urgent requirement only today',
  'last chance', 'act now', 'dont miss this opportunity',

  // Vague / suspicious
  'data entry work from home', 'copy paste job', 'form filling job',
  'ad posting job', 'online typing job', 'captcha solving',
  'survey job', 'click ads earn money',
];

/**
 * Returns matched blocklist phrases found in the text.
 * Empty array = clean.
 */
function checkBlocklist(text = '') {
  const lower = text.toLowerCase();
  return BLOCKLIST.filter(phrase => lower.includes(phrase));
}

module.exports = { checkBlocklist };
