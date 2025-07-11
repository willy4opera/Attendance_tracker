
## YouTube Integration

The application supports YouTube video uploads for comments.

### Setup
1. Configure YouTube API credentials in `.env`
2. Run authentication: `node scripts/setup-youtube-auth.js`
3. Videos are uploaded to the configured YouTube channel

### Features
- Direct video upload to YouTube
- Privacy control (private/unlisted/public)
- Automatic thumbnail generation
- Progress tracking during upload

See [YouTube Integration Documentation](../docs/backend-youtube-integration.md) for details.
