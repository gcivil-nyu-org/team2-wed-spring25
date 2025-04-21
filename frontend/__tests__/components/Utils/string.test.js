import { truncateFilenameWithEllipsis, getUserFullName } from "@/utils/string";

describe("string utils", () => {
  describe("truncateFilenameWithEllipsis", () => {
    it("returns empty string if filename is empty", () => {
      expect(truncateFilenameWithEllipsis("")).toBe("");
      expect(truncateFilenameWithEllipsis(null)).toBe("");
      expect(truncateFilenameWithEllipsis(undefined)).toBe("");
    });

    it("returns filename unchanged if shorter than maxLength", () => {
      expect(truncateFilenameWithEllipsis("short.txt", 10)).toBe("short.txt");
    });

    it("truncates filename and keeps extension", () => {
      expect(truncateFilenameWithEllipsis("longfilename.txt", 4)).toBe(
        "long....txt"
      );
      expect(truncateFilenameWithEllipsis("averyverylongname.md", 5)).toBe(
        "avery....md"
      );
    });

    it("truncates filename with no extension", () => {
      expect(truncateFilenameWithEllipsis("longname", 4)).toBe("long...");
    });

    it("handles multiple dots correctly", () => {
      expect(truncateFilenameWithEllipsis("archive.tar.gz", 7)).toBe(
        "archive....gz"
      );
    });

    it("returns original if name is exactly maxLength", () => {
      expect(truncateFilenameWithEllipsis("test.txt", 4)).toBe("test.txt");
    });

    it("handles maxLength of 0", () => {
      expect(truncateFilenameWithEllipsis("hello.txt", 0)).toBe("....txt");
    });

    it("handles filename with dot at the start (hidden files)", () => {
      expect(truncateFilenameWithEllipsis(".gitignore", 3)).toBe(".gitignore");
    });

    it("handles File objects", () => {
      const mockFile = new File([""], "document.pdf", {
        type: "application/pdf",
      });
      expect(truncateFilenameWithEllipsis(mockFile.name, 4)).toBe(
        "docu....pdf"
      );
    });

    it("handles very short maxLength with extension", () => {
      expect(truncateFilenameWithEllipsis("test.txt", 1)).toBe("t....txt");
    });
  });

  describe("getUserFullName", () => {
    it("capitalizes first letter of each word", () => {
      expect(getUserFullName("john", "doe")).toBe("John Doe");
    });

    it("handles mixed case input", () => {
      expect(getUserFullName("jOhN", "dOe")).toBe("John Doe");
    });

    it("handles multiple spaces", () => {
      expect(getUserFullName("mary  jane", "van  der")).toBe(
        "Mary  Jane Van  Der"
      );
      expect(getUserFullName("mary jane", "van der")).toBe("Mary Jane Van Der");
    });

    it("handles multiple spaces", () => {
      expect(getUserFullName("mary jane", "doe")).toBe("Mary Jane Doe");
    });

    it("normalizes single spaces", () => {
      expect(getUserFullName("mary jane", "van der")).toBe("Mary Jane Van Der");
    });
  });
});
