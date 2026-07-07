export type SM2Rating = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * SuperMemo-2 Algorithm Implementation
 *
 * Ratings:
 * 5 - Perfect response
 * 4 - Correct response after a hesitation
 * 3 - Correct response recalled with serious difficulty
 * 2 - Incorrect response; where the correct one seemed easy to recall
 * 1 - Incorrect response; the correct one remembered
 * 0 - Complete blackout.
 */
export function calculateSM2(
  quality: SM2Rating,
  repetitions: number,
  previousInterval: number,
  previousEaseFactor: number,
) {
  let easeFactor = previousEaseFactor;
  let interval = previousInterval;
  let nextRepetitions = repetitions;

  if (quality >= 3) {
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(previousInterval * previousEaseFactor);
    }
    nextRepetitions += 1;
  } else {
    nextRepetitions = 0;
    interval = 1;
  }

  easeFactor =
    previousEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;

  return {
    interval,
    easeFactor,
    repetitions: nextRepetitions,
  };
}
