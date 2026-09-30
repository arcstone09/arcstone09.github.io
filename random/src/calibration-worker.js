import { calibrateAsync } from './statistics.js';
self.onmessage = async ({ data: { p, length = 100 } }) => {
  try {
    const model = await calibrateAsync(p, { length, onProgress: progress => self.postMessage({ progress }) });
    self.postMessage({ model });
  } catch (error) { self.postMessage({ error: error.message }); }
};
