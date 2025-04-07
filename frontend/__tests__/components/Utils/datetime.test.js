import formatDateAgo, {
  formatDateAgoShort,
  formatDate,
} from "@/utils/datetime";

describe("datetime utils", () => {
  // Mock current date for consistent testing
  const NOW = new Date("2024-03-20T12:00:00Z");
  let originalDate;

  beforeEach(() => {
    originalDate = global.Date;
    global.Date = class extends Date {
      constructor(date) {
        if (date) {
          return super(date);
        }
        return NOW;
      }
    };
  });

  afterEach(() => {
    global.Date = originalDate;
  });

  describe("formatDateAgo", () => {
    it("formats just now", () => {
      const date = new Date(NOW - 30 * 1000); // 30 seconds ago
      expect(formatDateAgo(date)).toBe("just now");
    });

    it("formats minutes", () => {
      const oneMinute = new Date(NOW - 1 * 60 * 1000);
      const fiveMinutes = new Date(NOW - 5 * 60 * 1000);

      expect(formatDateAgo(oneMinute)).toBe("1 min ago");
      expect(formatDateAgo(fiveMinutes)).toBe("5 mins ago");
    });

    it("formats hours", () => {
      const oneHour = new Date(NOW - 1 * 60 * 60 * 1000);
      const threeHours = new Date(NOW - 3 * 60 * 60 * 1000);

      expect(formatDateAgo(oneHour)).toBe("1 hour ago");
      expect(formatDateAgo(threeHours)).toBe("3 hours ago");
    });

    it("formats days", () => {
      const yesterday = new Date(NOW - 1 * 24 * 60 * 60 * 1000);
      const threeDays = new Date(NOW - 3 * 24 * 60 * 60 * 1000);

      expect(formatDateAgo(yesterday)).toBe("yesterday");
      expect(formatDateAgo(threeDays)).toBe("3 days ago");
    });

    it("formats months", () => {
      const oneMonth = new Date(NOW - 30 * 24 * 60 * 60 * 1000);
      const threeMonths = new Date(NOW - 90 * 24 * 60 * 60 * 1000);

      expect(formatDateAgo(oneMonth)).toBe("1 month ago");
      expect(formatDateAgo(threeMonths)).toBe("3 months ago");
    });

    it("formats years", () => {
      const oneYear = new Date(NOW - 365 * 24 * 60 * 60 * 1000);
      const twoYears = new Date(NOW - 2 * 365 * 24 * 60 * 60 * 1000);

      expect(formatDateAgo(oneYear)).toBe("1 year ago");
      expect(formatDateAgo(twoYears)).toBe("2 years ago");
    });
  });

  describe("formatDateAgoShort", () => {
    it("formats now", () => {
      const date = new Date(NOW - 30 * 1000); // 30 seconds ago
      expect(formatDateAgoShort(date)).toBe("now");
    });

    it("formats minutes short", () => {
      const fiveMinutes = new Date(NOW - 5 * 60 * 1000);
      expect(formatDateAgoShort(fiveMinutes)).toBe("5m");
    });

    it("formats hours short", () => {
      const threeHours = new Date(NOW - 3 * 60 * 60 * 1000);
      expect(formatDateAgoShort(threeHours)).toBe("3h");
    });

    it("formats days short", () => {
      const threeDays = new Date(NOW - 3 * 24 * 60 * 60 * 1000);
      expect(formatDateAgoShort(threeDays)).toBe("3d");
    });

    it("formats months short", () => {
      const threeMonths = new Date(NOW - 90 * 24 * 60 * 60 * 1000);
      expect(formatDateAgoShort(threeMonths)).toBe("3mo");
    });

    it("formats years short", () => {
      const twoYears = new Date(NOW - 2 * 365 * 24 * 60 * 60 * 1000);
      expect(formatDateAgoShort(twoYears)).toBe("2yr");
    });
  });

  describe("formatDate", () => {
    it("formats recent dates as relative time", () => {
      const threeDaysAgo = new Date(NOW - 3 * 24 * 60 * 60 * 1000);
      expect(formatDate(threeDaysAgo)).toMatch(/days ago/);
    });

    it("formats older dates with full date format", () => {
      const oldDate = new Date(NOW - 10 * 24 * 60 * 60 * 1000);
      expect(formatDate(oldDate)).toMatch(/^\w{3} \d{1,2}, \d{4}$/); // Matches format like "Mar 10, 2024"
    });

    it("handles invalid dates", () => {
      expect(formatDate("invalid-date")).toBe("a month ago");
    });
  });

  describe("edge cases", () => {
    it("handles invalid date input", () => {
      expect(formatDateAgo("invalid-date")).toBe("NaN years ago");
      expect(formatDateAgoShort("invalid-date")).toBe("NaNyr");
    });

    it("handles future dates", () => {
      const futureDate = new Date(NOW.getTime() + 24 * 60 * 60 * 1000);
      expect(formatDateAgo(futureDate)).toBe("just now");
      expect(formatDateAgoShort(futureDate)).toBe("now");
    });

    it("handles null input", () => {
      expect(formatDateAgo(null)).toBe("just now");
      expect(formatDateAgoShort(null)).toBe("now");
    });

    it("handles undefined input", () => {
      expect(formatDateAgo(undefined)).toBe("just now");
      expect(formatDateAgoShort(undefined)).toBe("now");
    });
  });
});
