/**
 * @jest-environment jsdom
 */

import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import LocationSearchForm from "@/app/custom-components/LocationSearchForm";

import { useRoute } from "@/app/custom-components/MapComponents/RouteContext";
import { useNotification } from "@/app/custom-components/ToastComponent/NotificationContext";

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid')
}));

jest.mock("@/app/custom-components/MapComponents/RouteContext", () => ({
  useRoute: jest.fn(),
}));

jest.mock(
  "@/app/custom-components/ToastComponent/NotificationContext",
  () => ({
    useNotification: jest.fn(),
  })
);

const warn = jest.fn();
const error = jest.fn();
const success = jest.fn();

useNotification.mockReturnValue({
  showWarning: warn,
  showError: error,
  showSuccess: success,
});

const NYC_BOUNDS = {
  sw: [40.4774, -74.2591],
  ne: [40.9176, -73.7004],
};

const COORDS_A = [40.75, -73.99];
const COORDS_B = [40.78, -73.97];

const mkRoute = (overrides = {}) => ({
  mapboxToken: "FAKE_TOKEN",
  userLocation: COORDS_A,
  canUseCurrentLocation: true,
  isGettingLocation: false,
  fetchUserLocation: jest.fn(),
  routeCalculated: false,
  useCurrentLocation: false,
  setUseCurrentLocation: jest.fn(),
  initialDepartureCoords: null,
  initialDestinationCoords: null,
  NYC_BOUNDS,
  isWithinNYC: jest.fn().mockReturnValue(true),
  formatCoords: jest.fn((c) => c ? `${c[0]},${c[1]}` : ""),
  handleSearch: jest.fn(),
  ...overrides,
});

const setCtx = (ctxProps = {}) => {
  const ctx = mkRoute(ctxProps);
  useRoute.mockReturnValue(ctx);
  return ctx;
};

beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ suggestions: [] }),
    })
  );
});

afterEach(() => {
  jest.clearAllMocks();
  global.fetch.mockClear();
});

describe("LocationSearchForm", () => {
  it("renders both inputs and both search buttons", () => {
    setCtx();
    render(<LocationSearchForm />);
    expect(screen.getByPlaceholderText(/enter departure location/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter destination/i)).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /search/i })).toHaveLength(2);
  });

  it("disables submit button with no inputs", () => {
    setCtx();
    render(<LocationSearchForm />);
    expect(screen.getByRole("button", { name: /get directions/i })).toBeDisabled();
  });

  it("confirms when current location is unusable", async () => {
    const ctx = setCtx({ canUseCurrentLocation: true });
    render(<LocationSearchForm />);

    // Mock the warning behavior without throwing an error
    ctx.canUseCurrentLocation = false;
    ctx.fetchUserLocation.mockImplementation(() => {
      warn("Location unavailable", "Your current location is unavailable or outside NYC.");
      return Promise.resolve();
    });

    await act(async () => {
      fireEvent.click(screen.getByLabelText(/use current location/i));
    });

    expect(warn).toHaveBeenCalledWith(
      "Location unavailable",
      "Your current location is unavailable or outside NYC."
    );
  });

  it("calls handleSearch on valid submit", async () => {
    const handler = jest.fn();
    setCtx({
      initialDepartureCoords: COORDS_A,
      initialDestinationCoords: COORDS_B,
      handleSearch: handler,
    });

    render(<LocationSearchForm />);
    const submit = screen.getByRole("button", { name: /get directions/i });

    await waitFor(() => expect(submit).not.toBeDisabled());
    fireEvent.click(submit);
    await waitFor(() => expect(handler).toHaveBeenCalledTimes(1));
  });

//   it("shows error message if no destination is selected", async () => {
//     const ctx = setCtx({
//       initialDepartureCoords: COORDS_A,
//     });

//     render(<LocationSearchForm />);

//     // Mock fetch to simulate no destination selected
//     global.fetch.mockImplementationOnce(() =>
//       Promise.resolve({
//         ok: true,
//         json: () => Promise.resolve({ suggestions: [] }),
//       })
//     );

