export const PRIMITIVE_DEFINITIONS = {
  box: {
    label: "箱",
    drawingMethod: "rectangle",
    settingsComponent: null,
    enabled: false,
  },

  cylinder: {
    label: "円柱",
    drawingMethod: "center-radius",
    settingsComponent: null,
    enabled: false,
  },

  extruded_polygon: {
    label: "多角柱",
    drawingMethod: "polygon",
    settingsComponent: null,
    enabled: true,
  },

  wall: {
    label: "壁",
    drawingMethod: "polyline",
    settingsComponent: null,
    enabled: false,
  },

  slab: {
    label: "板",
    drawingMethod: "polygon",
    settingsComponent: null,
    enabled: false,
  },

  stairs: {
    label: "階段",
    drawingMethod: "dedicated",
    settingsComponent: null,
    enabled: false,
  },
};
