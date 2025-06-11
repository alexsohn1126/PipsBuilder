import { useState, useEffect, useCallback } from 'react';
import { CreatePuzzle } from './Util';
import {
  DndContext,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import type { PuzzleGridCell } from "./Util";

type Domino = {
  id: string;
  values: [number, number];
  x: number;
  y: number;
  rotation: number;
  placed: boolean;
};

type SlotDirection = "vert" | "hori";

// cell size in pixels
const CellSize = 50;

class Slot{
  id: string;
  between: [PuzzleGridCell, PuzzleGridCell];
  occupied: boolean;
  x: number;
  y: number;

  constructor(id: string, between: [PuzzleGridCell, PuzzleGridCell]) {
    this.id = id;
    this.between = between;
    this.occupied = false;
    this.x = CellSize * this.between[1].x;
    this.y = CellSize * this.between[1].y;
  }

  getSlotDirection(): SlotDirection {
    return this.between[0].x == this.between[1].x ? "hori" : "vert";
  }
}

function getSlots(cells: PuzzleGridCell[]): Slot[] {
  const cellMap = new Map<string, PuzzleGridCell>();
  for (const cell of cells) {
    cellMap.set(`${cell.x},${cell.y}`, cell);
  }

  const slots: Slot[] = [];
  const neighborDirections = [
    { dx: 1, dy: 0 },  // Right neighbor
    { dx: 0, dy: 1 },  // Bottom neighbor
  ];

  for (const cell of cells) {
    for (const {dx, dy} of neighborDirections) {
      const neighborKey = `${cell.x + dx},${cell.y + dy}`;
      if (cellMap.has(neighborKey)) {
        const neighbor = cellMap.get(neighborKey)!;
        const currSlot = new Slot(
          `${cell.x},${cell.y}_${neighbor.x},${neighbor.y}`,
          [cell, neighbor]
        );

        slots.push(currSlot);
      }
    }
  }

  return slots;
}


const initialDominoes: Domino[] = [
  { id: 'd1', values: [3, 6], x: 50, y: 50, rotation: 0, placed: false },
  { id: 'd2', values: [2, 5], x: 50, y: 150, rotation: 0, placed: false },
  { id: 'd3', values: [0, 1], x: 50, y: 250, rotation: 0, placed: false },
];

const Cells: PuzzleGridCell[] = CreatePuzzle();
const gridCols = Math.max(...Cells.map(c => c.x)) + 1;
const gridRows = Math.max(...Cells.map(c => c.y)) + 1;

export default function Home() {
  const [dominoes, setDominoes] = useState<Domino[]>(initialDominoes);
  const [slots] = useState<Slot[]>(getSlots(Cells));

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const matchedSlot = slots.find(slot => slot.id === over.id);
    if (!matchedSlot) return;

    // Check if slot is already occupied
    const isSlotOccupied = dominoes.some(
      d => d.placed && d.x === matchedSlot.x && d.y === matchedSlot.y
    );
    
    if (isSlotOccupied) {
      console.log('This slot is already occupied!');
      return;
    }

    console.log('Domino placed!');
  }, [dominoes]);

  const handleRotate = useCallback((id: string) => {
    setDominoes(prev => 
      prev.map(d => 
        d.id === id 
          ? { ...d, rotation: (d.rotation + 90) % 180 } 
          : d
      )
    );
  }, []);

  const handleReset = () => {
    setDominoes(initialDominoes);
    console.log('Game reset. Drag dominoes to the grid.');
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <DndContext onDragEnd={handleDragEnd}>
          {/* Cells */}
          <div className='flex justify-center'>
            <CellsGrid slots={slots} />
          </div>

          {/* Dominoes */}
          {dominoes.map((domino) => (
            <DraggableDomino 
              key={domino.id} 
              domino={domino} 
              onRotate={handleRotate} 
            />
          ))}
        </DndContext>
      </div>
    </div>
  );
}

function CellsGrid({ slots }: { slots: Slot[] }){
  return <div className={`inline-grid grid-cols-${gridCols} grid-rows-${gridRows} gap-0`}>
    {Cells.map(c => (
      <Cell cell={c} key={`${c.x},${c.y}`} />
    ))}

    {slots.map((slot) => (
      <DroppableSlot key={slot.id} slot={slot}>
        <p></p>
      </DroppableSlot>
    ))}
  </div>;
}

function Cell({ cell }: { cell: PuzzleGridCell}) {
  const cellStyle = {
    gridColumn: cell.x + 1,
    gridRow: cell.y + 1,
    width: `${CellSize}px`,
    height: `${CellSize}px`,
  };
  return <div className='bg-slate-500 rounded-lg' style={cellStyle}/>;
}

function DroppableSlot({ slot, children }: { slot: Slot; children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id: slot.id });

  let slotStyle = {
    gridColumnStart: slot.between[0].x + 1,
    gridColumnEnd: slot.between[1].x + 1,
    gridRowStart: slot.between[0].y + 1,
    gridRowEnd: slot.between[1].y + 1,
  };

  if (slot.getSlotDirection() == "vert") {
    slotStyle.gridColumnEnd++;
  } else {
    slotStyle.gridRowEnd++;
  }

  return (
    <div
      ref={setNodeRef}
      style={slotStyle}
    >
      {children}
    </div>
  );
}

function DraggableDomino({ 
  domino, 
  onRotate 
}: { 
  domino: Domino; 
  onRotate: (id: string) => void; 
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: domino.id,
  });

  const handleDoubleClick = () => {
    onRotate(domino.id);
  };

  const dominoStyle = {
    transform: transform
      ? `translate3d(${transform.x + domino.x}px, ${transform.y + domino.y}px, 0) rotate(${domino.rotation}deg)`
      : `translate3d(${domino.x}px, ${domino.y}px, 0) rotate(${domino.rotation}deg)`,
    position: 'absolute' as const,
    width: '100px',
    height: '50px',
    zIndex: transform ? 10 : 1,
    cursor: 'grab',
  };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onDoubleClick={handleDoubleClick}
      className={`bg-white border-2 border-slate-700 flex items-center justify-center 
                 select-none rounded-lg shadow-md`}
      style={dominoStyle}
    >
      <div className="w-full h-full flex">
        <div className="w-1/2 h-full flex items-center justify-center bg-slate-300 text-white font-bold text-xl rounded-l">
          {domino.values[0]}
        </div>
        <div className="w-1/2 h-full flex items-center justify-center bg-slate-500 text-white font-bold text-xl rounded-r">
          {domino.values[1]}
        </div>
      </div>
    </div>
  );
}
