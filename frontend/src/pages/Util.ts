export type PuzzleGridCell = { x: number, y: number, currNum: number | undefined };

// Initalize the puzzle grid
// TODO: Make this function to accept data to create puzzle
// instead of hardcoded puzzle
export function CreatePuzzle(): PuzzleGridCell[] {
  return [
    { x: 0, y: 0, currNum: undefined },
    { x: 1, y: 0, currNum: undefined },
    { x: 2, y: 0, currNum: undefined },
    { x: 0, y: 1, currNum: undefined },
    { x: 1, y: 1, currNum: undefined },
    { x: 2, y: 1, currNum: undefined },
  ];
}
