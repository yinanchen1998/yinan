/**
 * 数据管理模块
 * 负责数据的存储、读取、更新和导出
 */

import type { ChunyunDailyData, ChunyunYearData } from '@/types/chunyun';
import { allChunyunData } from './chunyunData';

const STORAGE_KEY = 'chunyun_data';
const LAST_UPDATE_KEY = 'chunyun_last_update';

/**
 * 获取所有存储的春运数据
 */
export function getAllChunyunData(): Record<number, ChunyunYearData> {
  if (typeof window === 'undefined') {
    // 服务端渲染时返回默认数据
    return {
      2023: { year: 2023, startDate: '2023-01-07', endDate: '2023-02-15', data: allChunyunData[2023] },
      2024: { year: 2024, startDate: '2024-01-26', endDate: '2024-03-05', data: allChunyunData[2024] },
      2025: { year: 2025, startDate: '2025-01-14', endDate: '2025-02-22', data: allChunyunData[2025] },
      2026: { year: 2026, startDate: '2026-02-02', endDate: '2026-03-13', data: allChunyunData[2026] },
    };
  }
  
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('读取数据失败:', e);
  }
  
  // 如果没有本地数据，返回默认数据
  return {
    2023: { year: 2023, startDate: '2023-01-07', endDate: '2023-02-15', data: allChunyunData[2023] },
    2024: { year: 2024, startDate: '2024-01-26', endDate: '2024-03-05', data: allChunyunData[2024] },
    2025: { year: 2025, startDate: '2025-01-14', endDate: '2025-02-22', data: allChunyunData[2025] },
    2026: { year: 2026, startDate: '2026-02-02', endDate: '2026-03-13', data: allChunyunData[2026] },
  };
}

/**
 * 获取指定年份的春运数据
 */
export function getChunyunDataByYear(year: number): ChunyunYearData | null {
  const allData = getAllChunyunData();
  return allData[year] || null;
}

/**
 * 保存春运数据
 */
export function saveChunyunData(year: number, data: ChunyunDailyData[], startDate?: string, endDate?: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const allData = getAllChunyunData();
    allData[year] = {
      year,
      startDate: startDate || `${year}-01-26`,
      endDate: endDate || `${year}-03-05`,
      data,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
    localStorage.setItem(LAST_UPDATE_KEY, new Date().toISOString());
  } catch (e) {
    console.error('保存数据失败:', e);
  }
}

/**
 * 更新指定日期的数据
 */
export function updateDailyData(year: number, dailyData: ChunyunDailyData): void {
  if (typeof window === 'undefined') return;
  
  try {
    const yearData = getChunyunDataByYear(year);
    if (yearData) {
      const index = yearData.data.findIndex(d => d.date === dailyData.date);
      if (index >= 0) {
        yearData.data[index] = dailyData;
      } else {
        yearData.data.push(dailyData);
        yearData.data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      }
      saveChunyunData(year, yearData.data, yearData.startDate, yearData.endDate);
    } else {
      saveChunyunData(year, [dailyData]);
    }
  } catch (e) {
    console.error('更新数据失败:', e);
  }
}

/**
 * 获取上次更新时间
 */
export function getLastUpdateTime(): Date | null {
  if (typeof window === 'undefined') return new Date();
  
  try {
    const time = localStorage.getItem(LAST_UPDATE_KEY);
    if (time) {
      return new Date(time);
    }
  } catch (e) {
    console.error('读取更新时间失败:', e);
  }
  return new Date();
}

/**
 * 将数据导出为CSV格式
 */
export function exportToCSV(year: number, data?: ChunyunDailyData[]): string {
  const yearData = data || getChunyunDataByYear(year)?.data || [];
  
  if (yearData.length === 0) {
    return '';
  }
  
  const headers = [
    '日期',
    '农历',
    '春运第几天',
    '全社会跨区域人员流动量(万人次)',
    '同比增长(%)',
    '环比增长(%)',
    '铁路客运量(万人次)',
    '铁路同比(%)',
    '铁路环比(%)',
    '公路人员流动量(万人次)',
    '公路同比(%)',
    '公路环比(%)',
    '其中：非营业性小客车(万人次)',
    '其中：营业性客运(万人次)',
    '水路客运量(万人次)',
    '水路同比(%)',
    '水路环比(%)',
    '民航客运量(万人次)',
    '民航同比(%)',
    '民航环比(%)',
    '数据来源',
  ];
  
  const rows = yearData.map(item => [
    item.date,
    item.lunarDate,
    item.chunyunDay,
    item.totalFlow,
    item.totalFlowYoY ?? '',
    item.totalFlowQoQ ?? '',
    item.railway,
    item.railwayYoY ?? '',
    item.railwayQoQ ?? '',
    item.highway,
    item.highwayYoY ?? '',
    item.highwayQoQ ?? '',
    item.highwayPrivate ?? '',
    item.highwayCommercial ?? '',
    item.waterway,
    item.waterwayYoY ?? '',
    item.waterwayQoQ ?? '',
    item.aviation,
    item.aviationYoY ?? '',
    item.aviationQoQ ?? '',
    item.sourceUrl,
  ]);
  
  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  return csvContent;
}

/**
 * 将数据导出为JSON格式
 */
export function exportToJSON(year: number, data?: ChunyunDailyData[]): string {
  const yearData = data || getChunyunDataByYear(year)?.data || [];
  return JSON.stringify(yearData, null, 2);
}

/**
 * 下载文件
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 下载CSV文件
 */
export function downloadCSV(year: number, data?: ChunyunDailyData[]): void {
  const csv = exportToCSV(year, data);
  if (csv) {
    downloadFile(csv, `春运数据_${year}.csv`, 'text/csv;charset=utf-8;');
  }
}

/**
 * 下载JSON文件
 */
export function downloadJSON(year: number, data?: ChunyunDailyData[]): void {
  const json = exportToJSON(year, data);
  if (json) {
    downloadFile(json, `春运数据_${year}.json`, 'application/json');
  }
}

/**
 * 初始化示例数据
 */
export function initSampleData(): void {
  // 数据已经在 allChyunData 中定义，无需额外初始化
  // 但为了兼容旧代码，保留此函数
  if (typeof window !== 'undefined') {
    localStorage.setItem(LAST_UPDATE_KEY, new Date().toISOString());
  }
}

export default {
  getAllChunyunData,
  getChunyunDataByYear,
  saveChunyunData,
  updateDailyData,
  getLastUpdateTime,
  exportToCSV,
  exportToJSON,
  downloadCSV,
  downloadJSON,
  initSampleData,
};
