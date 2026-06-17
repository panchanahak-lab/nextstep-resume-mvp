import type { Config } from 'tailwindcss';
import sharedPreset from '../../packages/shared/tailwind.preset';

const config: Config = {
  presets: [sharedPreset],
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/shared/src/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
};

export default config;
