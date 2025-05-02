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
import { useNotification } from "@/app/custom-components/ToastComponent/NotificationContext";

// Mock other dependencies
jest.mock("uuid", () => ({
  v4: jest.fn(() => "mock-uuid"),
}));

jest.mock("@/app/custom-components/ToastComponent/NotificationContext", () => ({
  useNotification: jest.fn(),
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }) => <button {...props}>{children}</button>,
}));

jest.mock("@/components/ui/input", () => ({
  Input: ({ ...props }) => <input {...props} />,
}));

jest.mock("lucide-react", () => ({
  ChevronsUp: () => <svg data-testid="chevrons-up" />,
  ChevronsDown: () => <svg data-testid="chevrons-down" />,
}));

// Mock only the useRoute hook
jest.mock("@/app/custom-components/MapComponents/RouteContext", () => ({
  useRoute: jest.fn(),
}));

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

const defaultRouteContext = {
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
  formatCoords: jest.fn((c) => (c ? `${c[0]},${c[1]}` : "")),
  handleSearch: jest.fn(),
  showLocationSearchForm: true,
  setShowLocationSearchForm: jest.fn(),
  isCalculatingRoute: false,
};

const renderWithContext = (ui, contextValue = {}) => {
  const {
    useRoute,
  } = require("@/app/custom-components/MapComponents/RouteContext");
  useRoute.mockReturnValue({ ...defaultRouteContext, ...contextValue });
  return render(ui);
};

describe("LocationSearchForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders both inputs and both search buttons", async () => {
    renderWithContext(<LocationSearchForm />);

    expect(
      screen.getByPlaceholderText(/enter departure location/i)
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/enter destination/i)
    ).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /search/i })).toHaveLength(2);
    expect(
      screen.getByRole("button", { name: /get directions/i })
    ).toBeInTheDocument();
  });

  it("disables submit button with no inputs", () => {
    renderWithContext(<LocationSearchForm />);
    expect(
      screen.getByRole("button", { name: /get directions/i })
    ).toBeDisabled();
  });

  it("calls handleSearch on valid submit", async () => {
    const handleSearch = jest.fn();
    renderWithContext(<LocationSearchForm />, {
      handleSearch,
      initialDepartureCoords: COORDS_A,
      initialDestinationCoords: COORDS_B,
    });

    const submitButton = screen.getByRole("button", {
      name: /get directions/i,
    });
    await act(async () => {
      fireEvent.click(submitButton);
    });

    expect(handleSearch).toHaveBeenCalled();
  });

  it("disables search button for known invalid departure", () => {
    renderWithContext(<LocationSearchForm />, {
      isWithinNYC: jest.fn().mockReturnValue(false),
    });

    const [depBtn] = screen.getAllByRole("button", { name: /search/i });
    expect(depBtn).toBeDisabled();
  });

  it("shows suggestions when searching", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            suggestions: [
              {
                mapbox_id: "test1",
                name: "Test Location",
                place_formatted: "New York, NY",
              },
            ],
          }),
      })
    );

    renderWithContext(<LocationSearchForm />);

    const destinationInput = screen.getByPlaceholderText(/enter destination/i);
    await act(async () => {
      fireEvent.change(destinationInput, { target: { value: "test" } });
    });

    const searchButton = screen.getAllByRole("button", { name: /search/i })[1];
    await act(async () => {
      fireEvent.click(searchButton);
    });

    await waitFor(() => {
      expect(screen.getByText("Test Location")).toBeInTheDocument();
    });
  });

  it("updates input when suggestion is selected", async () => {
    global.fetch = jest
      .fn()
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              suggestions: [
                {
                  mapbox_id: "test1",
                  name: "Test Location",
                  place_formatted: "New York, NY",
                },
              ],
            }),
        })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              features: [
                {
                  geometry: { coordinates: [-73.99, 40.75] },
                },
              ],
            }),
        })
      );

    renderWithContext(<LocationSearchForm />);

    const destinationInput = screen.getByPlaceholderText(/enter destination/i);
    await act(async () => {
      fireEvent.change(destinationInput, { target: { value: "test" } });
    });

    const searchButton = screen.getAllByRole("button", { name: /search/i })[1];
    await act(async () => {
      fireEvent.click(searchButton);
    });

    const suggestion = await screen.findByText("Test Location");
    await act(async () => {
      fireEvent.click(suggestion);
    });

    expect(destinationInput).toHaveValue("Test Location, New York, NY");
  });

  it("toggles form visibility", async () => {
    const setShowLocationSearchForm = jest.fn();
    renderWithContext(<LocationSearchForm />, {
      setShowLocationSearchForm,
    });

    const toggleButton = screen.getByLabelText(/toggle form visibility/i);
    await act(async () => {
      fireEvent.click(toggleButton);
    });

    expect(setShowLocationSearchForm).toHaveBeenCalledWith(false);
  });
});
