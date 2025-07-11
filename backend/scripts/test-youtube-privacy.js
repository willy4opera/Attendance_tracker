#!/usr/bin/env node

/**
 * Test YouTube privacy settings and channel info
 */

require('dotenv').config();
const youtubeService = require('../src/services/youtubeService');

async function testPrivacySettings() {
  console.log('🎥 YouTube Privacy Settings Test\n');

  if (!youtubeService.isAuthenticated()) {
    console.error('❌ YouTube service is not authenticated!');
    process.exit(1);
  }

  try {
    // Get channel information
    console.log('📺 Getting channel information...\n');
    const channelInfo = await youtubeService.getChannelInfo();
    
    console.log('Channel Details:');
    console.log(`- Channel Name: ${channelInfo.title}`);
    console.log(`- Channel ID: ${channelInfo.id}`);
    console.log(`- Subscribers: ${channelInfo.subscriberCount}`);
    console.log(`- Total Videos: ${channelInfo.videoCount}`);
    console.log(`- Channel URL: https://www.youtube.com/channel/${channelInfo.id}`);
    
    if (channelInfo.customUrl) {
      console.log(`- Custom URL: https://www.youtube.com/${channelInfo.customUrl}`);
    }
    
    console.log('\n🔒 Privacy Options:');
    console.log('1. private - Only you can view');
    console.log('2. unlisted - Anyone with link can view');
    console.log('3. public - Everyone can view and search');
    
    console.log('\n📝 To upload with different privacy settings, use:');
    console.log('await youtubeService.uploadVideo(videoPath, {');
    console.log('  title: "My Video",');
    console.log('  privacyStatus: "private" // or "unlisted" or "public"');
    console.log('});');
    
    // Test updating privacy of existing video
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question('\nEnter a video ID to change its privacy (or press Enter to skip): ', async (videoId) => {
      if (videoId) {
        rl.question('Enter new privacy status (private/unlisted/public): ', async (privacy) => {
          try {
            const result = await youtubeService.updateVideoPrivacy(videoId, privacy);
            console.log(`\n✅ Video privacy updated to: ${result.privacyStatus}`);
          } catch (error) {
            console.error('❌ Error updating privacy:', error.message);
          }
          rl.close();
        });
      } else {
        rl.close();
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testPrivacySettings();
