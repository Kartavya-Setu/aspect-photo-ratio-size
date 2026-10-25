import { PlatformPreset, PresetRatioItem } from '../models';

export const PLATFORM_PRESETS: PlatformPreset[] = [
  {
    id: 'ig-post-square',
    name: 'Instagram Square',
    category: 'social',
    aspectRatio: '1:1',
    ratioValue: 1 / 1,
    targetWidth: 1080,
    targetHeight: 1080,
    recommendedMaxKb: 300,
    recommendedFormat: 'image/jpeg',
    description: 'Feed post standard square'
  },
  {
    id: 'ig-post-portrait',
    name: 'Instagram Portrait',
    category: 'social',
    aspectRatio: '4:5',
    ratioValue: 4 / 5,
    targetWidth: 1080,
    targetHeight: 1350,
    recommendedMaxKb: 400,
    recommendedFormat: 'image/jpeg',
    description: 'Optimal full-feed mobile vertical coverage'
  },
  {
    id: 'story-reels-tiktok',
    name: 'Story / Reels / TikTok',
    category: 'social',
    aspectRatio: '9:16',
    ratioValue: 9 / 16,
    targetWidth: 1080,
    targetHeight: 1920,
    recommendedMaxKb: 500,
    recommendedFormat: 'image/jpeg',
    description: 'Full screen vertical 1080x1920'
  },
  {
    id: 'yt-thumbnail',
    name: 'YouTube Thumbnail',
    category: 'social',
    aspectRatio: '16:9',
    ratioValue: 16 / 9,
    targetWidth: 1280,
    targetHeight: 720,
    recommendedMaxKb: 2048, // YouTube 2MB strict limit
    recommendedFormat: 'image/webp',
    description: 'Standard 16:9 thumb under 2MB limit'
  },
  {
    id: 'twitter-header',
    name: 'X / Twitter Header',
    category: 'social',
    aspectRatio: '3:1',
    ratioValue: 3 / 1,
    targetWidth: 1500,
    targetHeight: 500,
    recommendedMaxKb: 500,
    recommendedFormat: 'image/jpeg',
    description: 'Profile banner 1500x500'
  },
  {
    id: 'linkedin-banner',
    name: 'LinkedIn Cover',
    category: 'social',
    aspectRatio: '4:1',
    ratioValue: 1584 / 396,
    targetWidth: 1584,
    targetHeight: 396,
    recommendedMaxKb: 400,
    recommendedFormat: 'image/jpeg',
    description: 'Personal profile background banner'
  },
  {
    id: 'passport-photo',
    name: 'Official Passport 2x2"',
    category: 'document',
    aspectRatio: '1:1',
    ratioValue: 1 / 1,
    targetWidth: 600,
    targetHeight: 600,
    recommendedMaxKb: 240, // strict 240KB government limit for visa/passports
    recommendedFormat: 'image/jpeg',
    description: 'Standard US/EU 2x2 in (600x600 px) under 240KB'
  },
  {
    id: 'web-hero',
    name: 'Web Hero Banner',
    category: 'web',
    aspectRatio: '16:9',
    ratioValue: 16 / 9,
    targetWidth: 1920,
    targetHeight: 1080,
    recommendedMaxKb: 250, // Web performance best practice
    recommendedFormat: 'image/webp',
    description: 'High performance responsive website hero'
  },
  {
    id: 'app-icon-favicon',
    name: 'App Icon / Favicon',
    category: 'web',
    aspectRatio: '1:1',
    ratioValue: 1 / 1,
    targetWidth: 512,
    targetHeight: 512,
    recommendedMaxKb: 80,
    recommendedFormat: 'image/png',
    description: 'Square transparent icon asset'
  }
];

export const ASPECT_RATIO_PRESETS: PresetRatioItem[] = [
  { id: 'free', label: 'Freeform', ratio: null, sub: 'Free' },
  { id: '1:1', label: '1:1 Square', ratio: 1 / 1, sub: 'Square' },
  { id: '4:3', label: '4:3 Standard', ratio: 4 / 3, sub: 'Photo' },
  { id: '16:9', label: '16:9 Cinema / YT', ratio: 16 / 9, sub: 'Video' },
  { id: '9:16', label: '9:16 Story / Reel', ratio: 9 / 16, sub: 'Mobile' },
  { id: '3:2', label: '3:2 Photo 35mm', ratio: 3 / 2, sub: 'DSLR' },
  { id: '2:3', label: '2:3 Vertical', ratio: 2 / 3, sub: 'Portrait' },
  { id: '4:5', label: '4:5 IG Portrait', ratio: 4 / 5, sub: 'Social' },
  { id: '21:9', label: '21:9 Ultrawide', ratio: 21 / 9, sub: 'Cinema' },
  { id: 'custom', label: 'Custom W:H', ratio: null, sub: 'Custom' }
];
