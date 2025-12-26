
import React from 'react';
import { LayoutBlock, BlockType, ChartDataPoint, ChartType, SeriesConfig } from '../types';
import { TrashIcon, PlusIcon, XMarkIcon, ArrowsUpDownIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline';
import { COLOR_PRESETS } from '../constants';

interface InspectorProps {
  selectedBlock: LayoutBlock | null;
  onUpdate: (updates: Partial<LayoutBlock>) => void;
  onDelete: () => void;
}

const Inspector: React.FC<InspectorProps> = ({ selectedBlock, onUpdate, onDelete }) => {
  if (!selectedBlock) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-slate-500 text-center italic">
        <p className="mb-2 font-medium">Объект не выбран</p>
        <p className="text-[10px] uppercase tracking-widest opacity-40">Кликните по блоку на холсте</p>
      </div>
    );
  }

  const handleDataChange = (index: number, field: string, value: any) => {
    const newData = [...(selectedBlock.data || [])];
    newData[index] = { ...newData[index], [field]: field.startsWith('value') ? parseFloat(value) : value };
    onUpdate({ data: newData });
  };

  const addDataPoint = () => {
    const newData = [...(selectedBlock.data || [])];
    const newPoint: any = { name: 'Новый пункт', value: 0, color: COLOR_PRESETS[0] };
    if (selectedBlock.seriesConfigs) {
      selectedBlock.seriesConfigs.forEach(s => {
        newPoint[s.key] = 0;
      });
    }
    newData.push(newPoint);
    onUpdate({ data: newData });
  };

  const addSeries = () => {
    const currentSeries = selectedBlock.seriesConfigs || [];
    const newKey = `value_${currentSeries.length + 1}`;
    const newSeries: SeriesConfig = {
      key: newKey,
      name: `Серия ${currentSeries.length + 1}`,
      color: COLOR_PRESETS[currentSeries.length % COLOR_PRESETS.length]
    };
    
    const updatedData = (selectedBlock.data || []).map(d => ({
      ...d,
      [newKey]: 0
    }));

    onUpdate({ 
      seriesConfigs: [...currentSeries, newSeries],
      data: updatedData
    });
  };

  const removeSeries = (key: string) => {
    const updatedConfigs = (selectedBlock.seriesConfigs || []).filter(s => s.key !== key);
    onUpdate({ seriesConfigs: updatedConfigs });
  };

  const inputStyle = "w-full px-3 py-2 bg-[#1e1e2e] border border-slate-700 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-500";

  const isChartBlock = selectedBlock.type === BlockType.CHART;
  const supportsMultiSeries = isChartBlock && 
    [ChartType.LINE, ChartType.AREA, ChartType.BAR, ChartType.HORIZONTAL_BAR].includes(selectedBlock.chartType!);

  return (
    <div className="p-6 text-slate-200">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">Редактор</h2>
        <button onClick={onDelete} className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all">
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-8 h-[calc(100vh-140px)] overflow-y-auto pr-2 scrollbar-hide">
        <section>
          <label className="block text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Название</label>
          <input 
            type="text" 
            value={selectedBlock.title || ''}
            onChange={(e) => onUpdate({ title: e.target.value })}
            className={inputStyle}
            placeholder="..."
          />
        </section>

        {(selectedBlock.type === BlockType.TITLE || selectedBlock.type === BlockType.SUBTITLE || selectedBlock.type === BlockType.TEXT) && (
          <section>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Размер шрифта: {selectedBlock.fontSize || 16}px</label>
            <input 
              type="range" 
              min="8" 
              max="120" 
              value={selectedBlock.fontSize || 16}
              onChange={(e) => onUpdate({ fontSize: parseInt(e.target.value) })}
              className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </section>
        )}

        {supportsMultiSeries && (
          <section className="bg-[#11111b] p-4 rounded-xl border border-slate-800">
             <div className="flex items-center justify-between mb-4">
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Серии данных</label>
                <button onClick={addSeries} className="text-[9px] font-black text-blue-400 border border-blue-400/30 px-2 py-1 rounded hover:bg-blue-400/10 transition-colors">ДОБАВИТЬ СЕРИЮ</button>
             </div>
             <div className="space-y-3">
               {(selectedBlock.seriesConfigs || []).map((s, idx) => (
                 <div key={s.key} className="flex items-center gap-2 bg-[#1e1e2e] p-2 rounded-lg">
                   <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                   <input 
                    className="bg-transparent border-none text-[11px] font-bold text-white focus:outline-none w-full"
                    value={s.name}
                    onChange={(e) => {
                      const newConfigs = [...(selectedBlock.seriesConfigs || [])];
                      newConfigs[idx].name = e.target.value;
                      onUpdate({ seriesConfigs: newConfigs });
                    }}
                   />
                   <button onClick={() => removeSeries(s.key)} className="text-slate-600 hover:text-red-500"><XMarkIcon className="w-3 h-3" /></button>
                 </div>
               ))}
               {(!selectedBlock.seriesConfigs || selectedBlock.seriesConfigs.length === 0) && (
                 <p className="text-[10px] text-slate-600 italic">Используется стандартная серия</p>
               )}
             </div>
          </section>
        )}

        {selectedBlock.type === BlockType.LEGEND && (
           <section>
             <label className="block text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Ориентация легенды</label>
             <div className="flex gap-2">
                <button 
                  onClick={() => onUpdate({ legendDirection: 'horizontal' })}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded border transition-all text-[10px] font-bold uppercase ${selectedBlock.legendDirection === 'horizontal' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#1e1e2e] border-slate-700 text-slate-400'}`}
                >
                  <ArrowsRightLeftIcon className="w-4 h-4" /> Гор.
                </button>
                <button 
                  onClick={() => onUpdate({ legendDirection: 'vertical' })}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded border transition-all text-[10px] font-bold uppercase ${selectedBlock.legendDirection === 'vertical' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#1e1e2e] border-slate-700 text-slate-400'}`}
                >
                  <ArrowsUpDownIcon className="w-4 h-4" /> Верт.
                </button>
             </div>
           </section>
        )}

        {selectedBlock.type === BlockType.TEXT && (
          <section>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Содержание</label>
            <textarea 
              value={selectedBlock.content || ''}
              onChange={(e) => onUpdate({ content: e.target.value })}
              className={`${inputStyle} h-32 resize-none`}
            />
          </section>
        )}

        {(selectedBlock.type === BlockType.CHART || selectedBlock.type === BlockType.LEGEND) && (
          <section>
             <div className="flex items-center justify-between mb-4">
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Данные</label>
                <button onClick={addDataPoint} className="text-[9px] font-black text-blue-500 bg-blue-500/10 px-2 py-1 rounded">ДОБАВИТЬ ПУНКТ</button>
             </div>
             <div className="space-y-4 pb-10">
               {selectedBlock.data?.map((point, i) => (
                 <div key={i} className="flex flex-col gap-2 p-3 bg-[#11111b] rounded-lg border border-slate-800">
                   <div className="flex items-center gap-2">
                     <input 
                       type="text" 
                       value={point.name}
                       onChange={(e) => handleDataChange(i, 'name', e.target.value)}
                       className="flex-1 px-2 py-1 bg-[#1e1e2e] border border-slate-700 rounded text-[11px] text-white focus:outline-none"
                     />
                     <button onClick={() => {
                        const newData = (selectedBlock.data || []).filter((_, idx) => idx !== i);
                        onUpdate({ data: newData });
                     }} className="text-slate-600 hover:text-red-500"><XMarkIcon className="w-3 h-3" /></button>
                   </div>
                   
                   {/* Рендерим поля ввода для каждой серии */}
                   {selectedBlock.seriesConfigs && selectedBlock.seriesConfigs.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {selectedBlock.seriesConfigs.map(s => (
                          <div key={s.key} className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                            <input 
                              type="number" 
                              value={point[s.key] || 0}
                              onChange={(e) => handleDataChange(i, s.key, e.target.value)}
                              className="w-full px-2 py-1 bg-[#1e1e2e] border border-slate-700 rounded text-[10px] text-white focus:outline-none"
                            />
                          </div>
                        ))}
                      </div>
                   ) : (
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        value={point.value}
                        onChange={(e) => handleDataChange(i, 'value', e.target.value)}
                        className="w-16 px-2 py-1 bg-[#1e1e2e] border border-slate-700 rounded text-[11px] text-white focus:outline-none"
                      />
                      <div className="flex-1 flex flex-wrap gap-1">
                        {COLOR_PRESETS.map(c => (
                          <button 
                            key={c} 
                            onClick={() => handleDataChange(i, 'color', c)}
                            style={{ backgroundColor: c }}
                            className={`w-4 h-4 rounded-full border-2 transition-transform ${point.color === c ? 'border-white scale-110' : 'border-transparent'}`}
                          />
                        ))}
                      </div>
                    </div>
                   )}
                 </div>
               ))}
             </div>
          </section>
        )}

        <section className="pt-6 border-t border-slate-800 flex justify-between sticky bottom-0 bg-[#181825]">
          <div>
            <label className="block text-[9px] font-black text-slate-600 uppercase mb-1">Сетка X</label>
            <span className="text-xs text-slate-400 font-bold">{selectedBlock.x + 1}</span>
          </div>
          <div>
            <label className="block text-[9px] font-black text-slate-600 uppercase mb-1">Ширина</label>
            <span className="text-xs text-slate-400 font-bold">{selectedBlock.w}</span>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Inspector;
