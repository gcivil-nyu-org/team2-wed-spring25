import React from "react";
import { render, act } from "@testing-library/react";
import ToastNotifications from "@/app/custom-components/ToastComponent/ToastNotification";
import {
  NotificationProvider,
  useNotification,
} from "@/app/custom-components/ToastComponent/NotificationContext";
import { toast } from "sonner";

// Mock toast functions
jest.mock("sonner", () => ({
  toast: {
    error: jest.fn((title, options) => {
      // Simulate clicking the action button if it exists
      if (options && options.action && options.action.onClick) {
        options.action.onClick();
        return { mockActionClick: true };
      }
      return null;
    }),
    warning: jest.fn((title, options) => {
      // Simulate clicking the action button if it exists
      if (options && options.action && options.action.onClick) {
        options.action.onClick();
        return { mockActionClick: true };
      }
      return null;
    }),
    success: jest.fn(),
  },
}));

// Component to trigger notifications with different types of details
const DetailsTester = () => {
  const { showError, showWarning } = useNotification();

  return (
    <div>
      {/* Test with string details */}
      <button
        data-testid="error-string-details"
        onClick={() =>
          showError(
            "Error with string details",
            "This is a detailed error message",
            "api"
          )
        }
      >
        Error with String Details
      </button>

      {/* Test with Error object details */}
      <button
        data-testid="error-error-details"
        onClick={() =>
          showError(
            "Error with Error object",
            new Error("Error object details"),
            "api"
          )
        }
      >
        Error with Error Object
      </button>

      {/* Test with complex object details */}
      <button
        data-testid="error-object-details"
        onClick={() =>
          showError(
            "Error with object details",
            {
              code: 500,
              message: "Server error",
              stack: "Error stack trace...",
            },
            "api"
          )
        }
      >
        Error with Object Details
      </button>

      {/* Test with invalid object that can't be stringified */}
      <button
        data-testid="error-invalid-details"
        onClick={() => {
          const circularObj = {};
          circularObj.self = circularObj; // Create circular reference
          showError("Error with invalid details", circularObj, "api");
        }}
      >
        Error with Invalid Details
      </button>

      {/* Repeat for warnings */}
      <button
        data-testid="warning-string-details"
        onClick={() =>
          showWarning(
            "Warning with string details",
            "This is a detailed warning message",
            "routing_issue"
          )
        }
      >
        Warning with String Details
      </button>

      <button
        data-testid="warning-error-details"
        onClick={() =>
          showWarning(
            "Warning with Error object",
            new Error("Warning object details"),
            "routing_issue"
          )
        }
      >
        Warning with Error Object
      </button>

      <button
        data-testid="warning-object-details"
        onClick={() =>
          showWarning(
            "Warning with object details",
            { code: 404, message: "Not found", details: "Additional info..." },
            "routing_issue"
          )
        }
      >
        Warning with Object Details
      </button>

      <button
        data-testid="warning-invalid-details"
        onClick={() => {
          const circularObj = {};
          circularObj.self = circularObj; // Create circular reference
          showWarning(
            "Warning with invalid details",
            circularObj,
            "routing_issue"
          );
        }}
      >
        Warning with Invalid Details
      </button>
    </div>
  );
};

// Test component with both ToastNotifications and the tester
const TestApp = () => (
  <NotificationProvider>
    <ToastNotifications />
    <DetailsTester />
  </NotificationProvider>
);

