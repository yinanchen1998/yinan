/**
 * 流量趋势图表组件
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
  AreaChart,
  Area,
  BarChart,
  Bar,
} from 'recharts';
import type { ChunyunDailyData, TransportMode } from '@/types/chunyun';

interface FlowChartProps {
  data: ChunyunDailyData[];
  mode: TransportMode;
  chartType: 'line' | 'bar' | 'area';
  showComparison?: boolean;
}

interface ChartDataPoint {
  date: string;
  lunarDate: string;
  chunyunDay: number;
  value: number;
  railway?: number;
  highway?: number;
  waterway?: number;
  aviation?: number;
  total?: number;
}

export const FlowChart: React.FC<FlowChartProps> = ({
  data,
  mode,
  chartType,
  showComparison = false,
}) => {
  const chartData = useMemo<ChartDataPoint[]>(() => {
    return data.map((item) => ({
      date: item.date.slice(5), // 只显示月-日
      lunarDate: item.lunarDate,
      chunyunDay: item.chunyunDay,
      value: mode === 'total' ? item.totalFlow : item[mode],
      railway: item.railway,
      highway: item.highway,
      waterway: item.waterway,
      aviation: item.aviation,
      total: item.totalFlow,
    }));
  }, [data, mode]);

  const getModeColor = (m: TransportMode): string => {
    const colors: Record<TransportMode, string> = {
      total: '#3b82f6',
      railway: '#ef4444',
      highway: '#10b981',
      waterway: '#06b6d4',
      aviation: '#8b5cf6',
    };
    return colors[m];
  };

  const getModeName = (m: TransportMode): string => {
    const names: Record<TransportMode, string> = {
      total: '全社会跨区域人员流动量',
      railway: '铁路客运量',
      highway: '公路人员流动量',
      waterway: '水路客运量',
      aviation: '民航客运量',
    };
    return names[m];
  };

  const formatValue = (value: number): string => {
    if (value >= 10000) {
      return `${(value / 10000).toFixed(2)}亿`;
    }
    return `${value.toFixed(0)}万`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload as ChartDataPoint;
      return (
        <div className="bg-white p-4 border rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">
            {dataPoint.date}（{dataPoint.lunarDate}）
          </p>
          <p className="text-sm text-gray-600">
            春运第{dataPoint.chunyunDay}天
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm mt-1" style={{ color: entry.color }}>
              {entry.name}: {formatValue(entry.value)}人次
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 20, right: 30, left: 20, bottom: 20 },
    };

    if (showComparison) {
      // 显示所有交通方式对比
      return (
        <AreaChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
            tickFormatter={(value) => formatValue(value)}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Area
            type="monotone"
            dataKey="railway"
            name="铁路"
            stackId="1"
            stroke="#ef4444"
            fill="#ef4444"
            fillOpacity={0.6}
          />
          <Area
            type="monotone"
            dataKey="highway"
            name="公路"
            stackId="1"
            stroke="#10b981"
            fill="#10b981"
            fillOpacity={0.6}
          />
          <Area
            type="monotone"
            dataKey="waterway"
            name="水路"
            stackId="1"
            stroke="#06b6d4"
            fill="#06b6d4"
            fillOpacity={0.6}
          />
          <Area
            type="monotone"
            dataKey="aviation"
            name="民航"
            stackId="1"
            stroke="#8b5cf6"
            fill="#8b5cf6"
            fillOpacity={0.6}
          />
        </AreaChart>
      );
    }

    if (chartType === 'line') {
      return (
        <LineChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
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
            dataKey="value"
            name={getModeName(mode)}
            stroke={getModeColor(mode)}
            strokeWidth={2}
            dot={{ fill: getModeColor(mode), strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      );
    }

    if (chartType === 'area') {
      return (
        <AreaChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
            tickFormatter={(value) => formatValue(value)}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Area
            type="monotone"
            dataKey="value"
            name={getModeName(mode)}
            stroke={getModeColor(mode)}
            fill={getModeColor(mode)}
            fillOpacity={0.3}
          />
        </AreaChart>
      );
    }

    return (
      <BarChart {...commonProps}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 12 }}
          stroke="#6b7280"
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          stroke="#6b7280"
          tickFormatter={(value) => formatValue(value)}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar
          dataKey="value"
          name={getModeName(mode)}
          fill={getModeColor(mode)}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    );
  };

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
};

export default FlowChart;
