const detectPlatform = (url) => {
  if (!url) return 'other';
  const lowerUrl = url.toLowerCase();
  
  if (lowerUrl.includes('amazon.in') || lowerUrl.includes('amazon.com') || lowerUrl.includes('amzn.')) {
    return 'amazon';
  }
  if (lowerUrl.includes('flipkart.com') || lowerUrl.includes('fkrt.it')) {
    return 'flipkart';
  }
  if (lowerUrl.includes('meesho.com')) {
    return 'meesho';
  }
  if (lowerUrl.includes('myntra.com')) {
    return 'myntra';
  }
  return 'other';
};

module.exports = { detectPlatform };
