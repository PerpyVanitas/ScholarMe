/**
 * Utility for exporting flashcard study sets into Anki CSV and structured JSON formats.
 */

export interface FlashcardItem {
  front: string;
  back: string;
  tags?: string[];
}

export function exportFlashcardsToAnkiCsv(cards: FlashcardItem[]): string {
  const header = "#separator:Tab\n#html:true\n#tags column:3\n";
  const rows = cards.map((card) => {
    const cleanFront = card.front.replace(/\t/g, " ");
    const cleanBack = card.back.replace(/\t/g, " ");
    const tagList = card.tags ? card.tags.join(" ") : "scholarme";
    return `${cleanFront}\t${cleanBack}\t${tagList}`;
  });

  return header + rows.join("\n");
}
