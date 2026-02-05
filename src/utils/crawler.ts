/**
 * 春运数据采集模块
 * 从交通运输部官网爬取春运数据
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import type { ChunyunDailyData } from '@/types/chunyun';

// 创建axios实例
const crawler = axios.create({
  timeout: 30000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  },
});

/**
 * 从文章标题或内容中提取日期
 */
function extractDate(text: string): { date: string | null; chunyunDay: number | null; lunarDate: string | null } {
  // 匹配格式：3月4日、2月15日等
  const dateMatch = text.match(/(\d{1,2})月(\d{1,2})日/);
  if (!dateMatch) return { date: null, chunyunDay: null, lunarDate: null };
  
  const month = dateMatch[1].padStart(2, '0');
  const day = dateMatch[2].padStart(2, '0');
  
  // 提取春运第几天
  const chunyunMatch = text.match(/春运第(\d+)天/);
  const chunyunDay = chunyunMatch ? parseInt(chunyunMatch[1]) : null;
  
  // 提取农历日期
  const lunarMatch = text.match(/农历([正一二三四五六七八九十腊]+月[初十廿二三四五六七八九十]+)/);
  const lunarDate = lunarMatch ? lunarMatch[1] : '';
  
  return { 
    date: `${month}-${day}`, 
    chunyunDay, 
    lunarDate 
  };
}

/**
 * 从文本中提取数值（万人次）
 */
function extractValue(text: string, keyword: string): number | null {
  // 构建正则表达式，匹配关键词后的数值
  const regex = new RegExp(`${keyword}[\\s\\S]*?([\\d,]+(?:\\.\\d+)?)万人次`);
  const match = text.match(regex);
  if (match) {
    return parseFloat(match[1].replace(/,/g, ''));
  }
  return null;
}

/**
 * 从文本中提取增长率
 */
function extractGrowthRate(text: string, keyword: string): { yoY: number | undefined; qoQ: number | undefined } {
  const result: { yoY: number | undefined; qoQ: number | undefined } = { yoY: undefined, qoQ: undefined };
  
  // 查找关键词所在的段落
  const regex = new RegExp(`${keyword}[\\s\\S]*?(?=[◆>]|$)`, 'g');
  const match = text.match(regex);
  
  if (match) {
    const segment = match[0];
    
    // 提取同比增长
    const yoYMatch = segment.match(/比\d{4}年同期[增长下降]+([\d.]+)%/);
    if (yoYMatch) {
      const isDecrease = segment.includes('下降');
      result.yoY = isDecrease ? -parseFloat(yoYMatch[1]) : parseFloat(yoYMatch[1]);
    }
    
    // 提取环比增长
    const qoQMatch = segment.match(/环比[增长下降]+([\d.]+)%/);
    if (qoQMatch) {
      const isDecrease = segment.includes('下降');
      result.qoQ = isDecrease ? -parseFloat(qoQMatch[1]) : parseFloat(qoQMatch[1]);
    }
  }
  
  return result;
}

/**
 * 解析单条数据内容
 */
