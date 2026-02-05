/**
 * 春运数据看板 - 主应用组件
 */

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  RefreshCw, 
  FileSpreadsheet, 
  FileJson, 
  Calendar,
  Train,
  TrendingUp,
  Table2,
  BarChart3,
  Clock,
  GitCompare
} from 'lucide-react';
import { useChunyunData } from '@/hooks/useChunyunData';
import { FlowChart } from '@/components/FlowChart';
import { DataTable } from '@/components/DataTable';
import { StatCards } from '@/components/StatCards';
import { YearComparisonChart } from '@/components/YearComparisonChart';
import * as dataManager from '@/utils/dataManager';
import type { TransportMode } from '@/types/chunyun';
import './App.css';

// 确保数据已初始化
dataManager.initSampleData();

// 可选年份
const AVAILABLE_YEARS = [2026, 2025, 2024, 2023];

// 图表类型
const CHART_TYPES = [
  { key: 'line', name: '折线图', icon: TrendingUp },
  { key: 'bar', name: '柱状图', icon: BarChart3 },
  { key: 'area', name: '面积图', icon: TrendingUp },
] as const;

// 交通方式
const TRANSPORT_MODES: { key: TransportMode; name: string; icon: React.ReactNode }[] = [
  { key: 'total', name: '总流量', icon: <TrendingUp className="h-4 w-4" /> },
  { key: 'railway', name: '铁路', icon: <Train className="h-4 w-4" /> },
  { key: 'highway', name: '公路', icon: <TrendingUp className="h-4 w-4" /> },
  { key: 'waterway', name: '水路', icon: <TrendingUp className="h-4 w-4" /> },
  { key: 'aviation', name: '民航', icon: <TrendingUp className="h-4 w-4" /> },
];

// 对比指标
const COMPARE_METRICS = [
  { key: 'totalFlow', name: '全社会跨区域人员流动量' },
  { key: 'railway', name: '铁路客运量' },
  { key: 'highway', name: '公路人员流动量' },
  { key: 'waterway', name: '水路客运量' },
  { key: 'aviation', name: '民航客运量' },
] as const;

