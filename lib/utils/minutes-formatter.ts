/**
 * Utility for formatting General Assembly and Executive Board meeting minutes into markdown & HTML templates.
 */

export interface MeetingMinutesData {
  title: string;
  date: string;
  presidingOfficer: string;
  attendeesCount: number;
  agendaItems: string[];
  resolutions: string[];
}

export function formatMeetingMinutesMarkdown(data: MeetingMinutesData): string {
  const agendaList = data.agendaItems.map((item, idx) => `${idx + 1}. ${item}`).join("\n");
  const resolutionList = data.resolutions.map((res, idx) => `* **Resolution #${idx + 1}**: ${res}`).join("\n");

  return `# ${data.title}
**Date**: ${data.date}  
**Presiding Officer**: ${data.presidingOfficer}  
**Official Attendance**: ${data.attendeesCount} Members Present  

---

## 📌 Meeting Agenda
${agendaList}

---

## 📜 Passed Resolutions & Actions
${resolutionList}

---
*Certified Official Minutes — Secretariat Office*
`;
}
