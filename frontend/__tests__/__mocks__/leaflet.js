// Mock for Leaflet library
const L = {
    map: jest.fn().mockImplementation(() => ({
      setView: jest.fn().mockReturnThis(),
      fitBounds: jest.fn().mockReturnThis(),
      remove: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      eachLayer: jest.fn((callback) => {
        callback({ 
          options: { type: 'mock-layer' }, 
          remove: jest.fn() 
        });
      }),
      invalidateSize: jest.fn(),
      _userMarker: {
        setLatLng: jest.fn(),
      },
    })),
    
    tileLayer: jest.fn().mockImplementation(() => ({
      addTo: jest.fn().mockReturnThis(),
    })),
    
    marker: jest.fn().mockImplementation(() => ({
      addTo: jest.fn().mockReturnThis(),
      setLatLng: jest.fn(),
      bindPopup: jest.fn().mockReturnThis(),
      openPopup: jest.fn(),
      closePopup: jest.fn(),
    })),
    
    divIcon: jest.fn().mockReturnValue({}),
    
    DomUtil: {
      create: jest.fn().mockReturnValue({
        className: '',
        style: {},
        innerHTML: '',
        appendChild: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        classList: {
          add: jest.fn(),
          remove: jest.fn(),
          contains: jest.fn(() => false),
        },
      }),
      addClass: jest.fn(),
      removeClass: jest.fn(),
    },
    
    latLng: jest.fn().mockImplementation((lat, lng) => ({
      lat: lat,
      lng: lng,
    })),
    
    geoJSON: jest.fn().mockReturnValue({
      addTo: jest.fn().mockReturnThis(),
      setStyle: jest.fn().mockReturnThis(),
      addData: jest.fn().mockReturnThis(),
      getBounds: jest.fn().mockReturnValue({
        extend: jest.fn(),
      }),
      clearLayers: jest.fn(),
    }),
    
    layerGroup: jest.fn().mockReturnValue({
      addTo: jest.fn().mockReturnThis(),
      addLayer: jest.fn(),
      removeLayer: jest.fn(),
      clearLayers: jest.fn(),
    }),
    
    control: {
      layers: jest.fn().mockReturnValue({
        addTo: jest.fn(),
        addBaseLayer: jest.fn(),
        addOverlay: jest.fn(),
      }),
      scale: jest.fn().mockReturnValue({
        addTo: jest.fn(),
      }),
    },
  
    // For any other Leaflet methods you might use
    Util: {
      extend: jest.fn().mockImplementation((target, ...sources) => {
        return Object.assign(target, ...sources);
      }),
    },
  };
  
  module.exports = L;