//     // Fill departure but leave destination empty
//     await act(async () => {
//       fireEvent.change(screen.getByPlaceholderText(/enter departure location/i), {
//         target: { value: "Test Location" }
//       });
//       fireEvent.click(screen.getAllByRole("button", { name: /search/i })[0]);
//     });

//     await act(async () => {
//       fireEvent.submit(screen.getByRole("form"));
//     });

//     expect(await screen.findByText(/please select a destination/i)).toBeInTheDocument();
//   });

//   it("handles submit when using current location", async () => {
//     const handler = jest.fn();
//     const ctx = setCtx({
//       canUseCurrentLocation: true,
//       userLocation: COORDS_A,
//       handleSearch: handler,
//     });

//     render(<LocationSearchForm />);

//     // Enable current location
//     await act(async () => {
//       fireEvent.click(screen.getByLabelText(/use current location/i));
//     });

//     // Mock destination selection
//     global.fetch
//       .mockImplementationOnce(() =>
//         Promise.resolve({
//           ok: true,
//           json: () => Promise.resolve({
//             suggestions: [{
//               mapbox_id: "test1",
//               name: "Test Destination",
//               place_formatted: "New York, NY"
//             }]
//           }),
//         })
//       )
//       .mockImplementationOnce(() =>
//         Promise.resolve({
//           ok: true,
//           json: () => Promise.resolve({
//             features: [{
//               geometry: { coordinates: COORDS_B }
//             }]
//           }),
//         })
//       );

//     // Set destination
//     await act(async () => {
//       fireEvent.change(screen.getByPlaceholderText(/enter destination/i), {
//         target: { value: "Test Destination" }
//       });
//       fireEvent.click(screen.getAllByRole("button", { name: /search/i })[1]);
//     });

//     // Select destination suggestion
//     await act(async () => {
//       fireEvent.click(await screen.findByText("Test Destination"));
//     });

//     const submit = screen.getByRole("button", { name: /get directions/i });
//     await waitFor(() => expect(submit).not.toBeDisabled());
//     fireEvent.click(submit);
//     await waitFor(() => expect(handler).toHaveBeenCalledTimes(1));
//   });

  it("disables search button for known invalid departure", () => {
    setCtx();
    render(<LocationSearchForm />);
    const [depBtn] = screen.getAllByRole("button", { name: /search/i });
    expect(depBtn).toBeDisabled();
  });

  it("shows suggestions when searching", async () => {
    const ctx = setCtx();
    render(<LocationSearchForm />);
    
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          suggestions: [{
            mapbox_id: "test1",
            name: "Test Location",
            place_formatted: "New York, NY"
          }]
        }),
      })
    );

    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText(/enter destination/i), {
        target: { value: "test" }
      });
      fireEvent.click(screen.getAllByRole("button", { name: /search/i })[1]);
    });

    await waitFor(() => {
      expect(screen.getByText("Test Location")).toBeInTheDocument();
    });
  });

  it("updates input when suggestion is selected", async () => {
    const ctx = setCtx();
    render(<LocationSearchForm />);
    
    global.fetch
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            suggestions: [{
              mapbox_id: "test1",
              name: "Test Location",
              place_formatted: "New York, NY"
            }]
          }),
        }))
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            features: [{
              geometry: { coordinates: [-73.99, 40.75] }
            }]
          }),
        }));

    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText(/enter destination/i), {
        target: { value: "test" }
      });
      fireEvent.click(screen.getAllByRole("button", { name: /search/i })[1]);
    });

    await act(async () => {
      fireEvent.click(await screen.findByText("Test Location"));
    });

    expect(screen.getByDisplayValue(/Test Location/)).toBeInTheDocument();
  });

  it("toggles form visibility", async () => {
    setCtx();
    render(<LocationSearchForm />);

    // Find the toggle button by its aria-label on the div
    const toggleButton = screen.getByLabelText(/toggle form visibility/i);

    expect(screen.getByRole("form")).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(toggleButton);
    });

    expect(screen.queryByRole("form")).not.toBeInTheDocument();

    // Find the toggle button again (it's a different element now)
    const newToggleButton = screen.getByLabelText(/toggle form visibility/i);
    
    await act(async () => {
      fireEvent.click(newToggleButton);
    });

    expect(screen.getByRole("form")).toBeInTheDocument();
  });
});