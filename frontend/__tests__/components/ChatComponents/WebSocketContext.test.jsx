import { render, act, renderHook } from "@testing-library/react";
import { WebSocketProvider, useWebSocket } from "@/contexts/WebSocketContext";

describe("WebSocketContext", () => {
  let mockWebSocket;
  let originalConsoleError;

  beforeEach(() => {
    // Save original console.error
    originalConsoleError = console.error;

    mockWebSocket = {
      send: jest.fn(),
      close: jest.fn(),
      readyState: WebSocket.CONNECTING,
      // Define these as functions that will be assigned later
      onopen: null,
      onmessage: null,
      onclose: null,
      onerror: null,
    };

    // Mock the WebSocket constructor
    global.WebSocket = jest.fn(() => mockWebSocket);

    // Mock environment variables
    process.env.NEXT_PUBLIC_WEB_SOCKET = "test.com";
  });

  afterEach(() => {
    // Restore console.error
    console.error = originalConsoleError;
    jest.clearAllMocks();
  });

  const wrapper = ({ children }) => (
    <WebSocketProvider>{children}</WebSocketProvider>
  );

  it("initializes with default values", () => {
    const { result } = renderHook(() => useWebSocket(), { wrapper });
    expect(result.current.connectionStatus).toBe("disconnected");
    expect(result.current.onlineUsers).toEqual([]);
    expect(result.current.chatUserList).toEqual([]);
    expect(result.current.selectedUser).toBeNull();
    expect(result.current.listOfUsersTyping).toEqual([]);
  });

  it("establishes WebSocket connection when initialized with userId", async () => {
    const { result } = renderHook(() => useWebSocket(), { wrapper });

    await act(async () => {
      result.current.initializeConnection("123");
    });

    expect(global.WebSocket).toHaveBeenCalledWith("ws://test.com/ws/chat/123/");

    // Trigger onopen event to simulate successful connection
    await act(async () => {
      mockWebSocket.readyState = WebSocket.OPEN;
      // Call the handler that was assigned by the context
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen();
      }
    });

    expect(result.current.connectionStatus).toBe("connected");
  });

  it("handles user typing status", async () => {
    const { result } = renderHook(() => useWebSocket(), { wrapper });

    // Connect to WebSocket
    await act(async () => {
      result.current.initializeConnection("123");
      mockWebSocket.readyState = WebSocket.OPEN;
      // Call the handler if it exists
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen();
      }
    });

    // Test typing status
    await act(async () => {
      result.current.handleUserTyping("chat123", "user456", true);
    });

    expect(mockWebSocket.send).toHaveBeenCalledWith(
      JSON.stringify({
        type: "typing_status",
        is_typing: true,
        recipient_id: "user456",
        chat_uuid: "chat123",
      })
    );
  });

  it("handles incoming chat messages", async () => {
    const { result } = renderHook(() => useWebSocket(), { wrapper });

    // Connect to WebSocket
    await act(async () => {
      result.current.initializeConnection("123");
      mockWebSocket.readyState = WebSocket.OPEN;
      // Call the handler if it exists
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen();
      }
    });

    // Setup initial chat user list
    await act(async () => {
      result.current.setChatUserList([
        {
          user: { id: "123" },
          messages: [],
          chat_uuid: "chat123",
          unread_count: 0, // Make sure to include this
        },
      ]);
    });

    // Simulate receiving a message
    await act(async () => {
      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage({
          data: JSON.stringify({
            type: "chat_message",
            sender_id: "123",
            message_id: "msg1",
            message: "Hello",
            timestamp: "2024-01-01",
          }),
        });
      }
    });

    expect(result.current.chatUserList[0].messages).toContainEqual(
      expect.objectContaining({
        content: "Hello",
        id: "msg1",
      })
    );
  });

  it("handles online users updates", async () => {
    const { result } = renderHook(() => useWebSocket(), { wrapper });

    // Connect to WebSocket
    await act(async () => {
      result.current.initializeConnection("123");
      mockWebSocket.readyState = WebSocket.OPEN;
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen();
      }
    });

    // Simulate receiving online user list
    await act(async () => {
      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage({
          data: JSON.stringify({
            type: "user_list",
            users: ["123", "456"], // Note: The context expects strings, not objects
          }),
        });
      }
    });

    expect(result.current.onlineUsers).toEqual([{ id: "123" }, { id: "456" }]);
  });

  it("handles user selection and marks messages as read", async () => {
    const { result } = renderHook(() => useWebSocket(), { wrapper });

    // Connect to WebSocket
    await act(async () => {
      result.current.initializeConnection("123");
      mockWebSocket.readyState = WebSocket.OPEN;
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen();
      }
    });

    // Test user selection
    await act(async () => {
      result.current.handleUserSelection("chat123", "user456");
    });

    expect(mockWebSocket.send).toHaveBeenCalledWith(
      JSON.stringify({
        type: "mark_messages_read",
        sender_id: "user456",
        chat_uuid: "chat123",
        current_user_id: "123",
      })
    );
  });

  it("handles connection status changes", async () => {
    const { result } = renderHook(() => useWebSocket(), { wrapper });

    // Connect to WebSocket
    await act(async () => {
      result.current.initializeConnection("123");
    });

    // Wait for the WebSocket event handlers to be assigned
    await act(async () => {
      // Wait for the next tick of the event loop
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Manually update the readyState and trigger the onopen event
    await act(async () => {
      mockWebSocket.readyState = WebSocket.OPEN;
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen();
      }
    });

    // Check that connectionStatus has been updated
    expect(result.current.connectionStatus).toBe("connected");

    // Simulate WebSocket closing
    await act(async () => {
      if (mockWebSocket.onclose) {
        mockWebSocket.onclose({ code: 1000 });
      }
    });

    expect(result.current.connectionStatus).toBe("disconnected");
  });

  it("handles typing indicator updates", async () => {
    const { result } = renderHook(() => useWebSocket(), { wrapper });

    // Connect to WebSocket
    await act(async () => {
      result.current.initializeConnection("123");
      mockWebSocket.readyState = WebSocket.OPEN;
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen();
      }
    });

    // Simulate receiving typing status
    await act(async () => {
      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage({
          data: JSON.stringify({
            type: "typing", // Note: The context expects "typing", not "typing_status"
            sender_id: "123",
            is_typing: true,
          }),
        });
      }
    });

    expect(result.current.listOfUsersTyping).toContain("123");
  });

  it("throws error when used outside provider", () => {
    // Temporarily suppress console.error
    console.error = jest.fn();

    expect(() => {
      renderHook(() => useWebSocket());
    }).toThrow("useWebSocket must be used within a WebSocketProvider");
  });

  it("handles message delivery status updates", async () => {
    const { result } = renderHook(() => useWebSocket(), { wrapper });

    // Connect to WebSocket and set up test data
    await act(async () => {
      result.current.initializeConnection("123");
      mockWebSocket.readyState = WebSocket.OPEN;
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen();
      }

      result.current.setChatUserList([
        {
          user: { id: "123" },
          messages: [{ id: "temp-msg1", content: "Hello", sender_id: "123" }],
          chat_uuid: "chat123",
        },
      ]);
    });

    // Simulate message delivery status update
    await act(async () => {
      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage({
          data: JSON.stringify({
            type: "message_delivery",
            old_message_id: "temp-msg1",
            message_id: "server-msg1",
            chat_uuid: "chat123",
          }),
        });
      }
    });

    // Verify the message ID was updated
    const updatedMessage = result.current.chatUserList[0].messages.find(
      (msg) => msg.id === "server-msg1"
    );
    expect(updatedMessage).toBeDefined();
  });

  it("handles messages read status updates", async () => {
    const { result } = renderHook(() => useWebSocket(), { wrapper });

    // Connect to WebSocket and set up test data
    await act(async () => {
      result.current.initializeConnection("123");
      mockWebSocket.readyState = WebSocket.OPEN;
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen();
      }

      result.current.setChatUserList([
        {
          user: { id: "456" },
          messages: [
            { id: "msg1", content: "Hello", sender_id: "123", read: false },
            { id: "msg2", content: "Hi", sender_id: "456", read: false },
          ],
          chat_uuid: "chat123",
        },
      ]);
    });

    // mock messages read status update
    await act(async () => {
      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage({
          data: JSON.stringify({
            type: "messages_read",
            chat_uuid: "chat123",
            reader_id: "456", // Messages from 123 should be marked as read
          }),
        });
      }
    });

    // Verify messages from 123 are marked as read
    const message = result.current.chatUserList[0].messages.find(
      (msg) => msg.sender_id === "123"
    );
    expect(message.read).toBe(true);

    // Messages from 456 should remain unchanged
    const otherMessage = result.current.chatUserList[0].messages.find(
      (msg) => msg.sender_id === "456"
    );
    expect(otherMessage.read).toBe(false);
  });
});
