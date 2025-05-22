import type { ChromeAPI } from '@redhat-cloud-services/types';

export {};
declare global {
  interface Window {
    insights: {
      chrome: ChromeAPI;
    };
  }
}
