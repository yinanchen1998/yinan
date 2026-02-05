/**
 * 统计卡片组件
 */

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Train, Car, Ship, Plane, Users, TrendingUp, TrendingDown } from 'lucide-react';
import type { ChunyunDailyData } from '@/types/chunyun';

interface StatCardsProps {
  data: ChunyunDailyData[];
}

interface StatItem {
  title: string;
  value: number;
  unit: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  growth?: number;
}

export const StatCards: React.FC<StatCardsProps> = ({ data }) => {
  const stats = useMemo<StatItem[]>(() => {
    if (data.length === 0) return [];

    // 获取最新一天的数据
    const latestData = data[data.length - 1];
    
    // 计算累计值
    const totalFlow = data.reduce((sum, item) => sum + item.totalFlow, 0);

    return [
      {
        title: '当日全社会跨区域人员流动量',
        value: latestData.totalFlow,
        unit: '万人次',
        icon: <Users className="h-6 w-6" />,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        growth: latestData.totalFlowYoY || undefined,
      },
      {
        title: '当日铁路客运量',
        value: latestData.railway,
        unit: '万人次',
        icon: <Train className="h-6 w-6" />,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        growth: latestData.railwayYoY || undefined,
      },
      {
        title: '当日公路人员流动量',
        value: latestData.highway,
        unit: '万人次',
        icon: <Car className="h-6 w-6" />,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        growth: latestData.highwayYoY || undefined,
      },
      {
        title: '当日水路客运量',
        value: latestData.waterway,
        unit: '万人次',
        icon: <Ship className="h-6 w-6" />,
        color: 'text-cyan-600',
        bgColor: 'bg-cyan-50',
        growth: latestData.waterwayYoY || undefined,
      },
      {
        title: '当日民航客运量',
        value: latestData.aviation,
        unit: '万人次',
        icon: <Plane className="h-6 w-6" />,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        growth: latestData.aviationYoY || undefined,
      },
      {
        title: '春运累计总流量',
        value: totalFlow,
        unit: '万人次',
        icon: <TrendingUp className="h-6 w-6" />,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
      },
    ];
  }, [data]);

  const formatNumber = (num: number): string => {
    if (num >= 10000) {
      return `${(num / 10000).toFixed(2)}亿`;
    }
    return num.toLocaleString('zh-CN', { maximumFractionDigits: 1 });
  };

  if (stats.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {stat.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${stat.bgColor} ${stat.color}`}>
              {stat.icon}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">
                {formatNumber(stat.value)}
              </span>
              <span className="text-sm text-gray-500">{stat.unit}</span>
            </div>
            {stat.growth !== undefined && (
              <div className="flex items-center gap-1 mt-2">
                {stat.growth >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span
                  className={`text-sm font-medium ${
                    stat.growth >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {stat.growth >= 0 ? '+' : ''}
                  {stat.growth.toFixed(1)}%
                </span>
                <span className="text-xs text-gray-400">同比</span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StatCards;
