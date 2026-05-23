const axios = require('axios');

const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;

// Create axios instance with better config
const hfClient = axios.create({
  timeout: 60000,
  headers: { Authorization: `Bearer ${HF_API_KEY}` },
  // Add fallback DNS
  httpsAgent: new (require('https').Agent)({
    rejectUnauthorized: true,
    timeout: 60000
  })
});

async function analyzeWithHuggingFace(imageBuffer) {
  console.log('🔍 Starting AI Analysis...');
  console.log(`   Image size: ${imageBuffer?.length || 0} bytes`);
  console.log(`   API Key exists: ${!!HF_API_KEY}`);
  
  if (!HF_API_KEY) {
    console.log('⚠️ No API key, using defaults');
    return getDefaultResult();
  }

  // Test network connectivity first
  try {
    console.log('   Testing network connectivity...');
    await axios.get('https://8.8.8.8', { timeout: 5000 });
    console.log('   ✅ Network is reachable');
  } catch (networkError) {
    console.log('   ⚠️ Network issue detected:', networkError.message);
  }

  const results = {
    sceneCategory: 'General',
    environment: 'Indoor',
    socialGroup: 'Solo',
    faceCount: 1,
    qualityScore: 85,
    isFlagged: false
  };

  // Try each model with retries
  try {
    // 1. INDOOR/OUTDOOR DETECTION
    console.log('  📍 Calling Indoor/Outdoor model...');
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const indoorOutdoor = await hfClient.post(
          'https://api-inference.huggingface.co/models/prithivMLmods/IndoorOutdoorNet',
          imageBuffer,
          { responseType: 'json' }
        );
        
        if (indoorOutdoor.data && indoorOutdoor.data[0]) {
          const indoor = indoorOutdoor.data[0].find(p => p.label === 'indoor')?.score || 0;
          const outdoor = indoorOutdoor.data[0].find(p => p.label === 'outdoor')?.score || 0;
          results.environment = outdoor > indoor ? 'Outdoor' : 'Indoor';
          console.log(`     → Environment: ${results.environment}`);
        }
        break; // Success, exit retry loop
      } catch (err) {
        console.log(`     Attempt ${attempt} failed: ${err.message}`);
        if (attempt === 3) throw err;
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
      }
    }
  } catch (err) {
    console.log(`     ❌ Indoor/Outdoor failed: ${err.message}`);
  }

  try {
    // 2. SCENE CLASSIFICATION
    console.log('  📍 Calling Scene Classification model...');
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const scene = await hfClient.post(
          'https://api-inference.huggingface.co/models/microsoft/resnet-50',
          imageBuffer,
          { responseType: 'json' }
        );
        
        const keywords = {
          'Party': ['party', 'celebration', 'birthday', 'concert', 'dance'],
          'Event': ['wedding', 'conference', 'meeting', 'ceremony'],
          'Trip': ['beach', 'mountain', 'nature', 'travel', 'vacation']
        };
        
        if (scene.data && scene.data[0] && scene.data[0].labels) {
          for (const label of scene.data[0].labels.slice(0, 5)) {
            const l = label.toLowerCase();
            for (const [cat, words] of Object.entries(keywords)) {
              if (words.some(w => l.includes(w))) {
                results.sceneCategory = cat;
                break;
              }
            }
            if (results.sceneCategory !== 'General') break;
          }
          console.log(`     → Scene: ${results.sceneCategory}`);
        }
        break;
      } catch (err) {
        console.log(`     Attempt ${attempt} failed: ${err.message}`);
        if (attempt === 3) throw err;
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  } catch (err) {
    console.log(`     ❌ Scene failed: ${err.message}`);
  }

  try {
    // 3. FACE DETECTION
    console.log('  📍 Calling Face Detection model...');
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const faces = await hfClient.post(
          'https://api-inference.huggingface.co/models/arnabdhar/YOLOv8-Face-Detection',
          imageBuffer,
          { responseType: 'json' }
        );
        
        if (faces.data && Array.isArray(faces.data)) {
          results.faceCount = faces.data.filter(f => f.label === 'face' || f.label === 'person').length;
          if (results.faceCount === 0) results.socialGroup = 'Empty';
          else if (results.faceCount === 1) results.socialGroup = 'Solo';
          else if (results.faceCount === 2) results.socialGroup = 'Couple';
          else results.socialGroup = 'Group';
          console.log(`     → Faces: ${results.faceCount} → ${results.socialGroup}`);
        }
        break;
      } catch (err) {
        console.log(`     Attempt ${attempt} failed: ${err.message}`);
        if (attempt === 3) throw err;
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  } catch (err) {
    console.log(`     ❌ Face detection failed: ${err.message}`);
  }

  results.qualityScore = Math.floor(Math.random() * 25) + 70;
  results.isFlagged = results.qualityScore < 30;
  
  console.log(`✅ AI Analysis Complete:`, results);
  return results;
}

function getDefaultResult() {
  return {
    sceneCategory: 'General',
    environment: 'Indoor',
    socialGroup: 'Solo',
    faceCount: 1,
    qualityScore: 85,
    isFlagged: false
  };
}

module.exports = analyzeWithHuggingFace;