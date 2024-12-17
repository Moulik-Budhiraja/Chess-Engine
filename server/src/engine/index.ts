import { Engine } from "./engine";

declare global {
  // eslint-disable-next-line no-var
  var engineInstance: Engine | undefined;
}

const getEngineInstance = (): Engine => {
  if (!global.engineInstance) {
    global.engineInstance = new Engine();
  }
  return global.engineInstance;
};

export const engine = getEngineInstance();
