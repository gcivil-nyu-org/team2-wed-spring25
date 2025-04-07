import { truncateFilenameWithEllipsis, getUserFullName } from "@/utils/string";

describe("string utils", () => {
  describe("truncateFilenameWithEllipsis", () => {
    it("handles null or empty filename", () => {
      expect(truncateFilenameWithEllipsis(null, 10)).toBe("");
      expect(truncateFilenameWithEllipsis("", 10)).toBe("");
    });

    it("truncates filename with extension when too long", () => {
      expect(truncateFilenameWithEllipsis("verylongfilename.jpg", 8)).toBe(
        "verylong....jpg"
      );
    });

    it("keeps original filename when shorter than maxLength", () => {
      expect(truncateFilenameWithEllipsis("short.jpg", 10)).toBe("short.jpg");
    });

    it("handles filenames without extension", () => {
      expect(truncateFilenameWithEllipsis("verylongfilename", 8)).toBe(
        "verylong..."
      );
    });
  });

  describe("getUserFullName", () => {
    it("capitalizes first letter of each word", () => {
      expect(getUserFullName("john", "doe")).toBe("John Doe");
    });

    it("handles mixed case input", () => {
      expect(getUserFullName("JOHN", "DOE")).toBe("John Doe");
      expect(getUserFullName("jOhN", "dOe")).toBe("John Doe");
    });

    it("handles multiple spaces", () => {
      expect(getUserFullName("mary jane", "doe")).toBe("Mary Jane Doe");
    });
  });
});
