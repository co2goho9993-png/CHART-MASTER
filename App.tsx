
import React, { useState, useRef, useLayoutEffect } from 'react';
import { 
  ChartBarIcon, 
  ChartPieIcon,
  DocumentTextIcon,
  PresentationChartLineIcon,
  PresentationChartBarIcon,
  Square3Stack3DIcon,
  TableCellsIcon,
  ViewColumnsIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  Bars3BottomLeftIcon
} from '@heroicons/react/24/outline';
import { BlockType, ChartType, LayoutBlock, AppState } from './types';
import { BLOCK_DEFAULTS, GRID_COLUMNS, GRID_ROWS, CANVAS_WIDTH, A3_WIDTH_RATIO, COL_WIDTH } from './constants';
import Canvas from './components/Canvas';
import Inspector from './components/Inspector';
import { v4 as uuidv4 } from 'uuid';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    blocks: [],
    selectedBlockId: null,
    showGrid: true,
  });

  const [scale, setScale] = useState(1);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canvasHeight = CANVAS_WIDTH / A3_WIDTH_RATIO;
  const rowHeight = (canvasHeight - 80) / GRID_ROWS;

  useLayoutEffect(() => {
    const updateScale = () => {
      if (workspaceRef.current) {
        const { width, height } = workspaceRef.current.getBoundingClientRect();
        const padding = 60;
        const scaleW = (width - padding) / CANVAS_WIDTH;
        const scaleH = (height - padding) / canvasHeight;
        setScale(Math.min(scaleW, scaleH, 1));
      }
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [canvasHeight]);

  const addBlock = (type: BlockType, chartType?: ChartType) => {
    const defaults = BLOCK_DEFAULTS[type];
    const chartId = uuidv4();
    const hUnits = (defaults as any).h_units || 1;
    const w = (defaults as any).w || 6;

    const checkOverlap = (x: number, yUnits: number, w: number, hU: number, blocks: LayoutBlock[]) => {
      return blocks.some(b => {
        const bYUnits = Math.round(b.y / rowHeight);
        const bHUnits = Math.round(b.h / rowHeight);
        return (x < b.x + b.w) && (x + w > b.x) && (yUnits < bYUnits + bHUnits) && (yUnits + hU > bYUnits);
      });
    };

    let foundX = 0, foundYUnits = 0, placed = false;
    for (let r = 0; r <= GRID_ROWS - hUnits; r++) {
      for (let c = 0; c <= GRID_COLUMNS - w; c++) {
        if (!checkOverlap(c, r, w, hUnits, state.blocks)) {
          foundX = c; foundYUnits = r; placed = true; break;
        }
      }
      if (placed) break;
    }

    // Если место не найдено, ставим в начало или со смещением, чтобы не блокировать создание
    if (!placed) {
      foundYUnits = state.blocks.length % GRID_ROWS;
    }

    const newBlock: LayoutBlock = {
      id: chartId, type, chartType, x: foundX, y: foundYUnits * rowHeight, w, h: hUnits * rowHeight,
      title: (defaults as any).title, content: (defaults as any).content, fontSize: (defaults as any).fontSize,
      data: (defaults as any).data ? JSON.parse(JSON.stringify((defaults as any).data)) : undefined,
    };

    let additionalBlocks: LayoutBlock[] = [];
    if (type === BlockType.CHART) {
      const legendId = uuidv4();
      const legendBlock: LayoutBlock = {
        id: legendId, 
        type: BlockType.LEGEND, 
        x: foundX, 
        y: (foundYUnits + hUnits) * rowHeight, 
        w, 
        h: rowHeight,
        legendDirection: 'horizontal', 
        data: JSON.parse(JSON.stringify(newBlock.data || [])), 
        linkedBlockId: chartId
      };
      
      // Создаем легенду всегда для чартов, даже если она перекрывает другие блоки,
      // чтобы пользователь видел ее и мог передвинуть.
      newBlock.linkedBlockId = legendId;
      additionalBlocks.push(legendBlock);
    }

    setState(prev => ({ ...prev, blocks: [...prev.blocks, newBlock, ...additionalBlocks], selectedBlockId: chartId }));
  };

  const updateBlock = (id: string, updates: Partial<LayoutBlock>) => {
    setState(prev => {
      let updatedBlocks = prev.blocks.map(b => b.id === id ? { ...b, ...updates } : b);
      const target = updatedBlocks.find(b => b.id === id);
      if (target && (updates.data || updates.title) && target.linkedBlockId) {
        updatedBlocks = updatedBlocks.map(b => b.id === target.linkedBlockId ? { ...b, data: updates.data || b.data } : b);
      }
      return { ...prev, blocks: updatedBlocks };
    });
  };

  const handleSaveProject = () => {
    const projectData = JSON.stringify(state.blocks);
    const blob = new Blob([projectData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `A3_Project_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleLoadProject = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const blocks = JSON.parse(e.target?.result as string);
        setState(prev => ({ ...prev, blocks, selectedBlockId: null }));
      } catch (err) {
        alert("Ошибка при чтении файла проекта.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExportSVG = () => {
    const svgNS = "http://www.w3.org/2000/svg";
    const mainSvg = document.createElementNS(svgNS, "svg");
    mainSvg.setAttribute("width", "1400");
    mainSvg.setAttribute("height", canvasHeight.toString());
    mainSvg.setAttribute("viewBox", `0 0 1400 ${canvasHeight}`);
    mainSvg.setAttribute("xmlns", svgNS);

    const defs = document.createElementNS(svgNS, "defs");
    const style = document.createElementNS(svgNS, "style");
    style.textContent = `@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&display=swap'); * { font-family: 'Montserrat', sans-serif !important; }`;
    defs.appendChild(style);
    mainSvg.appendChild(defs);

    const bg = document.createElementNS(svgNS, "rect");
    bg.setAttribute("width", "1400");
    bg.setAttribute("height", canvasHeight.toString());
    bg.setAttribute("fill", "#ffffff");
    mainSvg.appendChild(bg);

    state.blocks.forEach(block => {
      const blockWidth = block.w * COL_WIDTH;
      const x = block.x * COL_WIDTH + 40;
      const y = block.y + 40;
      
      const isHeader = block.type === BlockType.TITLE || block.type === BlockType.SUBTITLE;
      const PADDING = isHeader ? 0 : 16;

      const g = document.createElementNS(svgNS, "g");
      g.setAttribute("transform", `translate(${x}, ${y})`);
      mainSvg.appendChild(g);

      if (block.type === BlockType.CHART) {
        if (block.title) {
          const chartTitle = document.createElementNS(svgNS, "text");
          chartTitle.setAttribute("x", "0");
          chartTitle.setAttribute("y", "26");
          chartTitle.setAttribute("fill", "#1e293b");
          chartTitle.setAttribute("font-size", "26");
          chartTitle.setAttribute("font-weight", "700");
          chartTitle.textContent = block.title;
          g.appendChild(chartTitle);

          const line = document.createElementNS(svgNS, "line");
          line.setAttribute("x1", "0");
          line.setAttribute("y1", "36");
          line.setAttribute("x2", "60");
          line.setAttribute("y2", "36");
          line.setAttribute("stroke", "#3B82F6");
          line.setAttribute("stroke-width", "4");
          g.appendChild(line);
        }

        if (canvasRef.current) {
          const container = canvasRef.current.querySelector(`[id="block-${block.id}"] .recharts-responsive-container`);
          const chartSvg = container?.querySelector('svg');
          if (chartSvg) {
            const chartGroup = document.createElementNS(svgNS, "g");
            chartGroup.setAttribute("transform", `translate(0, ${block.title ? 60 : 0})`);
            chartSvg.childNodes.forEach(node => {
              if (node.nodeName !== 'defs') chartGroup.appendChild(node.cloneNode(true));
            });
            g.appendChild(chartGroup);
          }
        }
      } else if (block.type === BlockType.TITLE || block.type === BlockType.SUBTITLE || block.type === BlockType.TEXT) {
        const fo = document.createElementNS(svgNS, "foreignObject");
        fo.setAttribute("width", blockWidth.toString());
        fo.setAttribute("height", block.h.toString());
        
        const div = document.createElement("div");
        div.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
        
        const fs = block.fontSize || (block.type === BlockType.TEXT ? 21 : 32);
        const fw = block.type === BlockType.TITLE ? "900" : (block.type === BlockType.SUBTITLE ? "600" : "400");
        const color = block.type === BlockType.SUBTITLE ? "#94a3b8" : (block.type === BlockType.TEXT ? "#475569" : "#1e293b");
        
        div.style.cssText = `font-family: Montserrat, sans-serif; font-size: ${fs}px; font-weight: ${fw}; color: ${color}; line-height: 1.15; padding: 0; padding-left: ${PADDING}px; padding-right: ${PADDING}px; margin: 0; word-break: break-word; overflow: visible;`;
        div.innerText = block.type === BlockType.TEXT ? (block.content || "") : (block.title || "");
        fo.appendChild(div);
        g.appendChild(fo);
      } else if (block.type === BlockType.LEGEND) {
        const fo = document.createElementNS(svgNS, "foreignObject");
        fo.setAttribute("width", blockWidth.toString());
        fo.setAttribute("height", block.h.toString());
        
        const isVertical = block.legendDirection === 'vertical';
        const container = document.createElement("div");
        container.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
        container.style.cssText = `display: flex; flex-direction: ${isVertical ? 'column' : 'row'}; flex-wrap: wrap; gap: ${isVertical ? '8px' : '8px 40px'}; padding: 8px 0; font-family: Montserrat, sans-serif; overflow: visible; align-items: flex-start;`;

        block.data?.forEach(d => {
          const item = document.createElement("div");
          item.style.cssText = `display: flex; align-items: center; gap: 10px;`;
          const dot = document.createElement("div");
          dot.style.cssText = `width: 18px; height: 18px; border-radius: 50%; background-color: ${d.color || "#3B82F6"}; flex-shrink: 0;`;
          const label = document.createElement("span");
          label.style.cssText = `font-size: 18px; font-weight: 500; color: #1e293b;`;
          label.innerText = d.name;
          item.appendChild(dot);
          item.appendChild(label);
          container.appendChild(item);
        });

        fo.appendChild(container);
        g.appendChild(fo);
      }
    });

    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(mainSvg);
    const blob = new Blob(['<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' + svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'A3_Export_Final.svg';
    link.click();
  };

  const handleDeleteBlock = () => {
    if (!state.selectedBlockId) return;
    
    setState(prev => {
      const blockToDelete = prev.blocks.find(b => b.id === state.selectedBlockId);
      if (!blockToDelete) return prev;

      let updatedBlocks = prev.blocks.filter(b => b.id !== state.selectedBlockId);
      
      // Если у блока есть приликованный блок (легенда или график), удаляем и его
      if (blockToDelete.linkedBlockId) {
        updatedBlocks = updatedBlocks.filter(b => b.id !== blockToDelete.linkedBlockId);
      }
      
      // Также проверяем, не ссылается ли какой-то другой блок на этот как на связанный
      updatedBlocks = updatedBlocks.filter(b => b.linkedBlockId !== state.selectedBlockId);

      return { 
        ...prev, 
        blocks: updatedBlocks, 
        selectedBlockId: null 
      };
    });
  };

  return (
    <div className="flex h-screen w-full bg-[#11111b] overflow-hidden font-['Montserrat'] text-slate-200">
      <aside className="w-16 bg-[#181825] border-r border-slate-800 flex flex-col items-center py-6 gap-6 z-20">
        <div className="p-2 bg-blue-600 rounded-lg text-white mb-4 shadow-lg shadow-blue-500/20"><Square3Stack3DIcon className="w-6 h-6" /></div>
        <div className="flex flex-col gap-4">
          <IconButton icon={<ChartBarIcon className="w-6 h-6" />} onClick={() => addBlock(BlockType.CHART, ChartType.BAR)} tooltip="Гистограмма" />
          <IconButton icon={<Bars3BottomLeftIcon className="w-6 h-6" />} onClick={() => addBlock(BlockType.CHART, ChartType.HORIZONTAL_BAR)} tooltip="Гор. Гистограмма" />
          <IconButton icon={<PresentationChartLineIcon className="w-6 h-6" />} onClick={() => addBlock(BlockType.CHART, ChartType.LINE)} tooltip="График" />
          <IconButton icon={<PresentationChartBarIcon className="w-6 h-6" />} onClick={() => addBlock(BlockType.CHART, ChartType.AREA)} tooltip="Области" />
          <IconButton icon={<ChartPieIcon className="w-6 h-6" />} onClick={() => addBlock(BlockType.CHART, ChartType.PIE)} tooltip="Пирог" />
        </div>
        <div className="w-8 h-[1px] bg-slate-800" />
        <IconButton icon={<TableCellsIcon className="w-6 h-6" />} onClick={() => addBlock(BlockType.TITLE)} tooltip="Заголовок" />
        <IconButton icon={<ViewColumnsIcon className="w-6 h-6" />} onClick={() => addBlock(BlockType.SUBTITLE)} tooltip="Подзаголовок" />
        <IconButton icon={<DocumentTextIcon className="w-6 h-6" />} onClick={() => addBlock(BlockType.TEXT)} tooltip="Текст" />
      </aside>

      <main className="flex-1 flex flex-col relative overflow-hidden bg-[#0d0d14]" onMouseDown={() => setState(p => ({...p, selectedBlockId: null}))}>
        <header className="h-14 bg-[#181825] border-b border-slate-800 flex items-center justify-between px-8 z-10" onMouseDown={e => e.stopPropagation()}>
          <h1 className="font-bold text-slate-100 text-[10px] uppercase tracking-[0.5em]">ЧАРТ-<span className="text-blue-500">МАСТЕР</span></h1>
          <div className="flex items-center gap-4">
            <button onClick={() => setState(p => ({ ...p, showGrid: !p.showGrid }))} className={`text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded transition-all ${state.showGrid ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/10' : 'bg-slate-800 text-slate-500'}`}>Сетка: {state.showGrid ? 'ВКЛ' : 'ВЫКЛ'}</button>
            <div className="w-[1px] h-6 bg-slate-800" />
            <div className="flex gap-2">
              <button onClick={handleSaveProject} className="p-2 text-slate-400 hover:text-white transition-colors" title="Сохранить проект">
                <ArrowDownTrayIcon className="w-5 h-5" />
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-400 hover:text-white transition-colors" title="Загрузить проект">
                <ArrowUpTrayIcon className="w-5 h-5" />
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleLoadProject} />
              <button onClick={handleExportSVG} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-500 transition-all text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95">SVG ЭКСПОРТ</button>
            </div>
          </div>
        </header>

        <div ref={workspaceRef} className="flex-1 relative flex items-center justify-center overflow-hidden">
          <div style={{ transform: `scale(${scale})`, transformOrigin: 'center' }} className="transition-transform duration-300 ease-out">
            <Canvas ref={canvasRef} blocks={state.blocks} selectedBlockId={state.selectedBlockId} showGrid={state.showGrid} isExporting={false} onSelectBlock={(id) => setState(p => ({ ...p, selectedBlockId: id }))} onUpdateBlock={updateBlock} />
          </div>
        </div>
      </main>

      <aside className="w-80 bg-[#181825] border-l border-slate-800 flex flex-col z-20 shadow-2xl" onMouseDown={e => e.stopPropagation()}>
        <Inspector 
          selectedBlock={state.blocks.find(b => b.id === state.selectedBlockId) || null} 
          onUpdate={(updates) => state.selectedBlockId && updateBlock(state.selectedBlockId, updates)} 
          onDelete={handleDeleteBlock} 
        />
      </aside>
    </div>
  );
};

const IconButton: React.FC<{ icon: React.ReactNode, onClick: () => void, tooltip: string }> = ({ icon, onClick, tooltip }) => (
  <button onClick={e => { e.stopPropagation(); onClick(); }} className="group relative p-3 text-slate-500 hover:text-blue-500 hover:bg-[#1e1e2e] rounded-xl transition-all" title={tooltip}>
    {icon}
    <span className="absolute left-16 bg-slate-900 border border-slate-700 text-white text-[9px] px-3 py-2 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-all whitespace-nowrap z-50 shadow-2xl uppercase tracking-widest border-l-2 border-l-blue-500">{tooltip}</span>
  </button>
);

export default App;
