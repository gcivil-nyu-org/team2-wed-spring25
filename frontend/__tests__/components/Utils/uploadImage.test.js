import uploadImage from "@/utils/uploadImage";

describe("uploadImage", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Setup environment variables
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET = "test_preset";
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = "test_cloud";
    global.fetch = jest.fn();
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.resetAllMocks();
  });

  it("successfully uploads an image", async () => {
    const mockResponse = { secure_url: "https://example.com/image.jpg" };
    global.fetch.mockResolvedValueOnce({
      json: () => Promise.resolve(mockResponse),
    });

    const result = await uploadImage(new File([""], "test.jpg"));

    expect(result).toBe("https://example.com/image.jpg");
    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.cloudinary.com/v1_1/test_cloud/image/upload",
      expect.any(Object)
    );
  });

  it("handles upload errors", async () => {
    const mockError = new Error("Upload failed");
    global.fetch.mockRejectedValueOnce(mockError);

    await expect(uploadImage(new File([""], "test.jpg"))).rejects.toThrow(
      "Upload failed"
    );
  });
});
