export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function normalizeFloorplanPoint({ clientX, clientY, rect, pan, zoom }) {
  return {
    x: clamp(((clientX - rect.left - pan.x) / zoom) / rect.width * 100, 2, 98),
    y: clamp(((clientY - rect.top - pan.y) / zoom) / rect.height * 100, 3, 97)
  };
}

export function normalizeZoom(value) { return clamp(value, .6, 2.5); }

export function pinchZoom(initialZoom,initialDistance,currentDistance){
  if(!Number.isFinite(initialDistance)||initialDistance<=0||!Number.isFinite(currentDistance))return normalizeZoom(initialZoom);
  return normalizeZoom(initialZoom*(currentDistance/initialDistance));
}
