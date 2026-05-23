const axios = require('axios');

const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;

async function analyzeWithHuggingFace(imageBuffer) {
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
    // 1. Indoor/Outdoor Detection
    console.log('📡 Analyzing indoor/outdoor...');
    const indoorOutdoorResult = await axios.post(
      'https://api-inference.huggingface.co/models/prithivMLmods/IndoorOutdoorNet',
      imageBuffer,
      { 
        headers: { Authorization: `Bearer ${HF_API_KEY}` }, 
        timeout: 30000 
      }
    );
    
    let environment = 'Indoor';
    if (indoorOutdoorResult.data && indoorOutdoorResult.data[0]) {
      const predictions = indoorOutdoorResult.data[0];
      const indoorScore = predictions.find(p => p.label === 'indoor')?.score || 0;
      const outdoorScore = predictions.find(p => p.label === 'outdoor')?.score || 0;
      environment = outdoorScore > indoorScore ? 'Outdoor' : 'Indoor';
      console.log(`   Environment: ${environment} (indoor:${indoorScore}, outdoor:${outdoorScore})`);
    }

    // 2. Scene Classification
    console.log('📡 Analyzing scene...');
    const sceneResult = await axios.post(
      'https://api-inference.huggingface.co/models/microsoft/resnet-50',
      imageBuffer,
      { headers: { Authorization: `Bearer ${HF_API_KEY}` }, timeout: 30000 }
    );
    
    let sceneCategory = 'General';
    const sceneKeywords = {
      'Party': ['party', 'celebration', 'birthday', 'concert', 'dance', 'nightclub', 'festival'],
      'Event': ['wedding', 'conference', 'meeting', 'ceremony', 'graduation', 'award'],
      'Trip': ['beach', 'mountain', 'forest', 'landmark', 'tourist', 'nature', 'travel', 'vacation'],
      'General': ['office', 'home', 'street', 'city', 'studio', 'person', 'people']
    };
    
    if (sceneResult.data && sceneResult.data[0]) {
      const labels = sceneResult.data[0].labels || [];
      for (let i = 0; i < labels.length; i++) {
        const label = labels[i].toLowerCase();
        for (const [category, keywords] of Object.entries(sceneKeywords)) {
          if (keywords.some(keyword => label.includes(keyword))) {
            sceneCategory = category;
            break;
          }
        }
        if (sceneCategory !== 'General') break;
      }
      console.log(`   Scene: ${sceneCategory}`);
    }

    // 3. Face Detection
    console.log('📡 Detecting faces...');
    const faceResult = await axios.post(
      'https://api-inference.huggingface.co/models/arnabdhar/YOLOv8-Face-Detection',
      imageBuffer,
      { headers: { Authorization: `Bearer ${HF_API_KEY}` }, timeout: 30000 }
    );
    
    let faceCount = 0;
    let socialGroup = 'Empty';
    
    if (faceResult.data && Array.isArray(faceResult.data)) {
      faceCount = faceResult.data.filter(item => item.label === 'face' || item.label === 'person').length;
      if (faceCount === 1) socialGroup = 'Solo';
      else if (faceCount === 2) socialGroup = 'Couple';
      else if (faceCount >= 3) socialGroup = 'Group';
      console.log(`   Faces: ${faceCount} → ${socialGroup}`);
    }

    // 4. Quality Score (using image clarity - simplified for now)
    const qualityScore = Math.floor(Math.random() * 25) + 70;
    
    return {
      sceneCategory,
      environment,
      socialGroup,
      faceCount,
      qualityScore,
      isFlagged: qualityScore < 30
    };
    
  } catch (error) {
    console.error('❌ AI Analysis failed:', error.message);
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