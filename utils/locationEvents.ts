type LocationData = { lat: number; lng: number };
type Listener = (data: LocationData) => void;

let globalListener: Listener | null = null;

export const setGlobalLocationListener = (cb: Listener) => {
  globalListener = cb;
};

export const clearGlobalLocationListener = () => {
  globalListener = null;
};

export const emitGlobalLocation = (lat: number, lng: number) => {
  if (globalListener) {
    globalListener({ lat, lng });
  }
};
