
export enum BlockType {
  CHART = 'CHART',
  TEXT = 'TEXT',
  TITLE = 'TITLE',
  SUBTITLE = 'SUBTITLE',
  LEGEND = 'LEGEND'
}

export enum ChartType {
  BAR = 'BAR',
  HORIZONTAL_BAR = 'HORIZONTAL_BAR',
  LINE = 'LINE',
  AREA = 'AREA',
  PIE = 'PIE',
  RADAR = 'RADAR',
  SCATTER = 'SCATTER'
}

export interface SeriesConfig {
  key: string;
  name: string;
  color: string;
}

export interface ChartDataPoint {
  name: string;
  value: number; // Первичное значение (для совместимости)
  color?: string;
  [key: string]: any; // Дополнительные значения для мульти-серий (value_1, value_2...)
}

export interface LayoutBlock {
  id: string;
  type: BlockType;
  chartType?: ChartType;
  x: number; // grid units (0-11)
  y: number; // relative units or pixels
  w: number; // grid units (1-12)
  h: number; // pixels
  title?: string;
  content?: string;
  fontSize?: number;
  legendDirection?: 'horizontal' | 'vertical';
  data?: ChartDataPoint[];
  seriesConfigs?: SeriesConfig[]; // Конфигурация нескольких серий
  linkedBlockId?: string; // For linking charts and legends
}

export interface AppState {
  blocks: LayoutBlock[];
  selectedBlockId: string | null;
  showGrid: boolean;
}
