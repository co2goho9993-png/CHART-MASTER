
import React, { useState, useRef, useEffect } from 'react';
import { LayoutBlock, BlockType, ChartType, SeriesConfig } from '../types';
import { 
  BarChart, Bar, 
  LineChart, Line, 
  AreaChart, Area, 
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer, LabelList, Label
} from 'recharts';
import { COLORS } from '../constants';

interface BlockRendererProps {
  block: LayoutBlock;
  isSelected: boolean;
  isExporting: boolean;
  colWidth: number;
  rowHeight: number;
  onSelect: () => void;
  onMove: (x: number, y: number) => void;
  onResize: (w: number, h: number) => void;
}

const formatValue = (val: any) => {
  const num = typeof val === 'number' ? val : parseFloat(val);
  if (isNaN(num)) return '0';
  return num.toLocaleString('ru-RU').replace(/\u00A0/g, ' ');
};

const LEFT_FRAME_PADDING = 10;
const AXIS_STYLE = { 
  fontSize: '14px', 
  fontWeight: 700, 
  fill: '#94a3b8',
  fontFamily: 'Montserrat, sans-serif'
};

// Кастомный рендерер для меток оси Y, чтобы они всегда были прижаты к левому краю
const LeftAlignedTick = (props: any) => {
  const { x, y, payload, verticalAnchor, textAnchor, ...rest } = props;
  return (
    <text 
      x={LEFT_FRAME_PADDING} 
      y={y} 
      fill={AXIS_STYLE.fill}
      textAnchor="start"
      dominantBaseline="central"
      style={AXIS_STYLE}
    >
      {payload.value}
    </text>
  );
};

