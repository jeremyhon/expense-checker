import { describe, expect, test } from "bun:test";
import { Temporal } from "temporal-polyfill";
import {
  countMonthsInRange,
  createDateRange,
  dateRangeToPlainDateRange,
  dateRangeToUrlParams,
  dateToPlainDate,
  getCurrentMonth,
  getDisplayMonthKey,
  getLastMonth,
  getLastNMonths,
  getMonthKey,
  plainDateFromString,
  plainDateRangeToDateRange,
  plainDateToDate,
  plainDateToString,
} from "./temporal-dates";

describe("plainDateFromString", () => {
  test("parses valid YYYY-MM-DD strings", () => {
    const date = plainDateFromString("2025-01-15");
    expect(date).not.toBeNull();
    expect(date?.year).toBe(2025);
    expect(date?.month).toBe(1);
    expect(date?.day).toBe(15);
  });

  test("returns null for invalid format", () => {
    expect(plainDateFromString("2025/01/15")).toBeNull();
    expect(plainDateFromString("2025-1-15")).toBeNull();
    expect(plainDateFromString("invalid")).toBeNull();
    expect(plainDateFromString("")).toBeNull();
  });

  test("returns null for invalid dates", () => {
    expect(plainDateFromString("2025-13-01")).toBeNull();
    expect(plainDateFromString("2025-02-30")).toBeNull();
    expect(plainDateFromString("2025-00-15")).toBeNull();
  });

  test("handles leap years correctly", () => {
    const leapDate = plainDateFromString("2024-02-29");
    expect(leapDate).not.toBeNull();
    expect(leapDate?.year).toBe(2024);
    expect(leapDate?.month).toBe(2);
    expect(leapDate?.day).toBe(29);

    const nonLeapDate = plainDateFromString("2023-02-29");
    expect(nonLeapDate).toBeNull();
  });
});

describe("plainDateToString", () => {
  test("formats PlainDate to YYYY-MM-DD", () => {
    const date = Temporal.PlainDate.from({ year: 2025, month: 1, day: 15 });
    expect(plainDateToString(date)).toBe("2025-01-15");
  });

  test("pads single digits with zeros", () => {
    const date = Temporal.PlainDate.from({ year: 2025, month: 3, day: 5 });
    expect(plainDateToString(date)).toBe("2025-03-05");
  });
});

describe("createDateRange", () => {
  test("creates valid date range", () => {
    const range = createDateRange("2025-01-01", "2025-06-30");
    expect(range).not.toBeNull();
    expect(range?.from.toString()).toBe("2025-01-01");
    expect(range?.to.toString()).toBe("2025-06-30");
  });

  test("returns null when from > to", () => {
    const range = createDateRange("2025-06-30", "2025-01-01");
    expect(range).toBeNull();
  });

  test("returns null for invalid dates", () => {
    const range = createDateRange("invalid", "2025-06-30");
    expect(range).toBeNull();
  });

  test("allows same date for from and to", () => {
    const range = createDateRange("2025-01-01", "2025-01-01");
    expect(range).not.toBeNull();
    expect(range?.from.toString()).toBe("2025-01-01");
    expect(range?.to.toString()).toBe("2025-01-01");
  });
});

describe("dateRangeToUrlParams", () => {
  test("converts PlainDate range to URL params", () => {
    const range = {
      from: Temporal.PlainDate.from({ year: 2025, month: 1, day: 1 }),
      to: Temporal.PlainDate.from({ year: 2025, month: 6, day: 30 }),
    };
    const params = dateRangeToUrlParams(range);
    expect(params.from).toBe("2025-01-01");
    expect(params.to).toBe("2025-06-30");
  });
});