describe("ToastNotifications with Details", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should handle string details for errors", () => {
    const { getByTestId } = render(<TestApp />);

    // Trigger error with string details
    act(() => {
      getByTestId("error-string-details").click();
    });

    // Check that the initial toast was called
    expect(toast.error).toHaveBeenCalled();

    // The action.onClick should have been automatically called by our mock
    // Check the second toast call for details
    expect(toast.error).toHaveBeenCalledWith(
      "Error Details",
      expect.objectContaining({
        description: "This is a detailed error message",
      })
    );
  });

  test("should handle Error object details for errors", () => {
    const { getByTestId } = render(<TestApp />);

    // Trigger error with Error object details
    act(() => {
      getByTestId("error-error-details").click();
    });

    // After clicking "Details", expect to see the error message from the Error object
    expect(toast.error).toHaveBeenCalledWith(
      "Error Details",
      expect.objectContaining({
        description: "Error object details",
      })
    );
  });

  test("should handle complex object details for errors", () => {
    const { getByTestId } = render(<TestApp />);

    // Trigger error with object details
    act(() => {
      getByTestId("error-object-details").click();
    });

    // First toast call should be the initial error message
    expect(toast.error).toHaveBeenNthCalledWith(
      1,
      "API Error",
      expect.objectContaining({
        description: "Error with object details",
        duration: 5000,
        icon: expect.any(Object),
        className: "my-toast error-toast error-api",
        action: expect.any(Object),
      })
    );

    // Second toast call should be the details view
    // This happens when the action.onClick is triggered by our mock
    expect(toast.error).toHaveBeenNthCalledWith(
      2,
      "Error Details",
      expect.objectContaining({
        description: expect.stringContaining('"code": 500'),
        duration: 6000,
        icon: expect.any(Object),
        className: "my-toast",
      })
    );
  });

  test("should handle invalid object details for errors gracefully", () => {
    const { getByTestId } = render(<TestApp />);

    // Trigger error with invalid details (circular reference)
    act(() => {
      getByTestId("error-invalid-details").click();
    });

    // Should display a fallback message
    expect(toast.error).toHaveBeenCalledWith(
      "Error Details",
      expect.objectContaining({
        description: "Error details could not be displayed",
      })
    );
  });

  test("should handle string details for warnings", () => {
    const { getByTestId } = render(<TestApp />);

    // Trigger warning with string details
    act(() => {
      getByTestId("warning-string-details").click();
    });

    // Check that the initial toast was called
    expect(toast.warning).toHaveBeenCalled();

    // The action.onClick should have been automatically called by our mock
    // Check the second toast call for details
    expect(toast.warning).toHaveBeenCalledWith(
      "Warning Details",
      expect.objectContaining({
        description: "This is a detailed warning message",
      })
    );
  });

  test("should handle Error object details for warnings", () => {
    const { getByTestId } = render(<TestApp />);

    // Trigger warning with Error object details
    act(() => {
      getByTestId("warning-error-details").click();
    });

    // After clicking "Details", expect to see the error message from the Error object
    expect(toast.warning).toHaveBeenCalledWith(
      "Warning Details",
      expect.objectContaining({
        description: "Warning object details",
      })
    );
  });

  test("should handle complex object details for warnings", () => {
    const { getByTestId } = render(<TestApp />);

    // Trigger warning with object details
    act(() => {
      getByTestId("warning-object-details").click();
    });

    // First toast call should be the initial warning message
    expect(toast.warning).toHaveBeenNthCalledWith(
      1,
      "Routing Issue",
      expect.objectContaining({
        description: "Warning with object details",
        duration: 5000,
        icon: expect.any(Object),
        className: "my-toast warning-toast warning-routing_issue",
        action: expect.any(Object),
      })
    );

    // Second toast call should be the details view
    // This happens when the action.onClick is triggered by our mock
    expect(toast.warning).toHaveBeenNthCalledWith(
      2,
      "Warning Details",
      expect.objectContaining({
        description: expect.stringContaining('"code": 404'),
        duration: 6000,
        icon: expect.any(Object),
        className: "my-toast",
      })
    );
  });

  test("should handle invalid object details for warnings gracefully", () => {
    const { getByTestId } = render(<TestApp />);

    // Trigger warning with invalid details (circular reference)
    act(() => {
      getByTestId("warning-invalid-details").click();
    });

    // Should display a fallback message
    expect(toast.warning).toHaveBeenCalledWith(
      "Warning Details",
      expect.objectContaining({
        description: "Warning details could not be displayed",
      })
    );
  });
});
