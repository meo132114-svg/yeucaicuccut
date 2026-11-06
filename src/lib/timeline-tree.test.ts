import { describe, expect, it } from "vitest";
import {
  getRootTimelineStages,
  getRootTimelineStageId,
  type TimelineFolder,
} from "./timeline-tree";

const folder = (id: string, parent_id: string | null, sort_order: number): TimelineFolder => ({
  id,
  parent_id,
  name: id,
  description: "",
  image_url: null,
  sort_order,
  created_at: "2025-01-01T00:00:00.000Z",
  updated_at: "2025-01-01T00:00:00.000Z",
});

describe("getRootTimelineStages", () => {
  it("returns only top-level folders ordered by sort_order", () => {
    const stages = getRootTimelineStages([
      folder("child", "stage-b", 0),
      folder("stage-b", null, 2),
      folder("stage-a", null, 1),
    ]);

    expect(stages.map((stage) => stage.id)).toEqual(["stage-a", "stage-b"]);
  });
});

describe("getRootTimelineStageId", () => {
  it("returns the top-level ancestor for nested content", () => {
    const folders = [
      folder("stage", null, 0),
      folder("nested", "stage", 0),
      folder("deep", "nested", 0),
    ];

    expect(getRootTimelineStageId(folders, "deep")).toBe("stage");
    expect(getRootTimelineStageId(folders, null)).toBeNull();
  });
});
