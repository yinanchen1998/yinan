/**
 * 数据表格组件
 */

import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Search, ExternalLink } from 'lucide-react';
import type { ChunyunDailyData } from '@/types/chunyun';

interface DataTableProps {
  data: ChunyunDailyData[];
}

const ITEMS_PER_PAGE = 10;

export const DataTable: React.FC<DataTableProps> = ({ data }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  // 过滤数据
  const filteredData = React.useMemo(() => {
    if (!searchTerm) return data;
    return data.filter(
      (item) =>
        item.date.includes(searchTerm) ||
        item.lunarDate.includes(searchTerm) ||
        item.chunyunDay.toString().includes(searchTerm)
    );
  }, [data, searchTerm]);

  // 分页
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedData = filteredData.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const formatNumber = (num: number | undefined | null): string => {
    if (num === undefined || num === null) return '-';
    return num.toLocaleString('zh-CN', { maximumFractionDigits: 1 });
  };

  const formatGrowth = (value: number | undefined | null): React.ReactNode => {
    if (value === undefined || value === null) return '-';
    const isPositive = value >= 0;
    return (
      <span
        className={`text-xs ${
          isPositive ? 'text-green-600' : 'text-red-600'
        }`}
      >
        {isPositive ? '+' : ''}
        {value.toFixed(1)}%
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* 搜索栏 */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="搜索日期、农历、春运天数..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10"
          />
        </div>
        <Badge variant="secondary" className="text-sm">
          共 {filteredData.length} 条记录
        </Badge>
      </div>

      {/* 表格 */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="text-center whitespace-nowrap">日期</TableHead>
                <TableHead className="text-center whitespace-nowrap">农历</TableHead>
                <TableHead className="text-center whitespace-nowrap">春运第几天</TableHead>
                <TableHead className="text-right whitespace-nowrap">
                  全社会跨区域
                  <br />
                  人员流动量(万)
                </TableHead>
                <TableHead className="text-right whitespace-nowrap">同比</TableHead>
                <TableHead className="text-right whitespace-nowrap">环比</TableHead>
                <TableHead className="text-right whitespace-nowrap">
                  铁路客运量
                  <br />
                  (万人次)
                </TableHead>
                <TableHead className="text-right whitespace-nowrap">
                  公路人员流动量
                  <br />
                  (万人次)
                </TableHead>
                <TableHead className="text-right whitespace-nowrap">
                  水路客运量
                  <br />
                  (万人次)
                </TableHead>
                <TableHead className="text-right whitespace-nowrap">
                  民航客运量
                  <br />
                  (万人次)
                </TableHead>
                <TableHead className="text-center whitespace-nowrap">来源</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((item, index) => (
                <TableRow
                  key={item.date}
                  className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                >
                  <TableCell className="text-center font-medium whitespace-nowrap">
                    {item.date}
                  </TableCell>
                  <TableCell className="text-center whitespace-nowrap">
                    {item.lunarDate}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="font-mono">
                      第{item.chunyunDay}天
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-blue-600">
                    {formatNumber(item.totalFlow)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatGrowth(item.totalFlowYoY)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatGrowth(item.totalFlowQoQ)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(item.railway)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(item.highway)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(item.waterway)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(item.aviation)}
                  </TableCell>
                  <TableCell className="text-center">
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      查看
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedData.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={11}
                    className="text-center py-8 text-gray-500"
                  >
                    暂无数据
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            显示第 {startIndex + 1} 到{' '}
            {Math.min(startIndex + ITEMS_PER_PAGE, filteredData.length)} 条，
            共 {filteredData.length} 条
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              上一页
            </Button>
            <span className="text-sm text-gray-600 px-4">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              下一页
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