describe("countMonthsInRange", () => {
  test("counts months correctly for same month", () => {
    const from = Temporal.PlainDate.from({ year: 2025, month: 1, day: 1 });
    const to = Temporal.PlainDate.from({ year: 2025, month: 1, day: 31 });
    expect(countMonthsInRange(from, to)).toBe(1);
  });

  test("counts months correctly for Jan-Jun 2025 (the reported issue)", () => {
    const from = Temporal.PlainDate.from({ year: 2025, month: 1, day: 1 });
    const to = Temporal.PlainDate.from({ year: 2025, month: 6, day: 30 });
    expect(countMonthsInRange(from, to)).toBe(6);
  });

  test("counts months correctly across year boundary", () => {
    const from = Temporal.PlainDate.from({ year: 2024, month: 11, day: 15 });
    const to = Temporal.PlainDate.from({ year: 2025, month: 2, day: 10 });
    expect(countMonthsInRange(from, to)).toBe(4); // Nov 2024, Dec 2024, Jan 2025, Feb 2025
  });

  test("counts months correctly for full year", () => {
    const from = Temporal.PlainDate.from({ year: 2025, month: 1, day: 1 });
    const to = Temporal.PlainDate.from({ year: 2025, month: 12, day: 31 });
    expect(countMonthsInRange(from, to)).toBe(12);
  });

  test("handles partial months at end of range", () => {
    const from = Temporal.PlainDate.from({ year: 2025, month: 1, day: 15 });
    const to = Temporal.PlainDate.from({ year: 2025, month: 3, day: 10 });
    expect(countMonthsInRange(from, to)).toBe(3); // Jan, Feb, Mar
  });
});

describe("getMonthKey", () => {
  test("formats month key correctly", () => {
    const date = Temporal.PlainDate.from({ year: 2025, month: 1, day: 15 });
    expect(getMonthKey(date)).toBe("2025-01");
  });

  test("pads single digit months", () => {
    const date = Temporal.PlainDate.from({ year: 2025, month: 9, day: 15 });
    expect(getMonthKey(date)).toBe("2025-09");
  });

  test("handles double digit months", () => {
    const date = Temporal.PlainDate.from({ year: 2025, month: 12, day: 15 });
    expect(getMonthKey(date)).toBe("2025-12");
  });
});

describe("getDisplayMonthKey", () => {
  test("formats display month key correctly", () => {
    const date = Temporal.PlainDate.from({ year: 2025, month: 1, day: 15 });
    expect(getDisplayMonthKey(date)).toBe("Jan 2025");
  });

  test("handles all months correctly", () => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    months.forEach((monthName, index) => {
      const date = Temporal.PlainDate.from({
        year: 2025,
        month: index + 1,
        day: 15,
      });
      expect(getDisplayMonthKey(date)).toBe(`${monthName} 2025`);
    });
  });
});

describe("getCurrentMonth", () => {
  test("returns current month range", () => {
    const range = getCurrentMonth();
    const today = Temporal.Now.plainDateISO();

    expect(range.from.year).toBe(today.year);
    expect(range.from.month).toBe(today.month);
    expect(range.from.day).toBe(1);

    expect(range.to.year).toBe(today.year);
    expect(range.to.month).toBe(today.month);

    // Last day of month should be >= 28 (February minimum)
    expect(range.to.day).toBeGreaterThanOrEqual(28);
  });
});

describe("getLastMonth", () => {
  test("returns previous month range", () => {
    const range = getLastMonth();
    const today = Temporal.Now.plainDateISO();
    const expectedLastMonth = today.subtract({ months: 1 });

    expect(range.from.year).toBe(expectedLastMonth.year);
    expect(range.from.month).toBe(expectedLastMonth.month);
    expect(range.from.day).toBe(1);

    expect(range.to.year).toBe(expectedLastMonth.year);
    expect(range.to.month).toBe(expectedLastMonth.month);
  });
});

describe("getLastNMonths", () => {
  test("returns last 3 months correctly", () => {
    const range = getLastNMonths(3);
    const today = Temporal.Now.plainDateISO();
    const expectedStart = today.with({ day: 1 }).subtract({ months: 3 });
    const expectedEnd = today.with({ day: 1 }).subtract({ days: 1 });

    expect(range.from.toString()).toBe(expectedStart.toString());
    expect(range.to.toString()).toBe(expectedEnd.toString());
  });

  test("returns last 6 months correctly", () => {
    const range = getLastNMonths(6);
    const today = Temporal.Now.plainDateISO();
    const expectedStart = today.with({ day: 1 }).subtract({ months: 6 });
    const expectedEnd = today.with({ day: 1 }).subtract({ days: 1 });

    expect(range.from.toString()).toBe(expectedStart.toString());
    expect(range.to.toString()).toBe(expectedEnd.toString());
  });

  test("excludes current month", () => {
    const range = getLastNMonths(1);
    const today = Temporal.Now.plainDateISO();

    // Should not include current month
    expect(range.to.month).not.toBe(today.month);
  });
});