const BlockRenderer: React.FC<BlockRendererProps> = ({ 
  block, 
  isSelected, 
  isExporting,
  colWidth, 
  rowHeight,
  onSelect, 
  onMove, 
  onResize 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const startPos = useRef({ x: 0, y: 0 });
  const startSize = useRef({ w: 0, h: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
    setIsDragging(true);
    startPos.current = { x: e.clientX - (block.x * colWidth), y: e.clientY - block.y };
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    startSize.current = { w: block.w * colWidth, h: block.h };
    startPos.current = { x: e.clientX, y: e.clientY };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        onMove(e.clientX - startPos.current.x, e.clientY - startPos.current.y);
      } else if (isResizing) {
        const deltaW = e.clientX - startPos.current.x;
        const deltaH = e.clientY - startPos.current.y;
        onResize(startSize.current.w + deltaW, startSize.current.h + deltaH);
      }
    };
    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, onMove, onResize]);

  const isHeader = block.type === BlockType.TITLE || block.type === BlockType.SUBTITLE;
  const isChart = block.type === BlockType.CHART;
  
  const style: React.CSSProperties = {
    position: 'absolute',
    left: block.x * colWidth,
    top: block.y,
    width: block.w * colWidth,
    height: block.h,
    cursor: isDragging ? 'grabbing' : (isExporting ? 'default' : 'grab'),
    zIndex: isSelected ? 10 : 1,
    border: isSelected && !isExporting ? `2px solid ${COLORS.secondary}` : '2px solid transparent',
    padding: (isHeader || isChart) ? '0' : '0 16px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'Montserrat, sans-serif',
    overflow: 'visible'
  };

  const safeData = (block.data || []).filter(d => d && typeof d === 'object');
  const totalSum = safeData.reduce((acc, curr) => acc + (curr?.value || 0), 0);

  const series = block.seriesConfigs && block.seriesConfigs.length > 0 
    ? block.seriesConfigs 
    : [{ key: 'value', name: block.title || 'Серия 1', color: safeData[0]?.color || COLORS.secondary }];

  const CustomLabel = (props: any) => {
    const { x, y, width, value, index, seriesIndex, color } = props;
    if (index === undefined || !safeData[index]) return null;
    
    const labelX = x + (width || 0) / 2;
    const offset = (seriesIndex || 0) * 35;
    const textColor = color || (series.length === 1 ? series[0].color : '#475569');
    
    return (
      <text 
        x={labelX} 
        y={y - 12 - offset} 
        fill={textColor} 
        textAnchor="middle" 
        style={{ fontWeight: 800, fontSize: '24px', fontFamily: 'Montserrat, sans-serif' }}
      >
        {formatValue(value)}
      </text>
    );
  };

  const HorizontalValueLabel = (props: any) => {
    const { x, y, width, height, value, index, color } = props;
    if (index === undefined || !safeData[index]) return null;
    const textColor = color || (safeData[index]?.color || COLORS.secondary);
    return (
      <text 
        x={x + width + 14} 
        y={y + height / 2} 
        fill={textColor} 
        textAnchor="start" 
        dominantBaseline="central"
        style={{ fontWeight: 800, fontSize: '27px', fontFamily: 'Montserrat, sans-serif' }}
      >
        {formatValue(value)}
      </text>
    );
  };

  const renderChart = () => {
    const data = safeData;
    const hBarYWidth = 150; // Запас под названия групп
    const yAxisNumericWidth = 80; // Запас под числовые значения
    
    switch (block.chartType) {
      case ChartType.HORIZONTAL_BAR:
        return (
          <BarChart 
            layout="vertical" 
            data={data} 
            margin={{ top: 20, right: 150, left: 0, bottom: 40 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
            <XAxis 
              type="number" 
              axisLine={false} 
              tickLine={false} 
              tick={{...AXIS_STYLE, dy: 10}} 
              tickFormatter={formatValue}
              height={40}
              domain={[0, 'dataMax * 1.15']}
            />
            <YAxis 
              dataKey="name" 
              type="category" 
              axisLine={false} 
              tickLine={false} 
              width={hBarYWidth} 
              tick={<LeftAlignedTick />} 
            />
            {series.map((s) => (
              <Bar key={s.key} isAnimationActive={!isExporting} dataKey={s.key} radius={0} barSize={40} fill={s.color}>
                 {series.length === 1 && data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                 <LabelList content={<HorizontalValueLabel color={s.color} />} />
              </Bar>
            ))}
          </BarChart>
        );
      case ChartType.LINE:
        return (
          <LineChart data={data} margin={{ top: 80, right: 20, left: 0, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{...AXIS_STYLE}} dy={10} />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              width={yAxisNumericWidth}
              tick={<LeftAlignedTick />} 
              tickFormatter={formatValue} 
              domain={[0, 'dataMax * 1.2']}
            />
            {series.map((s, idx) => (
              <Line 
                key={s.key}
                isAnimationActive={!isExporting} 
                type="monotone" 
                dataKey={s.key} 
                stroke={s.color} 
                strokeWidth={8} 
                dot={{ r: 8, strokeWidth: 3, fill: s.color, stroke: '#fff' }}
                activeDot={{ r: 12, strokeWidth: 4, fill: s.color, stroke: '#fff' }}
              >
                <LabelList content={<CustomLabel seriesIndex={idx} color={s.color} />} />
              </Line>
            ))}
          </LineChart>
        );
      case ChartType.AREA:
        return (
          <AreaChart data={data} margin={{ top: 80, right: 20, left: 0, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{...AXIS_STYLE}} dy={10} />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              width={yAxisNumericWidth}
              tick={<LeftAlignedTick />} 
              tickFormatter={formatValue} 
              domain={[0, 'dataMax * 1.2']}
            />
            {series.map((s, idx) => (
              <Area 
                key={s.key}
                isAnimationActive={!isExporting} 
                type="monotone" 
                dataKey={s.key} 
                stroke={s.color} 
                fill={s.color} 
                fillOpacity={0.15} 
                strokeWidth={8}
                dot={{ r: 8, strokeWidth: 3, fill: s.color, stroke: '#fff' }}
                activeDot={{ r: 12, strokeWidth: 4, fill: s.color, stroke: '#fff' }}
              >
                <LabelList content={<CustomLabel seriesIndex={idx} color={s.color} />} />
              </Area>
            ))}
          </AreaChart>
        );
      case ChartType.PIE:
        return (
          <PieChart>
            <Pie 
              isAnimationActive={!isExporting} 
              data={data} 
              dataKey="value" 
              cx="50%" 
              cy="50%" 
              innerRadius="50%" 
              outerRadius="75%" 
              paddingAngle={4}
              label={({ cx, cy, midAngle, innerRadius, outerRadius, value, index }) => {
                const RADIAN = Math.PI / 180;
                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                const x = cx + (radius + 60) * Math.cos(-midAngle * RADIAN);
                const y = cy + (radius + 60) * Math.sin(-midAngle * RADIAN);
                const color = safeData[index]?.color || '#3B82F6';
                return (
                  <text x={x} y={y} fill={color} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" style={{ fontWeight: 800, fontSize: '24px', fontFamily: 'Montserrat, sans-serif' }}>
                    {formatValue(value)}
                  </text>
                );
              }}
              labelLine={{ stroke: '#cbd5e1', strokeWidth: 2 }}
            >
              {data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="#fff" strokeWidth={2} />)}
              <Label value={formatValue(totalSum)} position="center" style={{ fontSize: '42px', fontWeight: '900', fill: '#1e293b', fontFamily: 'Montserrat, sans-serif' }} />
            </Pie>
          </PieChart>
        );
      case ChartType.BAR:
      default:
        return (
          <BarChart data={data} margin={{ top: 80, right: 20, left: 0, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{...AXIS_STYLE}} dy={10} />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              width={yAxisNumericWidth}
              tick={<LeftAlignedTick />} 
              tickFormatter={formatValue} 
              domain={[0, 'dataMax * 1.2']}
            />
            {series.map((s, idx) => (
              <Bar key={s.key} isAnimationActive={!isExporting} dataKey={s.key} radius={0} barSize={series.length > 1 ? undefined : 80} fill={s.color}>
                 {series.length === 1 && data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                 <LabelList content={<CustomLabel seriesIndex={idx} color={s.color} />} />
              </Bar>
            ))}
          </BarChart>
        );
    }
  };

  const renderContent = () => {
    const fs = block.fontSize || 32;
    switch (block.type) {
      case BlockType.TITLE: return <h2 className="font-black text-slate-900 m-0 leading-[1.05] p-0 break-words" style={{ fontSize: fs }}>{block.title}</h2>;
      case BlockType.SUBTITLE: return <h3 className="font-semibold text-slate-400 m-0 leading-tight p-0 break-words" style={{ fontSize: fs }}>{block.title}</h3>;
      case BlockType.TEXT: return <p className="text-slate-600 leading-normal font-normal p-0 break-words" style={{ fontSize: '21px' }}>{block.content}</p>;
      case BlockType.CHART:
        const isPie = block.chartType === ChartType.PIE;
        return (
          <div id={`block-${block.id}`} className="flex-1 w-full flex flex-col overflow-visible">
             {block.title && (
               <div className="mb-6 relative inline-block self-start">
                 <h4 className="text-[26px] font-bold px-0 leading-none mb-2 text-slate-800">{block.title}</h4>
                 <div className="w-12 h-[4px] bg-blue-500 rounded-full" />
               </div>
             )}
             <div className={`flex-1 min-h-0 overflow-visible ${isPie ? '' : 'mx-[10px]'}`}>
               <ResponsiveContainer width="100%" height="100%">
                 {renderChart()}
               </ResponsiveContainer>
             </div>
          </div>
        );
      case BlockType.LEGEND:
        return (
           <div className={`flex ${block.legendDirection === 'vertical' ? 'flex-col' : 'flex-wrap'} gap-x-10 gap-y-2 px-0 py-2 w-full h-full items-start overflow-visible`}>
             {safeData.map((d, i) => (
               <div key={i} className="flex items-center gap-3">
                 <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                 <span className="text-[18px] font-medium text-slate-700 whitespace-nowrap">{d.name}</span>
               </div>
             ))}
           </div>
        );
      default: return null;
    }
  };

  return (
    <div style={style} onMouseDown={handleMouseDown}>
      {renderContent()}
      {isSelected && !isExporting && (
        <div onMouseDown={handleResizeStart} className="absolute bottom-[-10px] right-[-10px] w-8 h-8 cursor-nwse-resize bg-blue-600 rounded-full border-4 border-white z-50 shadow-xl" />
      )}
    </div>
  );
};

export default BlockRenderer;
