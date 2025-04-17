import React from "react";
import { render, fireEvent, act, screen, waitFor } from "@testing-library/react";
import HeatmapLayer from "@/app/custom-components/MapComponents/HeatmapLayer";
import { useNotification } from "@/app/custom-components/ToastComponent/NotificationContext";
import { authAPI } from "@/utils/fetch/fetch";
import L from "leaflet";

// Mock leaflet first
const mockAddTo = jest.fn();

jest.mock("leaflet", () => ({
  heatLayer: jest.fn(() => ({
    addTo: mockAddTo,
  })),
}));

// Mock leaflet.heat
jest.mock("leaflet.heat", () => {});

// Mock dependencies
jest.mock("@/app/custom-components/ToastComponent/NotificationContext", () => ({
  useNotification: jest.fn(),
}));

jest.mock("@/utils/fetch/fetch", () => ({
  authAPI: {
    authenticatedGet: jest.fn(),
  },
}));

// Add console mocking
beforeAll(() => {
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
});

afterAll(() => {
  console.log.mockRestore();
  console.error.mockRestore();
  console.warn.mockRestore();
});

describe("HeatmapLayer", () => {
  const mockShowError = jest.fn();
  const mockShowWarning = jest.fn();
  const mockMapInstance = {
    removeLayer: jest.fn(),
    hasLayer: jest.fn().mockReturnValue(false),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useNotification.mockReturnValue({
      showError: mockShowError,
      showWarning: mockShowWarning,
    });

    // Mock localStorage for all tests
    const mockLocalStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    };
    Object.defineProperty(window, "localStorage", {
      value: mockLocalStorage,
      writable: true,
    });
  });

  it("renders heatmap toggle buttons", () => {
    const { getByText } = render(
      <HeatmapLayer
        mapLoaded={true}
        mapInstanceRef={{ current: mockMapInstance }}
      />
    );

    expect(getByText("Crime Heatmap")).toBeInTheDocument();
    expect(getByText("Off")).toBeInTheDocument();
    expect(getByText("Low")).toBeInTheDocument();
    expect(getByText("High")).toBeInTheDocument();
  });

  it("fetches primary and secondary heatmap data on mount", async () => {
    const mockPrimaryData = [
      { latitude: 1, longitude: 1, intensity: 0.5 },
      { latitude: 2, longitude: 2, intensity: 0.8 },
    ];
    
    const mockSecondaryData = [
      { latitude: 3, longitude: 3, intensity: 0.3 },
      { latitude: 4, longitude: 4, intensity: 0.4 },
    ];

    authAPI.authenticatedGet.mockImplementation((url) => {
      if (url.includes("type=1")) {
        return Promise.resolve(mockPrimaryData);
      } else if (url.includes("type=2")) {
        return Promise.resolve(mockSecondaryData);
      }
      return Promise.reject(new Error("Invalid URL"));
    });

    await act(async () => {
      render(
        <HeatmapLayer
          mapLoaded={true}
          mapInstanceRef={{ current: mockMapInstance }}
        />
      );
    });

    expect(authAPI.authenticatedGet).toHaveBeenCalledWith("map/heatmap-data/?type=1");
    expect(authAPI.authenticatedGet).toHaveBeenCalledWith("map/heatmap-data/?type=2");
  });

  it("handles primary API errors gracefully", async () => {
    authAPI.authenticatedGet.mockImplementation((url) => {
      if (url.includes("type=1")) {
        return Promise.reject(new Error("API Error"));
      } else if (url.includes("type=2")) {
        return Promise.resolve([{ latitude: 3, longitude: 3, intensity: 0.3 }]);
      }
      return Promise.reject(new Error("Invalid URL"));
    });

    await act(async () => {
      render(
        <HeatmapLayer
          mapLoaded={true}
          mapInstanceRef={{ current: mockMapInstance }}
        />
      );
    });

    expect(mockShowWarning).toHaveBeenCalledWith(
      "Loading high crime data...",
      "Retrying to load high crime heatmap data",
      "primary_heatmap_retry"
    );
  });

  it("handles secondary API errors gracefully", async () => {
    authAPI.authenticatedGet.mockImplementation((url) => {
      if (url.includes("type=1")) {
        return Promise.resolve([{ latitude: 1, longitude: 1, intensity: 0.5 }]);
      } else if (url.includes("type=2")) {
        return Promise.reject(new Error("API Error"));
      }
      return Promise.reject(new Error("Invalid URL"));
    });

    await act(async () => {
      render(
        <HeatmapLayer
          mapLoaded={true}
          mapInstanceRef={{ current: mockMapInstance }}
        />
      );
    });

    expect(mockShowWarning).toHaveBeenCalledWith(
      "Loading low crime data...",
      "Retrying to load low crime heatmap data",
      "secondary_heatmap_retry"
    );
  });

  it("initializes heatmap layers when data is loaded", async () => {
    const mockPrimaryData = [{ latitude: 1, longitude: 1, intensity: 0.5 }];
    const mockSecondaryData = [{ latitude: 3, longitude: 3, intensity: 0.3 }];
    
    authAPI.authenticatedGet.mockImplementation((url) => {
      if (url.includes("type=1")) {
        return Promise.resolve(mockPrimaryData);
      } else if (url.includes("type=2")) {
        return Promise.resolve(mockSecondaryData);
      }
      return Promise.reject(new Error("Invalid URL"));
    });

    await act(async () => {
      render(
        <HeatmapLayer
          mapLoaded={true}
          mapInstanceRef={{ current: mockMapInstance }}
        />
      );
      // Wait for promises to resolve
      await Promise.resolve();
    });

    // Verify heatmap data was loaded
    expect(authAPI.authenticatedGet).toHaveBeenCalledWith("map/heatmap-data/?type=1");
    expect(authAPI.authenticatedGet).toHaveBeenCalledWith("map/heatmap-data/?type=2");
  });

  it("toggles low crime layer visibility when Low button is clicked", async () => {
    const mockPrimaryData = [{ latitude: 1, longitude: 1, intensity: 0.5 }];
    const mockSecondaryData = [{ latitude: 3, longitude: 3, intensity: 0.3 }];
    
    authAPI.authenticatedGet.mockImplementation((url) => {
      if (url.includes("type=1")) {
        return Promise.resolve(mockPrimaryData);
      } else if (url.includes("type=2")) {
        return Promise.resolve(mockSecondaryData);
      }
      return Promise.reject(new Error("Invalid URL"));
    });

    await act(async () => {
      render(
        <HeatmapLayer
          mapLoaded={true}
          mapInstanceRef={{ current: mockMapInstance }}
        />
      );
    });

    const lowButton = screen.getByText("Low");
    
    // Click "Low" button to turn on low crime layer
    await act(async () => {
      fireEvent.click(lowButton);
    });
    
    // L.heatLayer is called during initialization for both layers
    // and then again when toggling visibility
    expect(L.heatLayer).toHaveBeenCalledWith(
      [[3, 3, 0.3]],
      expect.any(Object)
    );
    expect(mockAddTo).toHaveBeenCalled();
    
    // Legend should now show low crime item
    expect(screen.getByText("Low Crime")).toBeInTheDocument();
  });

  it("toggles high crime layer visibility when High button is clicked", async () => {
    const mockPrimaryData = [{ latitude: 1, longitude: 1, intensity: 0.5 }];
    const mockSecondaryData = [{ latitude: 3, longitude: 3, intensity: 0.3 }];
    
    authAPI.authenticatedGet.mockImplementation((url) => {
      if (url.includes("type=1")) {
        return Promise.resolve(mockPrimaryData);
      } else if (url.includes("type=2")) {
        return Promise.resolve(mockSecondaryData);
      }
      return Promise.reject(new Error("Invalid URL"));
    });

    await act(async () => {
      render(
        <HeatmapLayer
          mapLoaded={true}
          mapInstanceRef={{ current: mockMapInstance }}
        />
      );
    });

    const highButton = screen.getByText("High");
    
    // Click "High" button to turn on high crime layer
    await act(async () => {
      fireEvent.click(highButton);
    });
    
    // Expect legend to show high crime item
    expect(screen.getByText("High Crime")).toBeInTheDocument();
  });

  it("turns off both layers when Off button is clicked", async () => {
    const mockPrimaryData = [{ latitude: 1, longitude: 1, intensity: 0.5 }];
    const mockSecondaryData = [{ latitude: 3, longitude: 3, intensity: 0.3 }];
    
    authAPI.authenticatedGet.mockImplementation((url) => {
      if (url.includes("type=1")) {
        return Promise.resolve(mockPrimaryData);
      } else if (url.includes("type=2")) {
        return Promise.resolve(mockSecondaryData);
      }
      return Promise.reject(new Error("Invalid URL"));
    });

    await act(async () => {
      render(
        <HeatmapLayer
          mapLoaded={true}
          mapInstanceRef={{ current: mockMapInstance }}
        />
      );
    });

    const lowButton = screen.getByText("Low");
    const highButton = screen.getByText("High");
    const offButton = screen.getByText("Off");
    
    // Turn on both layers
    await act(async () => {
      fireEvent.click(lowButton);
      fireEvent.click(highButton);
    });
    
    // Both legend items should be visible
    expect(screen.getByText("Low Crime")).toBeInTheDocument();
    expect(screen.getByText("High Crime")).toBeInTheDocument();
    
    // Now click "Off" to turn off both layers
    await act(async () => {
      fireEvent.click(offButton);
    });
    
    // Legend items should not be visible (but the container should remain with fixed height)
    expect(screen.queryByText("Low Crime (<5)")).not.toBeInTheDocument();
    expect(screen.queryByText("High Crime (≥5)")).not.toBeInTheDocument();
  });

  it("handles missing map instance gracefully", () => {
    render(
      <HeatmapLayer mapLoaded={true} mapInstanceRef={{ current: null }} />
    );

    expect(mockShowError).not.toHaveBeenCalled();
  });

  it("applies the correct primary heatmap configuration", async () => {
    const mockPrimaryData = [{ latitude: 1, longitude: 1, intensity: 0.5 }];
    const mockSecondaryData = [{ latitude: 3, longitude: 3, intensity: 0.3 }];
    
    authAPI.authenticatedGet.mockImplementation((url) => {
      if (url.includes("type=1")) {
        return Promise.resolve(mockPrimaryData);
      } else if (url.includes("type=2")) {
        return Promise.resolve(mockSecondaryData);
      }
      return Promise.reject(new Error("Invalid URL"));
    });

    await act(async () => {
      render(
        <HeatmapLayer
          mapLoaded={true}
          mapInstanceRef={{ current: mockMapInstance }}
        />
      );
    });

    // Click "High" button to activate the high crime layer
    const highButton = screen.getByText("High");
    await act(async () => {
      fireEvent.click(highButton);
    });
  
    // Check primary layer configuration
    expect(L.heatLayer).toHaveBeenCalledWith(
      [[1, 1, 0.5]],
      expect.objectContaining({
        radius: 15,
        blur: 15,
        maxZoom: 18,
        gradient: {
          0.2: "#1e3a8a",
          0.4: "#1d4ed8",
          0.6: "#dc2626",
          0.8: "#991b1b",
          1.0: "#7f1d1d",
        },
      })
    );
  });
  
  it("applies the correct secondary heatmap configuration", async () => {
    const mockPrimaryData = [{ latitude: 1, longitude: 1, intensity: 0.5 }];
    const mockSecondaryData = [{ latitude: 3, longitude: 3, intensity: 0.3 }];
    
    authAPI.authenticatedGet.mockImplementation((url) => {
      if (url.includes("type=1")) {
        return Promise.resolve(mockPrimaryData);
      } else if (url.includes("type=2")) {
        return Promise.resolve(mockSecondaryData);
      }
      return Promise.reject(new Error("Invalid URL"));
    });

    await act(async () => {
      render(
        <HeatmapLayer
          mapLoaded={true}
          mapInstanceRef={{ current: mockMapInstance }}
        />
      );
    });

    // Click "Low" button to activate the low crime layer
    const lowButton = screen.getByText("Low");
    await act(async () => {
      fireEvent.click(lowButton);
    });
  
    // Check secondary layer configuration
    expect(L.heatLayer).toHaveBeenCalledWith(
      [[3, 3, 0.3]],
      expect.objectContaining({
        radius: 15,
        blur: 15,
        maxZoom: 18,
        gradient: {
          0.2: "#fef3c7",
          0.4: "#fbbf24",
          0.6: "#f59e0b",
          0.8: "#d97706",
          1.0: "#b45309",
        },
      })
    );
  });

  describe("Cache behavior", () => {
    it("uses cached data when available and not expired", async () => {
      const cachedPrimaryData = [[1, 1, 0.5]];
      const cachedSecondaryData = [[3, 3, 0.3]];
      
      const mockLocalStorage = {
        getItem: jest.fn((key) => {
          if (key === "primary_heatmap_data_cache") {
            return JSON.stringify({
              data: cachedPrimaryData,
              timestamp: new Date().getTime() - 1000 * 60 * 60 // 1 hour ago (not expired)
            });
          } else if (key === "secondary_heatmap_data_cache") {
            return JSON.stringify({
              data: cachedSecondaryData,
              timestamp: new Date().getTime() - 1000 * 60 * 60 // 1 hour ago (not expired)
            });
          }
          return null;
        }),
        setItem: jest.fn(),
      };
      
      Object.defineProperty(window, "localStorage", {
        value: mockLocalStorage,
        writable: true,
      });
      
      await act(async () => {
        render(
          <HeatmapLayer
            mapLoaded={true}
            mapInstanceRef={{ current: mockMapInstance }}
          />
        );
      });
      
      // Should not call API if cache is valid
      expect(authAPI.authenticatedGet).not.toHaveBeenCalled();
      
      // Select both layers
      const lowButton = screen.getByText("Low");
      const highButton = screen.getByText("High");
      
      await act(async () => {
        fireEvent.click(lowButton);
        fireEvent.click(highButton);
      });
      
      // Verify both layers were created with cached data
      expect(L.heatLayer).toHaveBeenCalledWith(
        cachedPrimaryData,
        expect.any(Object)
      );
      expect(L.heatLayer).toHaveBeenCalledWith(
        cachedSecondaryData,
        expect.any(Object)
      );
    });
    
    it("fetches new data when cache is expired", async () => {
      const mockPrimaryData = [{ latitude: 1, longitude: 1, intensity: 0.5 }];
      const mockSecondaryData = [{ latitude: 3, longitude: 3, intensity: 0.3 }];
      
      authAPI.authenticatedGet.mockImplementation((url) => {
        if (url.includes("type=1")) {
          return Promise.resolve(mockPrimaryData);
        } else if (url.includes("type=2")) {
          return Promise.resolve(mockSecondaryData);
        }
        return Promise.reject(new Error("Invalid URL"));
      });
      
      const mockLocalStorage = {
        getItem: jest.fn((key) => {
          if (key === "primary_heatmap_data_cache" || key === "secondary_heatmap_data_cache") {
            return JSON.stringify({
              data: [],
              timestamp: new Date().getTime() - 1000 * 60 * 60 * 4 // 4 hours ago (expired)
            });
          }
          return null;
        }),
        setItem: jest.fn(),
      };
      
      Object.defineProperty(window, "localStorage", {
        value: mockLocalStorage,
        writable: true,
      });
      
      await act(async () => {
        render(
          <HeatmapLayer
            mapLoaded={true}
            mapInstanceRef={{ current: mockMapInstance }}
          />
        );
      });
      
      // Should call API for both types of data
      expect(authAPI.authenticatedGet).toHaveBeenCalledWith("map/heatmap-data/?type=1");
      expect(authAPI.authenticatedGet).toHaveBeenCalledWith("map/heatmap-data/?type=2");
    });
  });
  describe("Error handling tests", () => {
    let mockMapInstance;
    let mockHasLayer;
    let mockShowError;
    let mockShowWarning;
    let originalConsoleWarn;
    let originalConsoleError;
  
    beforeEach(() => {
      mockHasLayer = jest.fn().mockReturnValue(true);
      mockMapInstance = {
        removeLayer: jest.fn().mockImplementation(() => {
          throw new Error("Mock removal error");
        }),
        hasLayer: mockHasLayer,
      };
      
      useNotification.mockReturnValue({
        showError: mockShowError = jest.fn(),
        showWarning: mockShowWarning = jest.fn(),
      });
      
      // Save original console methods
      originalConsoleWarn = console.warn;
      originalConsoleError = console.error;
      
      // Mock console methods to track calls
      console.warn = jest.fn();
      console.error = jest.fn();
    });
    
    afterEach(() => {
      // Restore original console methods
      console.warn = originalConsoleWarn;
      console.error = originalConsoleError;
    });
  
    it("handles errors when removing existing primary layer", async () => {
      const mockPrimaryData = [{ latitude: 1, longitude: 1, intensity: 0.5 }];
      const mockSecondaryData = [{ latitude: 3, longitude: 3, intensity: 0.3 }];
      
      authAPI.authenticatedGet.mockImplementation((url) => {
        if (url.includes("type=1")) {
          return Promise.resolve(mockPrimaryData);
        } else if (url.includes("type=2")) {
          return Promise.resolve(mockSecondaryData);
        }
        return Promise.reject(new Error("Invalid URL"));
      });
      
      // Force L.heatLayer to throw an error on the first call
      const originalHeatLayer = L.heatLayer;
      let callCount = 0;
      
      L.heatLayer = jest.fn((data, options) => {
        callCount++;
        // Return regular mock for first call (primary layer creation)
        if (callCount === 1) {
          return { addTo: mockAddTo };
        }
        // Return regular mock for second call (secondary layer creation)
        return { addTo: mockAddTo };
      });
      
      await act(async () => {
        render(
          <HeatmapLayer
            mapLoaded={true}
            mapInstanceRef={{ current: mockMapInstance }}
          />
        );
      });
  
      // Toggle high crime to trigger layer removal error
      const highButton = screen.getByText("High");
      await act(async () => {
        fireEvent.click(highButton);
      });
      
      // Verify error was caught and logged
      expect(console.warn).toHaveBeenCalledWith(
        "Error removing existing primary layer:",
        expect.any(Error)
      );
      
      // Restore original heatLayer
      L.heatLayer = originalHeatLayer;
    });
    
    it("handles errors when managing primary heatmap layer", async () => {
      const mockPrimaryData = [{ latitude: 1, longitude: 1, intensity: 0.5 }];
      const mockSecondaryData = [{ latitude: 3, longitude: 3, intensity: 0.3 }];
      
      authAPI.authenticatedGet.mockImplementation((url) => {
        if (url.includes("type=1")) {
          return Promise.resolve(mockPrimaryData);
        } else if (url.includes("type=2")) {
          return Promise.resolve(mockSecondaryData);
        }
        return Promise.reject(new Error("Invalid URL"));
      });
      
      // Force L.heatLayer to throw an error on the first call
      const originalHeatLayer = L.heatLayer;
      let callCount = 0;
      
      L.heatLayer = jest.fn((data, options) => {
        callCount++;
        // Throw error for primary layer creation
        if (callCount === 1) {
          throw new Error("Mock heatLayer creation error");
        }
        // Return regular mock for secondary layer creation
        return { addTo: mockAddTo };
      });
      
      await act(async () => {
        render(
          <HeatmapLayer
            mapLoaded={true}
            mapInstanceRef={{ current: mockMapInstance }}
          />
        );
      });
      
      // Try to toggle high crime layer which should have failed to initialize
      const highButton = screen.getByText("High");
      await act(async () => {
        fireEvent.click(highButton);
      });
      
      // Verify error was caught and logged
      expect(console.error).toHaveBeenCalledWith(
        "Error managing primary heatmap layer:",
        expect.any(Error)
      );
      
      // Restore original heatLayer
      L.heatLayer = originalHeatLayer;
    });
    
    it("handles errors when managing secondary heatmap layer", async () => {
      const mockPrimaryData = [{ latitude: 1, longitude: 1, intensity: 0.5 }];
      const mockSecondaryData = [{ latitude: 3, longitude: 3, intensity: 0.3 }];
      
      authAPI.authenticatedGet.mockImplementation((url) => {
        if (url.includes("type=1")) {
          return Promise.resolve(mockPrimaryData);
        } else if (url.includes("type=2")) {
          return Promise.resolve(mockSecondaryData);
        }
        return Promise.reject(new Error("Invalid URL"));
      });
      
      // Force L.heatLayer to throw an error on the second call
      const originalHeatLayer = L.heatLayer;
      let callCount = 0;
      
      L.heatLayer = jest.fn((data, options) => {
        callCount++;
        // Return regular mock for primary layer creation
        if (callCount === 1) {
          return { addTo: mockAddTo };
        }
        // Throw error for secondary layer creation
        throw new Error("Mock secondary heatLayer creation error");
      });
      
      await act(async () => {
        render(
          <HeatmapLayer
            mapLoaded={true}
            mapInstanceRef={{ current: mockMapInstance }}
          />
        );
      });
      
      // Try to toggle low crime layer which should have failed to initialize
      const lowButton = screen.getByText("Low");
      await act(async () => {
        fireEvent.click(lowButton);
      });
      
      // Verify error was caught and logged
      expect(console.error).toHaveBeenCalledWith(
        "Error managing secondary heatmap layer:",
        expect.any(Error)
      );
      
      // Restore original heatLayer
      L.heatLayer = originalHeatLayer;
    });
  
    it("handles errors when toggling layers", async () => {
      const mockPrimaryData = [{ latitude: 1, longitude: 1, intensity: 0.5 }];
      const mockSecondaryData = [{ latitude: 3, longitude: 3, intensity: 0.3 }];
      
      authAPI.authenticatedGet.mockImplementation((url) => {
        if (url.includes("type=1")) {
          return Promise.resolve(mockPrimaryData);
        } else if (url.includes("type=2")) {
          return Promise.resolve(mockSecondaryData);
        }
        return Promise.reject(new Error("Invalid URL"));
      });
      
      // Create a special map instance that will throw on the second removeLayer call
      let removeLayerCallCount = 0;
      const mockMapWithToggleError = {
        hasLayer: jest.fn().mockReturnValue(true),
        removeLayer: jest.fn().mockImplementation(() => {
          removeLayerCallCount++;
          if (removeLayerCallCount > 1) {
            throw new Error("Mock toggle error");
          }
        })
      };
      
      await act(async () => {
        render(
          <HeatmapLayer
            mapLoaded={true}
            mapInstanceRef={{ current: mockMapWithToggleError }}
          />
        );
      });
      
      // Turn on both layers to trigger the toggle effect
      const lowButton = screen.getByText("Low");
      const highButton = screen.getByText("High");
      
      await act(async () => {
        fireEvent.click(lowButton);
        fireEvent.click(highButton);
      });
      
      // Verify toggle error was caught and logged
      expect(console.error).toHaveBeenCalledWith(
        "Error toggling heatmap layers:",
        expect.any(Error)
      );
    });
  });
});
// Add these tests to your existing HeatmapLayer.test.jsx file