describe("Legacy conversion utilities", () => {
  describe("plainDateToDate", () => {
    test("converts PlainDate to JavaScript Date", () => {
      const plainDate = Temporal.PlainDate.from({
        year: 2025,
        month: 1,
        day: 15,
      });
      const jsDate = plainDateToDate(plainDate);

      expect(jsDate.getFullYear()).toBe(2025);
      expect(jsDate.getMonth()).toBe(0); // JavaScript months are 0-indexed
      expect(jsDate.getDate()).toBe(15);
    });
  });

  describe("dateToPlainDate", () => {
    test("converts JavaScript Date to PlainDate", () => {
      const jsDate = new Date(2025, 0, 15); // Month is 0-indexed in JS
      const plainDate = dateToPlainDate(jsDate);

      expect(plainDate.year).toBe(2025);
      expect(plainDate.month).toBe(1); // PlainDate months are 1-indexed
      expect(plainDate.day).toBe(15);
    });
  });

  describe("dateRangeToPlainDateRange", () => {
    test("converts DateRange to PlainDate range", () => {
      const dateRange = {
        from: new Date(2025, 0, 1),
        to: new Date(2025, 5, 30),
      };

      const plainDateRange = dateRangeToPlainDateRange(dateRange);
      expect(plainDateRange).not.toBeNull();
      expect(plainDateRange?.from.toString()).toBe("2025-01-01");
      expect(plainDateRange?.to.toString()).toBe("2025-06-30");
    });

    test("returns null for incomplete DateRange", () => {
      const dateRange = { from: new Date(2025, 0, 1), to: undefined };
      expect(dateRangeToPlainDateRange(dateRange)).toBeNull();
    });
  });

  describe("plainDateRangeToDateRange", () => {
    test("converts PlainDate range to DateRange", () => {
      const plainDateRange = {
        from: Temporal.PlainDate.from({ year: 2025, month: 1, day: 1 }),
        to: Temporal.PlainDate.from({ year: 2025, month: 6, day: 30 }),
      };

      const dateRange = plainDateRangeToDateRange(plainDateRange);
      expect(dateRange.from?.getFullYear()).toBe(2025);
      expect(dateRange.from?.getMonth()).toBe(0); // JS months are 0-indexed
      expect(dateRange.from?.getDate()).toBe(1);

      expect(dateRange.to?.getFullYear()).toBe(2025);
      expect(dateRange.to?.getMonth()).toBe(5); // JS months are 0-indexed
      expect(dateRange.to?.getDate()).toBe(30);
    });
  });
});

describe("Edge cases and boundary conditions", () => {
  test("handles leap year edge cases", () => {
    // Test Feb 29 in leap year
    const leapYear = plainDateFromString("2024-02-29");
    expect(leapYear).not.toBeNull();

    // Test Feb 28 in non-leap year
    const nonLeapYear = plainDateFromString("2023-02-28");
    expect(nonLeapYear).not.toBeNull();
  });

  test("handles month boundaries correctly", () => {
    // Test end of January to end of February
    const jan31 = Temporal.PlainDate.from({ year: 2025, month: 1, day: 31 });
    const feb28 = Temporal.PlainDate.from({ year: 2025, month: 2, day: 28 });

    expect(countMonthsInRange(jan31, feb28)).toBe(2);
  });

  test("handles year boundaries correctly", () => {
    // Test December to January across year boundary
    const dec31 = Temporal.PlainDate.from({ year: 2024, month: 12, day: 31 });
    const jan1 = Temporal.PlainDate.from({ year: 2025, month: 1, day: 1 });

    expect(countMonthsInRange(dec31, jan1)).toBe(2);
  });
});
