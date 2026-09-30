import { calibrateAsync } from './statistics.js';
self.onmessage = async ({ data: { p } }) => {
  try {
    const model = await calibrateAsync(p, { onProgress: progress => self.postMessage({ progress }) });
    self.postMessage({ model });
  } catch (error) { self.postMessage({ error: error.message }); }
};
