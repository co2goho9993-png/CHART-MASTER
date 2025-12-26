
import React, { forwardRef, useMemo } from 'react';
import { LayoutBlock } from '../types';
import { GRID_COLUMNS, GRID_ROWS, A3_WIDTH_RATIO, CANVAS_WIDTH, COL_WIDTH } from '../constants';
import BlockRenderer from './BlockRenderer';

interface CanvasProps {
  blocks: LayoutBlock[];
  selectedBlockId: string | null;
  showGrid: boolean;
  isExporting: boolean;
  onSelectBlock: (id: string | null) => void;
  onUpdateBlock: (id: string, updates: Partial<LayoutBlock>) => void;
}

const Canvas = forwardRef<HTMLDivElement, CanvasProps>(({ 
  blocks, 
  selectedBlockId, 
  showGrid, 
  isExporting,
  onSelectBlock, 
  onUpdateBlock 
}, ref) => {
  const canvasHeight = CANVAS_WIDTH / A3_WIDTH_RATIO; 
  const rowHeight = (canvasHeight - 80) / GRID_ROWS;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).id === 'a3-canvas') {
      onSelectBlock(null);
    }
  };

  const gridOverlay = useMemo(() => {
    if (!showGrid) return null;
    return (
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="grid grid-cols-12 h-full w-full">
          {Array.from({ length: GRID_COLUMNS }).map((_, i) => (
            <div key={i} className="border-r border-blue-500/20 h-full" />
          ))}
        </div>
        <div className="absolute inset-0 grid grid-rows-12 h-full w-full">
          {Array.from({ length: GRID_ROWS }).map((_, i) => (
            <div key={i} className="border-b border-blue-500/20 w-full" />
          ))}
        </div>
      </div>
    );
  }, [showGrid]);

  return (
    <div className="relative bg-transparent p-0 flex justify-center items-center select-none" onMouseDown={handleMouseDown}>
      <div 
        ref={ref}
        id="a3-canvas"
        style={{ 
          width: CANVAS_WIDTH, 
          height: canvasHeight, 
          background: 'white',
          padding: '40px'
        }}
        className={`relative overflow-hidden transition-all border border-slate-200 ${isExporting ? 'shadow-none' : 'shadow-2xl'}`}
      >
        <div className="relative w-full h-full">
          {gridOverlay}

          {blocks.map(block => (
            <BlockRenderer 
              key={block.id}
              block={block}
              isSelected={selectedBlockId === block.id}
              isExporting={isExporting}
              colWidth={COL_WIDTH}
              rowHeight={rowHeight}
              onSelect={() => onSelectBlock(block.id)}
              onMove={(newX, newY) => {
                const snappedX = Math.max(0, Math.min(GRID_COLUMNS - block.w, Math.round(newX / COL_WIDTH)));
                const snappedY = Math.max(0, Math.min(GRID_ROWS - Math.round(block.h / rowHeight), Math.round(newY / rowHeight)));
                onUpdateBlock(block.id, { x: snappedX, y: snappedY * rowHeight });
              }}
              onResize={(newW, newH) => {
                const snappedW = Math.max(1, Math.min(GRID_COLUMNS - block.x, Math.round(newW / COL_WIDTH)));
                const snappedH = Math.max(1, Math.min(GRID_ROWS - Math.round(block.y / rowHeight), Math.round(newH / rowHeight)));
                onUpdateBlock(block.id, { w: snappedW, h: snappedH * rowHeight });
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

Canvas.displayName = 'Canvas';

export default Canvas;
