export const extractCoordinates = (routeData, provider) => {
    if (!routeData) return [];
  
    try {
      console.log(`Extracting coordinates from ${provider} data:`, routeData);
  
      if (provider === 'ors') {
        // ORS Format
        // If the route has standard GeoJSON features
        if (routeData.features && routeData.features.length > 0) {
          const feature = routeData.features[0];
          if (feature.geometry && feature.geometry.coordinates) {
            return feature.geometry.coordinates.map(coord => [coord[1], coord[0]]);
          }
        }
  
        // ORS route format
        if (routeData.routes && routeData.routes.length > 0) {
          const route = routeData.routes[0];
  
          // Handle geometry object with coordinates array
          if (route.geometry && Array.isArray(route.geometry.coordinates)) {
            return route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
          }
  
          // Handle geometry as encoded polyline string
          if (route.geometry && typeof route.geometry === 'string') {
            return decodePolyline(route.geometry).map(coord => [coord[0], coord[1]]);
          }
        }
      } else if (provider === 'mapbox') {
        // Mapbox Format
        if (routeData.routes && routeData.routes.length > 0) {
          const route = routeData.routes[0];
          
          // Handle Mapbox's legs and steps structure
          if (route.legs && route.legs.length > 0) {
            // Extract coordinates from the entire route geometry
            if (route.geometry && route.geometry.coordinates) {
              return route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
            }
            
            // If no overall geometry, try to reconstruct from steps
            let allCoords = [];
            route.legs.forEach(leg => {
              if (leg.steps) {
                leg.steps.forEach(step => {
                  if (step.geometry && step.geometry.coordinates) {
                    const stepCoords = step.geometry.coordinates.map(coord => [coord[1], coord[0]]);
                    allCoords = [...allCoords, ...stepCoords];
                  }
                });
              }
            });
            
            return allCoords;
          }
        }
      }
  
      // Last resort: if we have the bounding box, we can at least show a straight line
      if (routeData.bbox) {
        // bbox format is usually [minLon, minLat, maxLon, maxLat]
        const bbox = routeData.bbox;
        return [
          [bbox[1], bbox[0]], // Southwest
          [bbox[3], bbox[2]]  // Northeast
        ];
      }
    } catch (error) {
      console.error(`Error extracting ${provider} coordinates:`, error);
      return [];
    }
  
    return [];
  };
  
  // Generic polyline decoder (works for both ORS and Mapbox encoded polylines)
  function decodePolyline(str, precision = 5) {
    var index = 0,
        lat = 0,
        lng = 0,
        coordinates = [],
        shift = 0,
        result = 0,
        byte = null,
        latitude_change,
        longitude_change,
        factor = Math.pow(10, precision);
  
    while (index < str.length) {
      // Reset shift, result, and byte
      byte = null;
      shift = 0;
      result = 0;
  
      do {
        byte = str.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
  
      latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));
  
      shift = result = 0;
  
      do {
        byte = str.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
  
      longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));
  
      lat += latitude_change;
      lng += longitude_change;
  
      coordinates.push([lat / factor, lng / factor]);
    }
  
    return coordinates;
  }
  
  // Extract route summary information handling both ORS and Mapbox formats
  export const extractRouteSummary = (routeData) => {
    if (!routeData || (!routeData.initial_route && !routeData.safer_route)) return null;
  
    try {
      // Extract info from ORS route (initial_route)
      let initialSummary = {
        distance: 0,
        duration: 0,
        instructions: []
      };
  
      if (routeData.initial_route?.routes && routeData.initial_route.routes.length > 0) {
        const route = routeData.initial_route.routes[0];
        initialSummary.distance = route.summary?.distance || 0;
        initialSummary.duration = route.summary?.duration || 0;
  
        // Extract turn-by-turn instructions for ORS
        if (route.segments && route.segments.length > 0) {
          route.segments.forEach(segment => {
            if (segment.steps) {
              segment.steps.forEach(step => {
                initialSummary.instructions.push({
                  instruction: step.instruction,
                  distance: step.distance,
                  duration: step.duration,
                  name: step.name || "-",
                  type: step.type
                });
              });
            }
          });
        }
      }
  
      // Extract info from Mapbox route (safer_route)
      let saferSummary = null;
      if (routeData.safer_route?.routes && routeData.safer_route.routes.length > 0) {
        saferSummary = {
          distance: 0,
          duration: 0,
          instructions: []
        };
  
        const route = routeData.safer_route.routes[0];
        
        // Mapbox provides distance in meters and duration in seconds
        saferSummary.distance = route.distance || 0;
        saferSummary.duration = route.duration || 0;
  
        // Extract turn-by-turn instructions from Mapbox format
        if (route.legs && route.legs.length > 0) {
          route.legs.forEach(leg => {
            if (leg.steps) {
              leg.steps.forEach(step => {
                // Convert Mapbox maneuver to format compatible with your UI
                saferSummary.instructions.push({
                  instruction: step.maneuver?.instruction || step.name || "Continue",
                  distance: step.distance || 0,
                  duration: step.duration || 0,
                  name: step.name || "-",
                  // Map Mapbox maneuver types to numbers similar to ORS for consistency
                  type: getManeuverType(step.maneuver?.type, step.maneuver?.modifier)
                });
              });
            }
          });
        }
      }
  
      return {
        initial: initialSummary,
        safer: saferSummary
      };
    } catch (error) {
      console.error("Error extracting route summary:", error);
      return null;
    }
  };
  
  // Map Mapbox maneuver types to numeric types similar to ORS for UI consistency
  function getManeuverType(maneuverType, modifier) {
    // This is a simplified mapping - you may want to refine this based on your UI needs
    if (maneuverType === 'depart' || maneuverType === 'head') return 11; // Departure
    if (maneuverType === 'arrive') return 10;  // Arrival
    
    // Turn types
    if (maneuverType === 'turn') {
      if (modifier === 'right') return 1;  // Turn right
      if (modifier === 'left') return 0;   // Turn left
      if (modifier === 'slight right') return 7; // Slight right
      if (modifier === 'slight left') return 6;  // Slight left
      if (modifier === 'sharp right') return 3;  // Sharp right
      if (modifier === 'sharp left') return 2;   // Sharp left
      return 5; // Unknown turn
    }
    
    if (maneuverType === 'continue' || maneuverType === 'straight') return 5;
    if (maneuverType === 'merge') return 8;
    if (maneuverType === 'fork') {
      if (modifier === 'right') return 7;
      if (modifier === 'left') return 6;
      return 5;
    }
    
    if (maneuverType === 'roundabout') return 4;
    
    // Default for any other type
    return 5;
  }
  
  // Function to enhance turn instructions with street names for both providers
  export const enhanceTurnInstructions = (steps) => {
    return steps.map((step, index, stepsArray) => {
      const enhancedStep = {...step};
      
      // If no street name is provided
      if (step.name === "-") {
        // If it's a turn instruction
        if ([0, 1, 2, 3, 6, 7].includes(step.type)) {
          // Look ahead to see if next step has a name
          const nextStep = index < stepsArray.length - 1 ? stepsArray[index + 1] : null;
          if (nextStep && nextStep.name !== "-") {
            enhancedStep.instruction = `${step.instruction} onto ${nextStep.name}`;
          } else {
            // Add distance context when no street name is available
            enhancedStep.instruction = `${step.instruction} and continue for ${Math.round(step.distance)}m`;
          }
        }
      }
      
      return enhancedStep;
    });
  };