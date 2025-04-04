import {
  extractCoordinates,
  extractRouteSummary,
  enhanceTurnInstructions,
} from "@/app/custom-components/RoutingComponets/RouteHandler";

// Add SSR testing utilities at the top
const mockWindow = () => {
  const windowBackup = global.window;
  delete global.window;
  return windowBackup;
};

const restoreWindow = (windowBackup) => {
  global.window = windowBackup;
};

describe("RouteHandler", () => {
  // Add SSR test suite
  describe("Server-Side Rendering", () => {
    let windowBackup;

    beforeEach(() => {
      windowBackup = mockWindow();
    });

    afterEach(() => {
      restoreWindow(windowBackup);
    });

    it("should handle undefined window object", () => {
      const routeData = {
        routes: [
          {
            geometry: {
              coordinates: [
                [-73.9876, 40.7661],
                [-73.9877, 40.7662],
              ],
            },
          },
        ],
      };

      // These should not throw errors when window is undefined
      expect(() => extractCoordinates(routeData)).not.toThrow();
      expect(() => extractRouteSummary(routeData)).not.toThrow();
      expect(() => enhanceTurnInstructions([])).not.toThrow();
    });
  });

  describe("extractCoordinates", () => {
    it("should handle null or undefined input", () => {
      expect(extractCoordinates(null)).toEqual([]);
      expect(extractCoordinates(undefined)).toEqual([]);
    });

    it("should extract coordinates from GeoJSON format", () => {
      const geoJsonData = {
        features: [
          {
            geometry: {
              coordinates: [
                [-73.9876, 40.7661],
                [-73.9877, 40.7662],
              ],
            },
          },
        ],
      };
      const expected = [
        [40.7661, -73.9876],
        [40.7662, -73.9877],
      ];
      expect(extractCoordinates(geoJsonData)).toEqual(expected);
    });

    it("should extract coordinates from ORS format with coordinate array", () => {
      const orsData = {
        routes: [
          {
            geometry: {
              coordinates: [
                [-73.9876, 40.7661],
                [-73.9877, 40.7662],
              ],
            },
          },
        ],
      };
      const expected = [
        [40.7661, -73.9876],
        [40.7662, -73.9877],
      ];
      expect(extractCoordinates(orsData)).toEqual(expected);
    });

    it("should handle ORS format with encoded polyline", () => {
      const orsData = {
        routes: [
          {
            geometry: "_p~iF~ps|U_ulLnnqC_mqNvxq`@", // Example encoded polyline
          },
        ],
      };
      // The result will be decoded coordinates
      const result = extractCoordinates(orsData);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].length).toBe(2); // Each coordinate should be [lat, lng]
    });

    it("should extract coordinates from bounding box as fallback", () => {
      const bboxData = {
        bbox: [-73.9876, 40.7661, -73.9877, 40.7662],
      };
      const expected = [
        [40.7661, -73.9876],
        [40.7662, -73.9877],
      ];
      expect(extractCoordinates(bboxData)).toEqual(expected);
    });

    it("should return empty array for invalid input", () => {
      expect(extractCoordinates({})).toEqual([]);
      expect(extractCoordinates({ features: [] })).toEqual([]);
      expect(extractCoordinates({ routes: [] })).toEqual([]);
    });
  });

  describe("extractRouteSummary", () => {
    it("should handle null or undefined input", () => {
      expect(extractRouteSummary(null)).toBeNull();
      expect(extractRouteSummary(undefined)).toBeNull();
    });

    it("should extract summary from ORS route data", () => {
      const routeData = {
        initial_route: {
          routes: [
            {
              summary: {
                distance: 1000,
                duration: 600,
              },
              segments: [
                {
                  steps: [
                    {
                      instruction: "Turn right",
                      distance: 100,
                      duration: 60,
                      name: "Main St",
                      type: 1,
                    },
                  ],
                },
              ],
            },
          ],
        },
      };

      const result = extractRouteSummary(routeData);
      expect(result).toHaveProperty("initial");
      expect(result.initial).toHaveProperty("distance", 1000);
      expect(result.initial).toHaveProperty("duration", 600);
      expect(result.initial.instructions).toHaveLength(1);
      expect(result.initial.instructions[0]).toMatchObject({
        instruction: "Turn right",
        distance: 100,
        duration: 60,
        name: "Main St",
        type: 1,
      });
    });

    it("should handle missing route segments", () => {
      const routeData = {
        initial_route: {
          routes: [
            {
              summary: {
                distance: 1000,
                duration: 600,
              },
            },
          ],
        },
      };

      const result = extractRouteSummary(routeData);
      expect(result).toHaveProperty("initial");
      expect(result.initial).toHaveProperty("distance", 1000);
      expect(result.initial).toHaveProperty("duration", 600);
      expect(result.initial.instructions).toHaveLength(0);
    });
  });

  describe("enhanceTurnInstructions", () => {
    it("should enhance turn instructions with street names", () => {
      const steps = [
        {
          instruction: "Turn right",
          name: "-",
          type: 1,
          distance: 100,
        },
        {
          instruction: "Continue straight",
          name: "Main Street",
          type: 0,
          distance: 200,
        },
      ];

      const enhanced = enhanceTurnInstructions(steps);
      expect(enhanced[0].instruction).toBe("Turn right onto Main Street");
    });

    it("should add distance context when no street name is available", () => {
      const steps = [
        {
          instruction: "Turn right",
          name: "-",
          type: 1,
          distance: 100,
        },
        {
          instruction: "Continue straight",
          name: "-",
          type: 0,
          distance: 200,
        },
      ];

      const enhanced = enhanceTurnInstructions(steps);
      expect(enhanced[0].instruction).toBe("Turn right and continue for 100m");
    });

    it("should not modify instructions with street names", () => {
      const steps = [
        {
          instruction: "Turn right onto Broadway",
          name: "Broadway",
          type: 1,
          distance: 100,
        },
      ];

      const enhanced = enhanceTurnInstructions(steps);
      expect(enhanced[0].instruction).toBe("Turn right onto Broadway");
    });

    it("should handle empty steps array", () => {
      expect(enhanceTurnInstructions([])).toEqual([]);
    });
  });
});
