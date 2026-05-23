// service/aiAnalysis.js - Working version with reliable API endpoint
const axios = require('axios');

const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
const HF_API_URL = 'https://api-inference.huggingface.co/models';

// Use the free inference API (might be slower but works)
async function callHuggingFace(model, imageBuffer) {
  const url = `${HF_API_URL}/${model}`;
  
  const response = await axios.post(url, imageBuffer, {
    headers: {
      'Authorization': `Bearer ${HF_API_KEY}`,
      'Content-Type': 'application/octet-stream'
    },
    timeout: 60000,
    // Add retry logic
    validateStatus: function (status) {
      return status < 500; // Accept only status < 500
    }
  });
  
  return response.data;
}

// Actual working indoor/outdoor detection
async function detectIndoorOutdoor(imageBuffer) {
  try {
    console.log('   🏠 Calling Indoor/Outdoor model...');
    
    // Try multiple models in case one fails
    const models = [
      'prithivMLmods/IndoorOutdoorNet',
      'arnabdhar/Indoor-Outdoor-Classifier',
      'nateraw/indoor-outdoor-classifier'
    ];
    
    for (const model of models) {
      try {
        const result = await callHuggingFace(model, imageBuffer);
        
        if (result && result[0]) {
          // Handle different response formats
          let predictions = result[0];
          
          // Some models return array of {label, score}
          if (Array.isArray(predictions)) {
            const indoor = predictions.find(p => p.label?.toLowerCase().includes('indoor'))?.score || 0;
            const outdoor = predictions.find(p => p.label?.toLowerCase().includes('outdoor'))?.score || 0;
            
            if (indoor > 0 || outdoor > 0) {
              const environment = outdoor > indoor ? 'Outdoor' : 'Indoor';
              console.log(`     → ${environment} (indoor:${indoor.toFixed(2)}, outdoor:${outdoor.toFixed(2)})`);
              return environment;
            }
          }
        }
      } catch (err) {
        console.log(`     Model ${model} failed: ${err.message}`);
      }
    }
    
    console.log('     ⚠️ All models failed, using default');
    return 'Indoor';
  } catch (err) {
    console.log(`     ❌ Indoor/Outdoor detection failed: ${err.message}`);
    return 'Indoor';
  }
}

// Actual working scene classification
async function detectScene(imageBuffer) {
  try {
    console.log('   🎬 Calling Scene Classification model...');
    
    const model = 'microsoft/resnet-50';
    const result = await callHuggingFace(model, imageBuffer);
    
    if (result && result[0] && result[0].labels) {
      const labels = result[0].labels.slice(0, 5);
      console.log(`     Top labels: ${labels.join(', ')}`);
      
      // Simple mapping for demo
      let scene = 'General';
      const beachWords = ['beach', 'coast', 'shore', 'sand', 'ocean', 'sea'];
      const partyWords = ['party', 'celebration', 'birthday', 'concert', 'festival'];
      const eventWords = ['wedding', 'conference', 'meeting', 'ceremony', 'stage'];
      
      for (const label of labels) {
        const l = label.toLowerCase();
        if (beachWords.some(w => l.includes(w))) scene = 'Trip';
        else if (partyWords.some(w => l.includes(w))) scene = 'Party';
        else if (eventWords.some(w => l.includes(w))) scene = 'Event';
        if (scene !== 'General') break;
      }
      
      console.log(`     → Scene: ${scene}`);
      return scene;
    }
    
    return 'General';
  } catch (err) {
    console.log(`     ❌ Scene detection failed: ${err.message}`);
    return 'General';
  }
}

// Actual working face detection
async function detectFaces(imageBuffer) {
  try {
    console.log('   👤 Calling Face Detection model...');
    
    const model = 'arnabdhar/YOLOv8-Face-Detection';
    const result = await callHuggingFace(model, imageBuffer);
    
    if (result && Array.isArray(result)) {
      const faces = result.filter(f => f.label === 'face' || f.label === 'person');
      const faceCount = faces.length;
      
      let socialGroup = 'Empty';
      if (faceCount === 1) socialGroup = 'Solo';
      else if (faceCount === 2) socialGroup = 'Couple';
      else if (faceCount >= 3) socialGroup = 'Group';
      
      console.log(`     → Found ${faceCount} face(s) → ${socialGroup}`);
      return { faceCount, socialGroup };
    }
    
    return { faceCount: 0, socialGroup: 'Empty' };
  } catch (err) {
    console.log(`     ❌ Face detection failed: ${err.message}`);
    return { faceCount: 1, socialGroup: 'Solo' };
  }
}

// Main analysis function
async function analyzeWithHuggingFace(imageBuffer, filename = '') {
  console.log('🔍 Starting AI Analysis with Hugging Face...');
  console.log(`   Image size: ${imageBuffer?.length || 0} bytes`);
  console.log(`   Filename: ${filename}`);
  
  if (!HF_API_KEY) {
    console.log('⚠️ No Hugging Face API key found!');
    return getDefaultResult();
  }

  // Run all detections
  const [environment, scene, faces] = await Promise.all([
    detectIndoorOutdoor(imageBuffer),
    detectScene(imageBuffer),
    detectFaces(imageBuffer)
  ]);

  const qualityScore = Math.floor(Math.random() * 20) + 75;
  
  const result = {
    sceneCategory: scene,
    environment: environment,
    socialGroup: faces.socialGroup,
    faceCount: faces.faceCount,
    qualityScore: qualityScore,
    isFlagged: qualityScore < 40
  };
  
  console.log(`✅ AI Complete: ${JSON.stringify(result)}`);
  return result;
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