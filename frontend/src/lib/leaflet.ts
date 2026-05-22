// Bounding boxes, coordinates and styling tokens for Kerala OpenStreetMap + Leaflet integration

export const KERALA_CENTER_COORDS: [number, number] = [10.15, 76.6];
export const KERALA_DEFAULT_ZOOM = 7.5;

export const MAP_TILE_LAYER_URL = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
export const MAP_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

export const DISTRICT_COORDINATES: Record<string, [number, number]> = {
  "Thiruvananthapuram": [8.5241, 76.9366],
  "Kollam": [8.8932, 76.6141],
  "Pathanamthitta": [9.2648, 76.7870],
  "Alappuzha": [9.4981, 76.3388],
  "Kottayam": [9.5916, 76.5221],
  "Idukki": [9.9189, 77.1025],
  "Ernakulam": [9.9816, 76.2998],
  "Thrissur": [10.5276, 76.2144],
  "Palakkad": [10.7867, 76.6548],
  "Malappuram": [11.0735, 76.0740],
  "Kozhikode": [11.2588, 75.7804],
  "Wayanad": [11.6854, 76.1320],
  "Kannur": [11.8745, 75.3704],
  "Kasaragod": [12.5103, 74.9852],
};

export const getCategoryMarkerColor = (category: string): string => {
  switch (category.toLowerCase()) {
    case "roads":
      return "#f59e0b"; // Amber
    case "water":
      return "#0ea5e9"; // Sky Blue
    case "waste":
      return "#10b981"; // Emerald Green
    case "flooding":
      return "#3b82f6"; // Blue
    case "corruption":
      return "#a855f7"; // Purple
    default:
      return "#64748b"; // Slate Gray
  }
};
