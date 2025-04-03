export const extractCoordinates = (routeData) => {
  if (!routeData) return [];

  try {
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
    console.error('Error extracting ORS coordinates:', error);
    return [];
  }

  return [];
};

// Polyline decoder (kept for ORS encoded polylines)
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

// Extract route summary information for ORS format only
export const extractRouteSummary = (routeData) => {
  if (!routeData || !routeData.initial_route) return null;

  try {
    // Extract info from ORS route
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

    return {
      initial: initialSummary,
      // We still return a safer property, but set to null since we're not using Mapbox
      safer: null
    };
  } catch (error) {
    console.error("Error extracting route summary:", error);
    return null;
  }
};

// Function to enhance turn instructions with street names
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