import type { Config } from 'tailwindcss';
import sharedPreset from '../../packages/shared/tailwind.preset';

const config: Config = {
  presets: [sharedPreset],
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/shared/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      animation: {
        'bounce-slow': 'bounce 3s infinite',
        'bounce-slow-reverse': 'bounce 3s infinite reverse',
      }
    }
  }
};

export default config;