function parseDataContent(text: string, sourceUrl: string, year: number): ChunyunDailyData | null {
  const { date, chunyunDay, lunarDate } = extractDate(text);
  if (!date) return null;
  
  const fullDate = `${year}-${date}`;
  
  // 提取总流量
  const totalFlow = extractValue(text, '全社会跨区域人员流动量');
  if (!totalFlow) return null;
  
  // 提取各交通方式数据
  const railway = extractValue(text, '铁路客运量') || 0;
  const highway = extractValue(text, '公路人员流动量') || 
                  extractValue(text, '公路') || 0;
  const waterway = extractValue(text, '水路客运量') || 0;
  const aviation = extractValue(text, '民航客运量') || 0;
  
  // 提取增长率
  const totalGrowth = extractGrowthRate(text, '全社会跨区域人员流动量');
  const railwayGrowth = extractGrowthRate(text, '铁路客运量');
  const highwayGrowth = extractGrowthRate(text, '公路人员流动量');
  const waterwayGrowth = extractGrowthRate(text, '水路客运量');
  const aviationGrowth = extractGrowthRate(text, '民航客运量');
  
  // 提取公路细分数据
  const highwayPrivate = extractValue(text, '高速公路及普通国省道非营业性小客车人员出行量');
  const highwayCommercial = extractValue(text, '公路营业性客运量');
  
  return {
    date: fullDate,
    lunarDate: lunarDate || '',
    chunyunDay: chunyunDay || 0,
    totalFlow,
    totalFlowYoY: totalGrowth.yoY,
    totalFlowQoQ: totalGrowth.qoQ,
    railway,
    railwayYoY: railwayGrowth.yoY,
    railwayQoQ: railwayGrowth.qoQ,
    highway,
    highwayYoY: highwayGrowth.yoY,
    highwayQoQ: highwayGrowth.qoQ,
    highwayPrivate: highwayPrivate || undefined,
    highwayCommercial: highwayCommercial || undefined,
    waterway,
    waterwayYoY: waterwayGrowth.yoY,
    waterwayQoQ: waterwayGrowth.qoQ,
    aviation,
    aviationYoY: aviationGrowth.yoY,
    aviationQoQ: aviationGrowth.qoQ,
    sourceUrl,
  };
}

/**
 * 获取2024年春运数据列表
 */
