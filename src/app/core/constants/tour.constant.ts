import { TourStepInfo } from '../models';

export const TOUR_STEPS: TourStepInfo[] = [
  {
    step: 1,
    badge: 'STEP 1: ASPECT RATIO LOCK',
    title: '1. Frame Selection & Proportional Lock',
    description: 'The workstation locks your aspect ratio so photos never get awkwardly stretched or distorted. Follow the arrows 👇 pointing to preset ratios (16:9 Cinema, 1:1 Square, 4:5 Portrait) and drag the yellow corner handles ↖️ to custom crop or pan.',
    actionNote: 'Follow the arrows 👇: 16:9 widescreen frame locked! Drag corner handles ↖️ to crop.'
  },
  {
    step: 2,
    badge: 'STEP 2: SIZE & TARGET KB REDUCTION',
    title: '2. Scale Dimensions & Hit Exact File Size (KB)',
    description: 'Need to satisfy strict visa upload limits (under 200 KB) or web budgets? Follow the arrows 👇 to scale pixel dimensions (Step 2A), set your exact target file size in KB (Step 2B), and pick next-gen WebP or AVIF format (Step 2C).',
    actionNote: 'Follow the arrows 👇: Output constrained to 150 KB max in modern WebP format!'
  },
  {
    step: 3,
    badge: 'STEP 3: LIVE INSPECTION & COMPARISON',
    title: '3. Inspect Quality with the Live Split Wiper',
    description: 'Follow the split arrows ↔️: Drag the interactive wiper across the viewport to compare before vs after. Check the telemetry metrics 👇 for exact byte reduction, saved percentages, and resolution fidelity.',
    actionNote: 'Notice the split wiper ↔️ moving across! Real-time telemetry 👇 displays instant byte savings.'
  },
  {
    step: 4,
    badge: 'STEP 4: INSTANT EXPORT & AUTO-REVERT',
    title: '4. Download Your Maintained Image',
    description: 'Notice the highlighted DOWNLOAD button below 👇! In this demo walkthrough, we highlight where to download without downloading unprompted files to your drive.',
    actionNote: 'Notice the highlighted DOWNLOAD button 👇!'
  }
];