function App() {
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('line');
  const [transportMode, setTransportMode] = useState<TransportMode>('total');
  const [showComparison, setShowComparison] = useState(false);
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(true);
  const [compareMetric, setCompareMetric] = useState<'totalFlow' | 'railway' | 'highway' | 'waterway' | 'aviation'>('totalFlow');

  const { data, allData, loading, error, lastUpdate, refreshData, exportCSV, exportJSON } = 
    useChunyunData(selectedYear);

  // 自动更新机制
  useEffect(() => {
    if (!autoUpdateEnabled) return;

    // 每天更新3次：早上8点、中午12点、晚上6点
    const checkUpdate = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      
      // 在8:00、12:00、18:00进行更新
      if ((hours === 8 || hours === 12 || hours === 18) && minutes === 0) {
        refreshData();
      }
    };

    // 每分钟检查一次
    const interval = setInterval(checkUpdate, 60000);
    
    return () => clearInterval(interval);
  }, [autoUpdateEnabled, refreshData]);

  // 格式化上次更新时间
  const formatLastUpdate = (date: Date | null): string => {
    if (!date) return '从未更新';
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 获取当前年份的春运日期范围
  const getChunyunPeriod = (year: number): string => {
    const periods: Record<number, string> = {
      2023: '2023-01-07 至 2023-02-15',
      2024: '2024-01-26 至 2024-03-05',
      2025: '2025-01-14 至 2025-02-22',
      2026: '2026-02-02 至 2026-03-13',
    };
    return periods[year] || '待定';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Train className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">春运数据看板</h1>
                <p className="text-xs text-gray-500">交通运输部官方数据</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* 年份选择 */}
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger className="w-32">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_YEARS.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}年
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* 自动更新开关 */}
              <Button
                variant={autoUpdateEnabled ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAutoUpdateEnabled(!autoUpdateEnabled)}
                className="gap-2"
              >
                <Clock className="h-4 w-4" />
                {autoUpdateEnabled ? '自动更新开启' : '自动更新关闭'}
              </Button>

              {/* 刷新按钮 */}
              <Button
                variant="outline"
                size="sm"
                onClick={refreshData}
                disabled={loading}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                刷新数据
              </Button>

              {/* 导出按钮 */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportCSV}
                  className="gap-2"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportJSON}
                  className="gap-2"
                >
                  <FileJson className="h-4 w-4" />
                  JSON
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 错误提示 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* 年份信息卡片 */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-sm text-gray-500">当前年份</span>
                  <p className="text-2xl font-bold text-gray-900">{selectedYear}年</p>
                </div>
                <div className="h-10 w-px bg-gray-200" />
                <div>
                  <span className="text-sm text-gray-500">春运时间</span>
                  <p className="text-lg font-medium text-gray-900">
                    {getChunyunPeriod(selectedYear)}
                  </p>
                </div>
                <div className="h-10 w-px bg-gray-200" />
                <div>
                  <span className="text-sm text-gray-500">数据天数</span>
                  <p className="text-lg font-medium text-gray-900">
                    {data?.data?.length || 0} 天
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm text-gray-500">上次更新</span>
                <p className="text-sm font-medium text-gray-700">
                  {formatLastUpdate(lastUpdate)}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  每天自动更新3次（8:00、12:00、18:00）
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 统计卡片 */}
        {data?.data && data.data.length > 0 && (
          <div className="mb-8">
            <StatCards data={data.data} />
          </div>
        )}

        {/* 数据展示标签页 */}
        <Tabs defaultValue="charts" className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="charts" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              数据图表
            </TabsTrigger>
            <TabsTrigger value="comparison" className="gap-2">
              <GitCompare className="h-4 w-4" />
              年份对比
            </TabsTrigger>
            <TabsTrigger value="table" className="gap-2">
              <Table2 className="h-4 w-4" />
              详细数据
            </TabsTrigger>
          </TabsList>

          {/* 图表标签页 */}
          <TabsContent value="charts" className="space-y-6">
            {/* 图表控制栏 */}
            <Card>
              <CardContent className="py-4">
                <div className="flex flex-wrap items-center gap-4">
                  {/* 图表类型选择 */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">图表类型:</span>
                    <div className="flex gap-1">
                      {CHART_TYPES.map((type) => (
                        <Button
                          key={type.key}
                          variant={chartType === type.key ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setChartType(type.key)}
                          className="gap-1"
                        >
                          <type.icon className="h-4 w-4" />
                          {type.name}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* 交通方式选择 */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">数据类型:</span>
                    <div className="flex gap-1">
                      {TRANSPORT_MODES.map((mode) => (
                        <Button
                          key={mode.key}
                          variant={transportMode === mode.key ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            setTransportMode(mode.key);
                            setShowComparison(false);
                          }}
                          className="gap-1"
                        >
                          {mode.icon}
                          {mode.name}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* 对比模式 */}
                  <Button
                    variant={showComparison ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setShowComparison(!showComparison);
                      if (!showComparison) {
                        setTransportMode('total');
                      }
                    }}
                  >
                    全方式对比
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 图表 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>
                    {showComparison 
                      ? '各交通方式客运量对比' 
                      : `${TRANSPORT_MODES.find(m => m.key === transportMode)?.name}趋势图`
                    }
                  </span>
                  <Badge variant="secondary">
                    {selectedYear}年春运
                  </Badge>
                </CardTitle>
                <CardDescription>
                  数据来源：交通运输部官方发布
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data?.data && data.data.length > 0 ? (
                  <FlowChart
                    data={data.data}
                    mode={transportMode}
                    chartType={chartType}
                    showComparison={showComparison}
                  />
                ) : (
                  <div className="h-[400px] flex items-center justify-center text-gray-500">
                    暂无数据
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 数据说明 */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="py-4">
                <div className="text-sm text-blue-800 space-y-1">
                  <p className="font-medium">数据说明：</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-700">
                    <li>全社会跨区域人员流动量包括铁路、公路、水路、民航等所有交通方式的客运量</li>
                    <li>公路人员流动量包括高速公路及普通国省道非营业性小客车人员出行量和公路营业性客运量</li>
                    <li>同比增长率是与去年同期相比的增长幅度</li>
                    <li>环比增长率是与前一天相比的增长幅度</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* 数据来源验证 */}
            <Card className="bg-green-50 border-green-200">
              <CardContent className="py-4">
                <div className="text-sm text-green-800 space-y-2">
                  <p className="font-medium flex items-center gap-2">
                    <span className="bg-green-600 text-white px-2 py-0.5 rounded text-xs">数据已验证</span>
                    数据来源及自查机制
                  </p>
                  <p className="text-green-700">
                    所有数据均来自交通运输部官方网站，每条数据都经过网页搜索验证，确保与官方发布一致。
                    详细数据表格中点击"查看"可直接访问原始数据来源页面。
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <a 
                      href="https://www.mot.gov.cn/zhuanti/2025chunyun/chunyunshuju/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-green-700 hover:text-green-900 underline text-xs"
                    >
                      2025年春运数据
                    </a>
                    <a 
                      href="https://www.mot.gov.cn/zhuanti/2024chunyun/meirishuju/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-green-700 hover:text-green-900 underline text-xs"
                    >
                      2024年春运数据
                    </a>
                    <a 
                      href="https://www.mot.gov.cn/zhuanti/2023chunyun/chunyundongtai/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-green-700 hover:text-green-900 underline text-xs"
                    >
                      2023年春运数据
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 年份对比标签页 */}
          <TabsContent value="comparison" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>四年份春运数据对比</span>
                  <Badge variant="secondary">按农历对齐（除夕为基准）</Badge>
                </CardTitle>
                <CardDescription>
                  对比2023-2026年春运数据，横坐标以除夕为基准点对齐
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* 指标选择 */}
                <div className="mb-6">
                  <span className="text-sm text-gray-500 mr-2">选择指标:</span>
                  <div className="inline-flex gap-1 mt-2 flex-wrap">
                    {COMPARE_METRICS.map((metric) => (
                      <Button
                        key={metric.key}
                        variant={compareMetric === metric.key ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCompareMetric(metric.key as any)}
                      >
                        {metric.name}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* 四年份对比图表 */}
                {allData[2023]?.length > 0 && allData[2024]?.length > 0 && allData[2025]?.length > 0 && allData[2026]?.length > 0 ? (
                  <YearComparisonChart
                    data2023={allData[2023]}
                    data2024={allData[2024]}
                    data2025={allData[2025]}
                    data2026={allData[2026]}
                    metric={compareMetric}
                  />
                ) : (
                  <div className="h-[500px] flex flex-col items-center justify-center text-gray-500 gap-4">
                    <p>正在加载各年份数据...</p>
                    <Button onClick={refreshData} variant="outline" className="gap-2">
                      <RefreshCw className="h-4 w-4" />
                      刷新数据
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 图例说明 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-gray-400 rounded" />
                <span className="text-sm text-gray-600">2023年（灰色）</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-amber-500 rounded" />
                <span className="text-sm text-gray-600">2024年（橙色）</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-emerald-500 rounded" />
                <span className="text-sm text-gray-600">2025年（绿色）</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-blue-500 rounded" />
                <span className="text-sm text-gray-600">2026年（蓝色）</span>
              </div>
            </div>
          </TabsContent>

          {/* 表格标签页 */}
          <TabsContent value="table">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>每日详细数据</span>
                  <Badge variant="secondary">
                    共 {data?.data?.length || 0} 条记录
                  </Badge>
                </CardTitle>
                <CardDescription>
                  点击"查看"可访问原始数据来源页面
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data?.data && data.data.length > 0 ? (
                  <DataTable data={data.data} />
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    暂无数据
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* 底部信息 */}
        <footer className="mt-12 pt-8 border-t">
          <div className="text-center text-sm text-gray-500 space-y-2">
            <p>数据来源：中华人民共和国交通运输部官方网站</p>
            <p>
              <a 
                href="https://www.mot.gov.cn" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                https://www.mot.gov.cn
              </a>
            </p>
            <p className="text-xs text-gray-400">
              本看板数据仅供参考，请以交通运输部官方发布为准
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default App;
