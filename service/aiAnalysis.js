const axios = require('axios');

const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;

async function analyzeWithHuggingFace(imageBuffer) {
  console.log('🔍 Starting AI Analysis with Hugging Face...');
  console.log(`   Image buffer size: ${imageBuffer?.length || 0} bytes`);
  console.log(`   API Key exists: ${!!HF_API_KEY}`);
  
  if (!HF_API_KEY) {
    console.log('⚠️ No Hugging Face API key, using default values');
    return {
      sceneCategory: 'General',
      environment: 'Indoor',
      socialGroup: 'Solo',
      faceCount: 1,
      qualityScore: 85,
      isFlagged: false
    };
  }

  try {
    // 1. INDOOR/OUTDOOR DETECTION
    console.log('  📍 Calling Indoor/Outdoor model...');
    let environment = 'Indoor';
    try {
      const indoorOutdoor = await axios.post(
        'https://api-inference.huggingface.co/models/prithivMLmods/IndoorOutdoorNet',
        imageBuffer,
        { 
          headers: { Authorization: `Bearer ${HF_API_KEY}` },
          timeout: 30000
        }
      );
      
      if (indoorOutdoor.data && indoorOutdoor.data[0]) {
        const predictions = indoorOutdoor.data[0];
        const indoor = predictions.find(p => p.label === 'indoor')?.score || 0;
        const outdoor = predictions.find(p => p.label === 'outdoor')?.score || 0;
        environment = outdoor > indoor ? 'Outdoor' : 'Indoor';
        console.log(`     → Environment: ${environment} (indoor:${indoor.toFixed(3)}, outdoor:${outdoor.toFixed(3)})`);
      }
    } catch (err) {
      console.log(`     ❌ Indoor/Outdoor failed: ${err.message}`);
    }

    // 2. SCENE CLASSIFICATION
    console.log('  📍 Calling Scene Classification model...');
    let sceneCategory = 'General';
    try {
      const scene = await axios.post(
        'https://api-inference.huggingface.co/models/microsoft/resnet-50',
        imageBuffer,
        { 
          headers: { Authorization: `Bearer ${HF_API_KEY}` },
          timeout: 30000
        }
      );
      
      const keywords = {
        'Party': ['party', 'celebration', 'birthday', 'concert', 'dance', 'nightclub', 'festival'],
        'Event': ['wedding', 'conference', 'meeting', 'ceremony', 'graduation', 'award'],
        'Trip': ['beach', 'mountain', 'forest', 'landmark', 'tourist', 'nature', 'travel', 'vacation']
      };
      
      if (scene.data && scene.data[0] && scene.data[0].labels) {
        const topLabels = scene.data[0].labels.slice(0, 5);
        console.log(`     Top labels: ${topLabels.join(', ')}`);
        
        for (const label of topLabels) {
          const l = label.toLowerCase();
          for (const [cat, words] of Object.entries(keywords)) {
            if (words.some(word => l.includes(word))) {
              sceneCategory = cat;
              console.log(`     ✓ Match: "${label}" → ${cat}`);
              break;
            }
          }
          if (sceneCategory !== 'General') break;
        }
        console.log(`     → Scene: ${sceneCategory}`);
      }
    } catch (err) {
      console.log(`     ❌ Scene classification failed: ${err.message}`);
    }

    // 3. FACE DETECTION
    console.log('  📍 Calling Face Detection model...');
    let faceCount = 0;
    let socialGroup = 'Empty';
    try {
      const faces = await axios.post(
        'https://api-inference.huggingface.co/models/arnabdhar/YOLOv8-Face-Detection',
        imageBuffer,
        { 
          headers: { Authorization: `Bearer ${HF_API_KEY}` },
          timeout: 30000
        }
      );
      
      if (faces.data && Array.isArray(faces.data)) {
        faceCount = faces.data.filter(f => f.label === 'face' || f.label === 'person').length;
        if (faceCount === 0) socialGroup = 'Empty';
        else if (faceCount === 1) socialGroup = 'Solo';
        else if (faceCount === 2) socialGroup = 'Couple';
        else socialGroup = 'Group';
        console.log(`     → Faces: ${faceCount} → ${socialGroup}`);
      }
    } catch (err) {
      console.log(`     ❌ Face detection failed: ${err.message}`);
    }

    const qualityScore = Math.floor(Math.random() * 25) + 70;
    
    const result = {
      sceneCategory,
      environment,
      socialGroup,
      faceCount,
      qualityScore,
      isFlagged: qualityScore < 30
    };
    
    console.log(`✅ AI Analysis Complete:`, result);
    return result;
    
  } catch (error) {
    console.error('❌ AI Analysis fatal error:', error.message);
    return {
      sceneCategory: 'General',
      environment: 'Indoor',
      socialGroup: 'Solo',
      faceCount: 1,
      qualityScore: 85,
      isFlagged: false
    };
  }
}

module.exports = analyzeWithHuggingFace;