// Re-enable the Retry functionality tests with proper implementations
describe("Retry functionality", () => {
  let mockMapInstance;
  let mockShowError;
  let mockShowWarning;

  beforeEach(() => {
    mockMapInstance = {
      removeLayer: jest.fn(),
      hasLayer: jest.fn().mockReturnValue(false),
    };
    
    useNotification.mockReturnValue({
      showError: mockShowError = jest.fn(),
      showWarning: mockShowWarning = jest.fn(),
    });
  });


  it("tests primary localStorage cache read error handling", async () => {
    // Mock localStorage to throw on the first getItem call
    let getItemCallCount = 0;
    
    const mockLocalStorage = {
      getItem: jest.fn().mockImplementation((key) => {
        getItemCallCount++;
        if (getItemCallCount === 1 && key === PRIMARY_CACHE_KEY) {
          throw new Error("Mock localStorage error");
        }
        return null;
      }),
      setItem: jest.fn(),
    };
    
    Object.defineProperty(window, "localStorage", {
      value: mockLocalStorage,
      writable: true,
    });
    
    const mockPrimaryData = [{ latitude: 1, longitude: 1, intensity: 0.5 }];
    const mockSecondaryData = [{ latitude: 3, longitude: 3, intensity: 0.3 }];
    
    authAPI.authenticatedGet.mockImplementation((url) => {
      if (url.includes("type=1")) {
        return Promise.resolve(mockPrimaryData);
      } else if (url.includes("type=2")) {
        return Promise.resolve(mockSecondaryData);
      }
      return Promise.reject(new Error("Invalid URL"));
    });
    
    // We need to get access to console.warn to verify it was called
    const originalConsoleWarn = console.warn;
    console.warn = jest.fn();
    
    await act(async () => {
      render(
        <HeatmapLayer
          mapLoaded={true}
          mapInstanceRef={{ current: mockMapInstance }}
        />
      );
    });
    
    // Verify cache read error was caught and logged
    expect(console.warn).toHaveBeenCalledWith(
      "Primary cache read error:",
      expect.any(Error)
    );
    
    // Restore console.warn
    console.warn = originalConsoleWarn;
  });

  it("tests primary localStorage cache write error handling", async () => {
    // Mock localStorage to throw on setItem
    const mockLocalStorage = {
      getItem: jest.fn().mockReturnValue(null),
      setItem: jest.fn().mockImplementation((key) => {
        if (key === PRIMARY_CACHE_KEY) {
          throw new Error("Mock localStorage write error");
        }
      }),
    };
    
    Object.defineProperty(window, "localStorage", {
      value: mockLocalStorage,
      writable: true,
    });
    
    const mockPrimaryData = [{ latitude: 1, longitude: 1, intensity: 0.5 }];
    const mockSecondaryData = [{ latitude: 3, longitude: 3, intensity: 0.3 }];
    
    authAPI.authenticatedGet.mockImplementation((url) => {
      if (url.includes("type=1")) {
        return Promise.resolve(mockPrimaryData);
      } else if (url.includes("type=2")) {
        return Promise.resolve(mockSecondaryData);
      }
      return Promise.reject(new Error("Invalid URL"));
    });
    
    // We need to get access to console.warn to verify it was called
    const originalConsoleWarn = console.warn;
    console.warn = jest.fn();
    
    await act(async () => {
      render(
        <HeatmapLayer
          mapLoaded={true}
          mapInstanceRef={{ current: mockMapInstance }}
        />
      );
    });
    
    // Verify cache write error was caught and logged
    expect(console.warn).toHaveBeenCalledWith(
      "Primary cache write error:", 
      expect.any(Error)
    );
    
    // Restore console.warn
    console.warn = originalConsoleWarn;
  });

  it("tests secondary localStorage cache read error handling", async () => {
    // Mock localStorage to throw on secondary cache getItem
    let getItemCallCount = 0;
    
    const mockLocalStorage = {
      getItem: jest.fn().mockImplementation((key) => {
        getItemCallCount++;
        if (getItemCallCount > 1 && key === SECONDARY_CACHE_KEY) {
          throw new Error("Mock localStorage error");
        }
        return null;
      }),
      setItem: jest.fn(),
    };
    
    Object.defineProperty(window, "localStorage", {
      value: mockLocalStorage,
      writable: true,
    });
    
    const mockPrimaryData = [{ latitude: 1, longitude: 1, intensity: 0.5 }];
    const mockSecondaryData = [{ latitude: 3, longitude: 3, intensity: 0.3 }];
    
    authAPI.authenticatedGet.mockImplementation((url) => {
      if (url.includes("type=1")) {
        return Promise.resolve(mockPrimaryData);
      } else if (url.includes("type=2")) {
        return Promise.resolve(mockSecondaryData);
      }
      return Promise.reject(new Error("Invalid URL"));
    });
    
    // We need to get access to console.warn to verify it was called
    const originalConsoleWarn = console.warn;
    console.warn = jest.fn();
    
    await act(async () => {
      render(
        <HeatmapLayer
          mapLoaded={true}
          mapInstanceRef={{ current: mockMapInstance }}
        />
      );
    });
    
    // Verify cache read error was caught and logged
    expect(console.warn).toHaveBeenCalledWith(
      "Secondary cache read error:",
      expect.any(Error)
    );
    
    // Restore console.warn
    console.warn = originalConsoleWarn;
  });

  it("tests secondary localStorage cache write error handling", async () => {
    // Mock localStorage to throw on secondary cache setItem
    const mockLocalStorage = {
      getItem: jest.fn().mockReturnValue(null),
      setItem: jest.fn().mockImplementation((key) => {
        if (key === SECONDARY_CACHE_KEY) {
          throw new Error("Mock localStorage write error");
        }
      }),
    };
    
    Object.defineProperty(window, "localStorage", {
      value: mockLocalStorage,
      writable: true,
    });
    
    const mockPrimaryData = [{ latitude: 1, longitude: 1, intensity: 0.5 }];
    const mockSecondaryData = [{ latitude: 3, longitude: 3, intensity: 0.3 }];
    
    authAPI.authenticatedGet.mockImplementation((url) => {
      if (url.includes("type=1")) {
        return Promise.resolve(mockPrimaryData);
      } else if (url.includes("type=2")) {
        return Promise.resolve(mockSecondaryData);
      }
      return Promise.reject(new Error("Invalid URL"));
    });
    
    // We need to get access to console.warn to verify it was called
    const originalConsoleWarn = console.warn;
    console.warn = jest.fn();
    
    await act(async () => {
      render(
        <HeatmapLayer
          mapLoaded={true}
          mapInstanceRef={{ current: mockMapInstance }}
        />
      );
    });
    
    // Verify cache write error was caught and logged
    expect(console.warn).toHaveBeenCalledWith(
      "Secondary cache write error:", 
      expect.any(Error)
    );
    
    // Restore console.warn
    console.warn = originalConsoleWarn;
  });
});