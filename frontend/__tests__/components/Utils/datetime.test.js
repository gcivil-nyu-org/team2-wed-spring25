import formatDateAgo, {
  formatDateAgoShort,
  formatDate,
  getLastMessageTimeStampAMPM,
  getLastMessageTimeStamp,
  isMessageSentWithin2Days,
  isMessageSentWithin15Mins
} from "@/utils/datetime";

describe("datetime utils", () => {
  // Mock current date for consistent testing
  const NOW = new Date("2024-03-20T12:00:00Z");
  let originalDate;
  let originalConsoleLog;

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
    
    // Mock console.log to prevent test output cluttering
    originalConsoleLog = console.log;
    console.log = jest.fn();
  });

  afterEach(() => {
    global.Date = originalDate;
    console.log = originalConsoleLog;
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
  
  // NEW TESTS FOR PREVIOUSLY UNTESTED FUNCTIONS
  
  describe("getLastMessageTimeStampAMPM", () => {
    it("formats morning time correctly with AM", () => {
      const morningTime = new Date("2024-03-20T09:30:00");
      expect(getLastMessageTimeStampAMPM(morningTime)).toBe("9:30 AM");
    });
    
    it("formats afternoon time correctly with PM", () => {
      const afternoonTime = new Date("2024-03-20T14:45:00");
      expect(getLastMessageTimeStampAMPM(afternoonTime)).toBe("2:45 PM");
    });
    
    it("formats midnight correctly as 12 AM", () => {
      const midnight = new Date("2024-03-20T00:00:00");
      expect(getLastMessageTimeStampAMPM(midnight)).toBe("12:00 AM");
    });
    
    it("formats noon correctly as 12 PM", () => {
      const noon = new Date("2024-03-20T12:00:00");
      expect(getLastMessageTimeStampAMPM(noon)).toBe("12:00 PM");
    });
    
    it("pads minutes with leading zero when needed", () => {
      const timeWithSingleDigitMinute = new Date("2024-03-20T15:05:00");
      expect(getLastMessageTimeStampAMPM(timeWithSingleDigitMinute)).toBe("3:05 PM");
    });
    
    it("handles single-digit hour without padding", () => {
      const timeWithSingleDigitHour = new Date("2024-03-20T05:30:00");
      expect(getLastMessageTimeStampAMPM(timeWithSingleDigitHour)).toBe("5:30 AM");
    });
  });
  
  describe("getLastMessageTimeStamp", () => {
    it("formats today's message with time", () => {
      // Create a time on the same day as NOW
      const todayTime = new Date(NOW);
      todayTime.setHours(9, 30, 0, 0); // 9:30 AM
      
      expect(getLastMessageTimeStamp(todayTime)).toBe("9:30 AM");
    });
    
    it("formats a message from yesterday with day of week", () => {
      // NOW is Wednesday (March 20, 2024)
      const yesterday = new Date(NOW);
      yesterday.setDate(NOW.getDate() - 1); // Tuesday
      
      expect(getLastMessageTimeStamp(yesterday)).toBe("Tuesday");
    });
    
    it("formats a message from 5 days ago with day of week", () => {
      const fiveDaysAgo = new Date(NOW);
      fiveDaysAgo.setDate(NOW.getDate() - 5); // Friday
      
      expect(getLastMessageTimeStamp(fiveDaysAgo)).toBe("Friday");
    });
    
    it("formats older messages with date format", () => {
      const sevenDaysAgo = new Date(NOW);
      sevenDaysAgo.setDate(NOW.getDate() - 7);
      
      const month = sevenDaysAgo.getMonth() + 1;
      const day = sevenDaysAgo.getDate();
      const year = sevenDaysAgo.getFullYear();
      const expected = `${month}/${day}/${year}`;
      
      expect(getLastMessageTimeStamp(sevenDaysAgo)).toBe(expected);
    });
    
    it("uses correct time format for AM/PM", () => {
      // Create times on the same day
      const morningToday = new Date(NOW);
      morningToday.setHours(8, 15, 0, 0); // 8:15 AM
      
      const eveningToday = new Date(NOW);
      eveningToday.setHours(20, 45, 0, 0); // 8:45 PM
      
      expect(getLastMessageTimeStamp(morningToday)).toBe("8:15 AM");
      expect(getLastMessageTimeStamp(eveningToday)).toBe("8:45 PM");
    });
  });
  
  describe("isMessageSentWithin2Days", () => {
    beforeEach(() => {
      // Set NOW to a specific date (Wednesday, March 20, 2024 at noon)
      global.Date = class extends Date {
        constructor(date) {
          if (date) {
            return super(date);
          }
          return new originalDate("2024-03-20T12:00:00Z");
        }
      };
    });
    
    it("returns true for a message sent today", () => {
      const todayMessage = new Date("2024-03-20T10:00:00Z");
      expect(isMessageSentWithin2Days(todayMessage)).toBe(true);
    });
    
    it("returns true for a message sent yesterday", () => {
      const yesterdayMessage = new Date("2024-03-19T15:30:00Z");
      expect(isMessageSentWithin2Days(yesterdayMessage)).toBe(true);
    });
  
    
    it("returns false for a message sent more than 2 days ago", () => {
      const threeDaysAgo = new Date("2024-03-17T12:00:00Z");
      expect(isMessageSentWithin2Days(threeDaysAgo)).toBe(false);
    });
    
  });
  
  describe("isMessageSentWithin15Mins", () => {
    it("returns true for a message sent just now", () => {
      const justNow = new Date(NOW);
      expect(isMessageSentWithin15Mins(justNow)).toBe(true);
    });
    
    it("returns true for a message sent 10 minutes ago", () => {
      const tenMinsAgo = new Date(NOW);
      tenMinsAgo.setMinutes(NOW.getMinutes() - 10);
      expect(isMessageSentWithin15Mins(tenMinsAgo)).toBe(true);
    });
    
    
    it("returns false for a message sent more than 15 minutes ago", () => {
      const sixteenMinsAgo = new Date(NOW);
      sixteenMinsAgo.setMinutes(NOW.getMinutes() - 16);
      expect(isMessageSentWithin15Mins(sixteenMinsAgo)).toBe(false);
    });
    
  });
});