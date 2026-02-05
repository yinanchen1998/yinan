// 春运数据类型定义

export interface ChunyunDailyData {
  // 日期信息
  date: string;           // 日期，格式：YYYY-MM-DD
  lunarDate: string;      // 农历日期
  chunyunDay: number;     // 春运第几天（1-40）
  
  // 总流量
  totalFlow: number;      // 全社会跨区域人员流动量（万人次）
  totalFlowYoY?: number;  // 同比增长率（%）
  totalFlowQoQ?: number;  // 环比增长率（%）
  
  // 铁路
  railway: number;        // 铁路客运量（万人次）
  railwayYoY?: number;    // 同比增长率（%）
  railwayQoQ?: number;    // 环比增长率（%）
  
  // 公路
  highway: number;        // 公路人员流动量（万人次）
  highwayYoY?: number;    // 同比增长率（%）
  highwayQoQ?: number;    // 环比增长率（%）
  highwayPrivate?: number;  // 高速公路及普通国省道非营业性小客车人员出行量
  highwayCommercial?: number; // 公路营业性客运量
  
  // 水路
  waterway: number;       // 水路客运量（万人次）
  waterwayYoY?: number;   // 同比增长率（%）
  waterwayQoQ?: number;   // 环比增长率（%）
  
  // 民航
  aviation: number;       // 民航客运量（万人次）
  aviationYoY?: number;   // 同比增长率（%）
  aviationQoQ?: number;   // 环比增长率（%）
  
  // 来源链接
  sourceUrl: string;      // 原始数据来源链接
  sourceTitle?: string;   // 来源文章标题
}

export interface ChunyunYearData {
  year: number;           // 年份
  startDate: string;      // 春运开始日期
  endDate: string;        // 春运结束日期
  data: ChunyunDailyData[];
}

export type TransportMode = 'total' | 'railway' | 'highway' | 'waterway' | 'aviation';

export interface TransportModeInfo {
  key: TransportMode;
  name: string;
  unit: string;
  color: string;
  icon: string;
}

export const TRANSPORT_MODES: TransportModeInfo[] = [
  { key: 'total', name: '全社会跨区域人员流动量', unit: '万人次', color: '#3b82f6', icon: 'Users' },
  { key: 'railway', name: '铁路客运量', unit: '万人次', color: '#ef4444', icon: 'Train' },
  { key: 'highway', name: '公路人员流动量', unit: '万人次', color: '#10b981', icon: 'Car' },
  { key: 'waterway', name: '水路客运量', unit: '万人次', color: '#06b6d4', icon: 'Ship' },
  { key: 'aviation', name: '民航客运量', unit: '万人次', color: '#8b5cf6', icon: 'Plane' },
];
