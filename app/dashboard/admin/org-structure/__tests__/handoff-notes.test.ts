import { describe, it, expect } from "vitest";

export interface OfficerHandoffNote {
  id: string;
  position_key: string;
  author_id: string;
  content: string;
  key_contacts?: string | null;
  created_at: string;
}

export function filterHandoffNotesByPosition(
  notes: OfficerHandoffNote[],
  positionKey: string
): OfficerHandoffNote[] {
  return notes
    .filter((n) => n.position_key === positionKey)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

describe("Officer Handoff Notes Filtering & Continuity", () => {
  const notes: OfficerHandoffNote[] = [
    {
      id: "note-1",
      position_key: "president",
      author_id: "user-1",
      content: "Presidential transition notes: Maintain weekly executive syncs.",
      key_contacts: "vp@cit.edu, dean@cit.edu",
      created_at: "2026-06-25T10:00:00Z",
    },
    {
      id: "note-2",
      position_key: "academic_head",
      author_id: "user-2",
      content: "Academic Committee handoff: PLC tutor clock-ins must be audited monthly.",
      key_contacts: "plc@cit.edu",
      created_at: "2026-06-26T12:00:00Z",
    },
    {
      id: "note-3",
      position_key: "president",
      author_id: "user-3",
      content: "Newer presidential note.",
      created_at: "2026-07-01T09:00:00Z",
    },
  ];

  it("filters notes matching the requested position_key", () => {
    const presNotes = filterHandoffNotesByPosition(notes, "president");
    expect(presNotes).toHaveLength(2);
    expect(presNotes.every((n) => n.position_key === "president")).toBe(true);
  });

  it("orders notes descending by created_at date", () => {
    const presNotes = filterHandoffNotesByPosition(notes, "president");
    expect(presNotes[0].id).toBe("note-3");
    expect(presNotes[1].id).toBe("note-1");
  });

  it("returns empty array for positions without handoff notes", () => {
    const emptyNotes = filterHandoffNotesByPosition(notes, "treasurer");
    expect(emptyNotes).toHaveLength(0);
  });
});
