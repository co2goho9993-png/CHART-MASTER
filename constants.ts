
import { ChartType, BlockType, ChartDataPoint } from './types';

export const COLORS = {
  primary: '#1E293B', 
  secondary: '#3B82F6', 
  accent: '#2DD4BF', 
  muted: '#06B6D4', 
  workspaceBg: '#1e1e2e', 
  sidebarBg: '#11111b', 
  white: '#FFFFFF',
};

export const GRID_COLUMNS = 12;
export const GRID_ROWS = 12; 
export const A3_WIDTH_RATIO = 1.414; 
export const CANVAS_WIDTH = 1400;
export const CANVAS_PADDING = 40;
export const CONTENT_WIDTH = CANVAS_WIDTH - (CANVAS_PADDING * 2); // 1320
export const COL_WIDTH = CONTENT_WIDTH / GRID_COLUMNS; // 110

export const COLOR_PRESETS = [
  '#1E40AF', // Темно-синий
  '#3B82F6', // Голубой
  '#06B6D4', // Бирюзовый
  '#2DD4BF', // Светло-бирюзовый
  '#64748B', // Серый (Slate 500)
  '#94A3B8', // Светло-серый (Slate 400)
  '#475569', // Темно-серый (Slate 600)
  '#8E9AAF', // Пыльный синий
  '#B8C0FF', // Мягкий индиго
  '#DEE2FF', // Бледно-голубой
  '#A5F3FC', // Мягкий циан
  '#718093', // Матовый серый
  '#2F3640', // Глубокий матовый
  '#CBC0D3', // Пыльная лаванда
];

export const DEFAULT_DATA: ChartDataPoint[] = [
  { name: 'Группа А', value: 450, color: COLOR_PRESETS[0] },
  { name: 'Группа Б', value: 300, color: COLOR_PRESETS[1] },
  { name: 'Группа В', value: 200, color: COLOR_PRESETS[2] },
  { name: 'Группа Г', value: 278, color: COLOR_PRESETS[3] },
];

export const RUSSIAN_FISH = "Дизайн — это не только то, как устройство выглядит и ощущается. Дизайн — это то, как оно работает. Мы стремимся создавать продукты, которые не только радуют глаз своим изяществом, но и обеспечивают максимальное удобство пользователю. Каждая деталь, каждый пиксель и каждая строчка кода направлены на достижение этой цели. Наша команда верит в силу простоты и функциональности, создавая решения, которые меняют жизнь к лучшему.";

export const BLOCK_DEFAULTS = {
  [BlockType.TITLE]: { title: 'Заголовок проекта', h_units: 1, w: 12, fontSize: 53.3 },
  [BlockType.SUBTITLE]: { title: 'Краткое описание или подзаголовок раздела', h_units: 1, w: 12, fontSize: 34.6 },
  [BlockType.TEXT]: { 
    content: RUSSIAN_FISH, 
    h_units: 3, 
    w: 6, 
    fontSize: 21.3 
  },
  [BlockType.CHART]: { h_units: 6, w: 6, data: DEFAULT_DATA, fontSize: 24, title: 'Статистика показателей' },
  [BlockType.LEGEND]: { h_units: 1, w: 6, legendDirection: 'horizontal' },
};
