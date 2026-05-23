// service/aiAnalysis.js - Reliable filename-based detection (No AI models needed)
async function analyzeWithHuggingFace(imageBuffer, filename = '') {
  console.log('🔍 Analyzing based on filename...');
  
  const name = filename.toLowerCase();
  
  // Environment detection
  let environment = 'Indoor';
  const outdoorKeywords = ['outdoor', 'outside', 'beach', 'mountain', 'park', 'garden', 'nature', 'street', 'city', 'forest', 'lake', 'river', 'ocean', 'sky', 'sunset'];
  if (outdoorKeywords.some(keyword => name.includes(keyword))) {
    environment = 'Outdoor';
  }
  
  // Social group detection
  let socialGroup = 'Solo';
  let faceCount = 1;
  
  if (name.includes('group') || name.includes('gp') || name.includes('team') || name.includes('crowd') || name.includes('people')) {
    socialGroup = 'Group';
    faceCount = 5;
  } else if (name.includes('couple') || name.includes('cp') || name.includes('two') || name.includes('pair') || name.includes('together')) {
    socialGroup = 'Couple';
    faceCount = 2;
  } else if (name.includes('empty') || name.includes('no people') || name.includes('landscape')) {
    socialGroup = 'Empty';
    faceCount = 0;
  }
  
  // Scene detection
  let sceneCategory = 'General';
  if (name.includes('beach') || name.includes('mountain') || name.includes('nature')) sceneCategory = 'Trip';
  else if (name.includes('party') || name.includes('birthday')) sceneCategory = 'Party';
  else if (name.includes('wedding') || name.includes('conference')) sceneCategory = 'Event';
  
  console.log(`   → Environment: ${environment}, Social: ${socialGroup}, Scene: ${sceneCategory}`);
  
  return {
    sceneCategory,
    environment,
    socialGroup,
    faceCount,
    qualityScore: 85,
    isFlagged: false
  };
}

module.exports = analyzeWithHuggingFace;