export async function fetch2024DataList(): Promise<ChunyunDailyData[]> {
  const baseUrl = 'https://www.mot.gov.cn/zhuanti/2024chunyun/meirishuju/index.html';
  const dataList: ChunyunDailyData[] = [];
  
  try {
    // 获取第一页
    const response = await crawler.get(baseUrl);
    const $ = cheerio.load(response.data);
    
    // 获取所有数据链接
    const links: { url: string; title: string }[] = [];
    
    $('a').each((_, elem) => {
      const $elem = $(elem);
      const text = $elem.text().trim();
      if (text.includes('【春运数据】') && text.includes('全社会跨区域人员流动量')) {
        let href = $elem.attr('href') || '';
        // 处理相对路径
        if (href.startsWith('.')) {
          href = 'https://www.mot.gov.cn/zhuanti/2024chunyun/meirishuju/' + href.substring(1);
        } else if (!href.startsWith('http')) {
          href = 'https://www.mot.gov.cn' + href;
        }
        links.push({ url: href, title: text });
      }
    });
    
    // 获取分页链接
    let maxPage = 1;
    $('a').each((_, elem) => {
      const text = $(elem).text().trim();
      const num = parseInt(text);
      if (!isNaN(num) && num > maxPage) {
        maxPage = num;
      }
    });
    
    // 获取其他页面的数据链接
    for (let page = 2; page <= Math.min(maxPage, 5); page++) {
      try {
        const pageUrl = `https://www.mot.gov.cn/zhuanti/2024chunyun/meirishuju/index_${page}.html`;
        const pageResponse = await crawler.get(pageUrl);
        const $page = cheerio.load(pageResponse.data);
        
        $page('a').each((_, elem) => {
          const $elem = $page(elem);
          const text = $elem.text().trim();
          if (text.includes('【春运数据】') && text.includes('全社会跨区域人员流动量')) {
            let href = $elem.attr('href') || '';
            if (href.startsWith('.')) {
              href = 'https://www.mot.gov.cn/zhuanti/2024chunyun/meirishuju/' + href.substring(1);
            } else if (!href.startsWith('http')) {
              href = 'https://www.mot.gov.cn' + href;
            }
            links.push({ url: href, title: text });
          }
        });
      } catch (e) {
        console.error(`获取第${page}页失败:`, e);
      }
    }
    
    // 去重
    const uniqueLinks = links.filter((link, index, self) => 
      index === self.findIndex(l => l.url === link.url)
    );
    
    // 获取每个链接的详细数据
    for (const link of uniqueLinks.slice(0, 50)) { // 限制数量避免请求过多
      try {
        const detailResponse = await crawler.get(link.url);
        const $detail = cheerio.load(detailResponse.data);
        
        // 提取文章内容
        const content = $detail('.content, .TRS_Editor, #zoom, .detail-content, article').text() || 
                       $detail('body').text();
        
        if (content) {
          const data = parseDataContent(content, link.url, 2024);
          if (data) {
            data.sourceTitle = link.title;
            dataList.push(data);
          }
        }
      } catch (e) {
        console.error(`获取详情失败: ${link.url}`, e);
      }
    }
    
  } catch (error) {
    console.error('获取2024年数据列表失败:', error);
  }
  
  // 按日期排序
  return dataList.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * 获取2026年最新数据（从微信公众号文章）
 */
export async function fetch2026LatestData(): Promise<ChunyunDailyData[]> {
  // 2026年数据目前主要通过微信公众号发布
  // 这里返回模拟数据作为示例，实际使用时需要实现微信文章爬取
  // 或者手动更新数据
  return [];
}

/**
 * 获取指定年份的春运数据
 */
export async function fetchChunyunData(year: number): Promise<ChunyunDailyData[]> {
  if (year === 2024) {
    return fetch2024DataList();
  }
  // 其他年份的数据获取逻辑
  return [];
}

/**
 * 模拟获取2026年春运数据（用于演示）
 * 实际项目中这些数据应该从官网或API获取
 */
export function getMock2026Data(): ChunyunDailyData[] {
  return [
    {
      date: '2026-02-02',
      lunarDate: '腊月十五',
      chunyunDay: 1,
      totalFlow: 18498.6,
      totalFlowYoY: 11.3,
      totalFlowQoQ: -0.9,
      railway: 1223.5,
      railwayYoY: 17.8,
      railwayQoQ: -0.2,
      highway: 16985,
      highwayYoY: 10.8,
      highwayQoQ: -1.0,
      highwayPrivate: 14009,
      highwayCommercial: 2976,
      waterway: 66.7,
      waterwayYoY: 25.4,
      waterwayQoQ: -6.8,
      aviation: 223.4,
      aviationYoY: 7.4,
      aviationQoQ: -0.6,
      sourceUrl: 'https://mp.weixin.qq.com/s/4f9KJXKVc49pgjRqiHNtFQ',
      sourceTitle: '春运2026丨2月2日，全社会跨区域人员流动量完成18498.6万人次',
    },
    {
      date: '2026-02-03',
      lunarDate: '腊月十六',
      chunyunDay: 2,
      totalFlow: 19200,
      totalFlowYoY: 10.5,
      totalFlowQoQ: 3.8,
      railway: 1280,
      railwayYoY: 16.2,
      railwayQoQ: 4.6,
      highway: 17600,
      highwayYoY: 10.1,
      highwayQoQ: 3.6,
      highwayPrivate: 14500,
      highwayCommercial: 3100,
      waterway: 70,
      waterwayYoY: 22.0,
      waterwayQoQ: 4.9,
      aviation: 250,
      aviationYoY: 8.5,
      aviationQoQ: 11.9,
      sourceUrl: 'https://www.mot.gov.cn',
      sourceTitle: '春运2026丨2月3日数据',
    },
    {
      date: '2026-02-04',
      lunarDate: '腊月十七',
      chunyunDay: 3,
      totalFlow: 20150,
      totalFlowYoY: 11.8,
      totalFlowQoQ: 4.9,
      railway: 1350,
      railwayYoY: 18.5,
      railwayQoQ: 5.5,
      highway: 18400,
      highwayYoY: 11.2,
      highwayQoQ: 4.5,
      highwayPrivate: 15200,
      highwayCommercial: 3200,
      waterway: 75,
      waterwayYoY: 24.0,
      waterwayQoQ: 7.1,
      aviation: 325,
      aviationYoY: 12.0,
      aviationQoQ: 30.0,
      sourceUrl: 'https://www.mot.gov.cn',
      sourceTitle: '春运2026丨2月4日数据',
    },
  ];
}

export default {
  fetchChunyunData,
  fetch2024DataList,
  fetch2026LatestData,
  getMock2026Data,
};
