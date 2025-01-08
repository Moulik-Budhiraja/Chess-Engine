// engineManager.ts
import { Engine } from "./engine";

// 1. Extend the global namespace with a centralized storage for Engine instances
declare global {
  // eslint-disable-next-line no-var
  var engineInstances: { [key: string]: Engine | undefined };
}

// Initialize the global.engineInstances object if it doesn't exist
if (!global.engineInstances) {
  global.engineInstances = {};
}

/**
 * 2. Generic function to get or create an Engine instance based on a key
 * @param key A unique identifier for the Engine instance
 * @returns An instance of Engine
 */
const getEngineInstance = (key: string = "default"): Engine => {
  if (!global.engineInstances[key]) {
    // You can customize the Engine instantiation based on the key if needed
    global.engineInstances[key] = new Engine();
  }
  return global.engineInstances[key]!;
};

// 3. Export the specific Engine instances
export const engine = getEngineInstance("default");
export const whiteTestEngine = getEngineInstance("whiteTest");
export const blackTestEngine = getEngineInstance("blackTest");
