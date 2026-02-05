/**
 * 春运数据自定义Hook
 * 管理数据的获取、更新和状态
 */

import { useState, useEffect, useCallback } from 'react';
import type { ChunyunDailyData, ChunyunYearData } from '@/types/chunyun';
import { allChunyunData } from '@/utils/chunyunData';
import * as dataManager from '@/utils/dataManager';

interface UseChunyunDataReturn {
  data: ChunyunYearData | null;
  allData: Record<number, ChunyunDailyData[]>;
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  refreshData: () => Promise<void>;
  exportCSV: () => void;
  exportJSON: () => void;
}

// 春运日期范围
const CHUNYUN_PERIODS: Record<number, { startDate: string; endDate: string }> = {
  2023: { startDate: '2023-01-07', endDate: '2023-02-15' },
  2024: { startDate: '2024-01-26', endDate: '2024-03-05' },
  2025: { startDate: '2025-01-14', endDate: '2025-02-22' },
  2026: { startDate: '2026-02-02', endDate: '2026-03-13' },
};

export function useChunyunData(selectedYear: number): UseChunyunDataReturn {
  const [data, setData] = useState<ChunyunYearData | null>(null);
  const [allData, setAllData] = useState<Record<number, ChunyunDailyData[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(new Date());

  // 加载数据
  const loadData = useCallback(() => {
    try {
      // 直接使用 chunyunData.ts 中的数据源
      const formattedData: Record<number, ChunyunDailyData[]> = {};
      
      Object.keys(allChunyunData).forEach((year) => {
        const yearNum = parseInt(year);
        formattedData[yearNum] = allChunyunData[yearNum];
      });
      
      setAllData(formattedData);
      
      // 获取选中年份的数据
      const period = CHUNYUN_PERIODS[selectedYear];
      const yearData: ChunyunYearData = {
        year: selectedYear,
        startDate: period?.startDate || `${selectedYear}-01-01`,
        endDate: period?.endDate || `${selectedYear}-03-01`,
        data: allChunyunData[selectedYear] || [],
      };
      setData(yearData);
      
      // 获取上次更新时间
      const updateTime = dataManager.getLastUpdateTime();
      setLastUpdate(updateTime);
    } catch (e) {
      setError('加载数据失败');
      console.error(e);
    }
  }, [selectedYear]);

  // 初始化数据
  useEffect(() => {
    loadData();
  }, [loadData]);

  // 刷新数据（模拟）
  const refreshData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 数据已内置，刷新只是重新加载
      loadData();
      // 更新最后更新时间
      if (typeof window !== 'undefined') {
        localStorage.setItem('chunyun_last_update', new Date().toISOString());
      }
    } catch (e) {
      setError('刷新数据失败');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [loadData]);

  // 导出CSV
  const exportCSV = useCallback(() => {
    if (data) {
      dataManager.downloadCSV(selectedYear, data.data);
    }
  }, [data, selectedYear]);

  // 导出JSON
  const exportJSON = useCallback(() => {
    if (data) {
      dataManager.downloadJSON(selectedYear, data.data);
    }
  }, [data, selectedYear]);

  return {
    data,
    allData,
    loading,
    error,
    lastUpdate,
    refreshData,
    exportCSV,
    exportJSON,
  };
}

export default useChunyunData;
