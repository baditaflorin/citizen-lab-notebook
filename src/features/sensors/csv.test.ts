import { describe, expect, it } from "vitest";
import { createSampleReadings, parseSensorCsv, readingsToCsv } from "./csv";

describe("parseSensorCsv", () => {
  it("parses headered CSV readings", () => {
    const readings = parseSensorCsv("time,value,unit,label\n0,1.2,C,temp\n60,2.4,C,temp");

    expect(readings).toHaveLength(2);
    expect(readings[1]).toMatchObject({ time: 60, value: 2.4, unit: "C", label: "temp" });
  });

  it("ignores invalid rows", () => {
    expect(parseSensorCsv("time,value\nnope,1\n2,3")).toHaveLength(1);
  });
});

describe("readingsToCsv", () => {
  it("serializes readings with a stable header", () => {
    expect(readingsToCsv(createSampleReadings()).split("\n")[0]).toBe("time,value,unit,label");
  });
});
