/**
 * 四年份对比图表组件
 * 按农历对齐（除夕对齐）
 */

import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { ChunyunDailyData } from '@/types/chunyun';

interface YearComparisonChartProps {
  data2023: ChunyunDailyData[];
  data2024: ChunyunDailyData[];
  data2025: ChunyunDailyData[];
  data2026: ChunyunDailyData[];
  metric: 'totalFlow' | 'railway' | 'highway' | 'waterway' | 'aviation';
}

// 农历日期到相对天数的映射（以除夕为0点）
const LUNAR_DAY_MAP: Record<string, number> = {
  '腊月十五': -15,
  '腊月十六': -14,
  '腊月十七': -13,
  '腊月十八': -12,
  '腊月十九': -11,
  '腊月二十': -10,
  '腊月廿一': -9,
  '腊月廿二': -8,
  '腊月廿三': -7,
  '腊月廿四': -6,
  '腊月廿五': -5,
  '腊月廿六': -4,
  '腊月廿七': -3,
  '腊月廿八': -2,
  '腊月廿九': -1,
  '除夕': 0,
  '正月初一': 1,
  '正月初二': 2,
  '正月初三': 3,
  '正月初四': 4,
  '正月初五': 5,
  '正月初六': 6,
  '正月初七': 7,
  '正月初八': 8,
  '正月初九': 9,
  '正月初十': 10,
  '正月十一': 11,
  '正月十二': 12,
  '正月十三': 13,
  '正月十四': 14,
  '正月十五': 15,
  '正月廿四': 24,
  '正月廿五': 25,
};

// 获取相对天数（以除夕为0）
function getRelativeDay(lunarDate: string): number | null {
  return LUNAR_DAY_MAP[lunarDate] ?? null;
}

// 获取指标名称
function getMetricName(metric: string): string {
  const names: Record<string, string> = {
    totalFlow: '全社会跨区域人员流动量',
    railway: '铁路客运量',
    highway: '公路人员流动量',
    waterway: '水路客运量',
    aviation: '民航客运量',
  };
  return names[metric] || metric;
}

// 获取指标颜色
function getMetricColor(metric: string): string {
  const colors: Record<string, string> = {
    totalFlow: '#3b82f6',
    railway: '#ef4444',
    highway: '#10b981',
    waterway: '#06b6d4',
    aviation: '#8b5cf6',
  };
  return colors[metric] || '#3b82f6';
}

export const YearComparisonChart: React.FC<YearComparisonChartProps> = ({
  data2023,
  data2024,
  data2025,
  data2026,
  metric,
}) => {
  // 处理数据，按农历日期对齐
  const chartData = useMemo(() => {
    // 创建以相对天数为key的数据结构
    const dataMap: Record<number, {
      day: number;
      lunarDate: string;
      y2023?: number | null;
      y2024?: number | null;
      y2025?: number | null;
      y2026?: number | null;
    }> = {};

    // 处理2023年数据
    data2023.forEach((item) => {
      const day = getRelativeDay(item.lunarDate);
      if (day !== null) {
        if (!dataMap[day]) {
          dataMap[day] = { day, lunarDate: item.lunarDate };
        }
        dataMap[day].y2023 = item[metric];
      }
    });

    // 处理2024年数据
    data2024.forEach((item) => {
      const day = getRelativeDay(item.lunarDate);
      if (day !== null) {
        if (!dataMap[day]) {
          dataMap[day] = { day, lunarDate: item.lunarDate };
        }
        dataMap[day].y2024 = item[metric];
      }
    });

    // 处理2025年数据
    data2025.forEach((item) => {
      const day = getRelativeDay(item.lunarDate);
      if (day !== null) {
        if (!dataMap[day]) {
          dataMap[day] = { day, lunarDate: item.lunarDate };
        }
        dataMap[day].y2025 = item[metric];
      }
    });

    // 处理2026年数据
    data2026.forEach((item) => {
      const day = getRelativeDay(item.lunarDate);
      if (day !== null) {
        if (!dataMap[day]) {
          dataMap[day] = { day, lunarDate: item.lunarDate };
        }
        dataMap[day].y2026 = item[metric];
      }
    });

    // 转换为数组并排序
    return Object.values(dataMap).sort((a, b) => a.day - b.day);
  }, [data2023, data2024, data2025, data2026, metric]);

  // 格式化X轴标签
  const formatXAxisLabel = (day: number): string => {
    if (day === 0) return '除夕';
    if (day < 0) return `腊月${15 + day}`; // -15 -> 腊月十五
    return `正月初${day}`;
  };

  // 格式化数值
  const formatValue = (value: number): string => {
    if (value >= 10000) {
      return `${(value / 10000).toFixed(1)}亿`;
    }
    return `${value.toFixed(0)}万`;
  };

  // 自定义Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800 mb-2">
            {formatXAxisLabel(label)}（相对除夕{label > 0 ? '+' : ''}{label}天）
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatValue(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const metricColor = getMetricColor(metric);
  const metricName = getMetricName(metric);

  return (
    <div className="w-full h-[500px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
            tickFormatter={formatXAxisLabel}
            type="number"
            domain={['dataMin', 'dataMax']}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
            tickFormatter={(value) => formatValue(value)}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line
            type="monotone"
            dataKey="y2023"
            name="2023年"
            stroke="#94a3b8"
            strokeWidth={2}
            dot={{ fill: '#94a3b8', strokeWidth: 2, r: 4 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="y2024"
            name="2024年"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="y2025"
            name="2025年"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="y2026"
            name="2026年"
            stroke={metricColor}
            strokeWidth={3}
            dot={{ fill: metricColor, strokeWidth: 2, r: 5 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="text-center text-sm text-gray-500 mt-2">
        {metricName}对比（按农历对齐，除夕为基准点）
      </div>
    </div>
  );
};

export default YearComparisonChart;
