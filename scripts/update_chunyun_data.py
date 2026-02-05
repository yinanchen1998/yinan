#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
春运数据自动更新脚本
功能：
1. 自动搜索2026年最新春运数据
2. 从交通运输部官网提取数据
3. 更新数据文件
4. 触发重新构建

定时运行：每天 9:00, 15:00, 21:00
"""

import requests
from bs4 import BeautifulSoup
import re
import json
import os
import sys
from datetime import datetime, timedelta
from urllib.parse import quote

# 添加项目根目录到路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# 配置
DATA_FILE = os.path.join(os.path.dirname(__file__), '..', 'src', 'utils', 'chunyunData.ts')
USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'

# 2026年春运日期范围
CHUNYUN_2026_START = datetime(2026, 2, 2)  # 腊月十五
CHUNYUN_2026_END = datetime(2026, 3, 13)   # 正月廿四


def get_lunar_date(date_obj):
    """获取农历日期"""
    lunar_map = {
        (2, 2): '腊月十五', (2, 3): '腊月十六', (2, 4): '腊月十七',
        (2, 5): '腊月十八', (2, 6): '腊月十九', (2, 7): '腊月二十',
        (2, 8): '腊月廿一', (2, 9): '腊月廿二', (2, 10): '腊月廿三',
        (2, 11): '腊月廿四', (2, 12): '腊月廿五', (2, 13): '腊月廿六',
        (2, 14): '腊月廿七', (2, 15): '腊月廿八', (2, 16): '腊月廿九',
        (2, 17): '除夕', (2, 18): '正月初一', (2, 19): '正月初二',
        (2, 20): '正月初三', (2, 21): '正月初四', (2, 22): '正月初五',
        (2, 23): '正月初六', (2, 24): '正月初七', (2, 25): '正月初八',
        (2, 26): '正月初九', (2, 27): '正月初十', (2, 28): '正月十一',
        (3, 1): '正月十二', (3, 2): '正月十三', (3, 3): '正月十四',
        (3, 4): '正月十五', (3, 5): '正月十六', (3, 6): '正月十七',
        (3, 7): '正月十八', (3, 8): '正月十九', (3, 9): '正月二十',
        (3, 10): '正月廿一', (3, 11): '正月廿二', (3, 12): '正月廿三',
        (3, 13): '正月廿四',
    }
    return lunar_map.get((date_obj.month, date_obj.day), '')


def get_chunyun_day(date_obj):
    """获取春运第几天"""
    delta = date_obj - CHUNYUN_2026_START
    return delta.days + 1


def search_mot_official(date_obj):
    """
    搜索交通运输部官网数据
    优先从官网获取，如果失败则使用网络搜索
    """
    date_str = date_obj.strftime('%Y年%m月%d日')
    date_iso = date_obj.strftime('%Y-%m-%d')
    
    print(f"🔍 搜索 {date_str} 的数据...")
    
    # 1. 首先尝试交通运输部官网
    mot_urls = [
        f"https://www.mot.gov.cn/zhuanti/2026chunyun/",
    ]
    
    for base_url in mot_urls:
        try:
            response = requests.get(base_url, headers={'User-Agent': USER_AGENT}, timeout=10)
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                # 查找包含该日期的链接
                links = soup.find_all('a', href=True)
                for link in links:
                    text = link.get_text()
                    if date_str.replace('年', '-').replace('月', '-').replace('日', '') in text or \
                       date_obj.strftime('%-m月%-d日') in text:
                        href = link['href']
                        if href.startswith('http'):
                            data = extract_from_url(href, date_iso)
                            if data:
                                return data
        except Exception as e:
            print(f"   官网搜索失败: {e}")
    
    # 2. 使用搜索引擎
    return search_via_engine(date_obj)


def search_via_engine(date_obj):
    """通过搜索引擎查找数据"""
    date_str = date_obj.strftime('%Y年%m月%d日')
    date_iso = date_obj.strftime('%Y-%m-%d')
    
    # 搜索关键词
    keywords = [
        f"{date_str} 全社会跨区域人员流动量 交通运输部",
        f"春运2026 {date_str} 交通运输部",
        f"2026年春运 {date_obj.strftime('%-m月%-d日')} 人员流动量",
    ]
    
    for keyword in keywords:
        try:
            # 使用Bing搜索（不需要Selenium）
            search_url = f"https://www.bing.com/search?q={quote(keyword)}"
            response = requests.get(
                search_url,
                headers={'User-Agent': USER_AGENT},
                timeout=15
            )
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # 查找搜索结果链接
                results = soup.find_all('a', href=True)
                for result in results[:10]:
                    href = result['href']
                    text = result.get_text()
                    
                    # 优先访问交通运输部官网链接
                    if 'mot.gov.cn' in href:
                        data = extract_from_url(href, date_iso)
                        if data:
                            return data
                    
                    # 或者访问可信的新闻源
                    if any(domain in href for domain in ['gov.cn', 'xinhuanet', 'people.cn', 'cctv.com','finance.sina']):
                        data = extract_from_url(href, date_iso)
                        if data:
                            return data
                            
        except Exception as e:
            print(f"   搜索失败: {e}")
    
    return None


def extract_from_url(url, date_iso):
    """从URL提取数据"""
    try:
        response = requests.get(url, headers={'User-Agent': USER_AGENT}, timeout=10)
        response.encoding = 'utf-8'
        
        if response.status_code != 200:
            return None
        
        soup = BeautifulSoup(response.text, 'html.parser')
        text = soup.get_text()
        
        # 提取标题
        title_tag = soup.find('h1') or soup.find('h2') or soup.find('title')
        title = title_tag.get_text(strip=True) if title_tag else f'2026年春运数据 {date_iso}'
        
        # 提取全社会跨区域人员流动量
        total_flow = None
        patterns = [
            r'全社会跨区域人员流动量[\s]*([\d.]+)[\s]*万人次',
            r'人员流动量[\s]*完成[\s]*([\d.]+)[\s]*万人次',
            r'人员流动量[\s]*([\d.]+)[\s]*万人次',
        ]
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                try:
                    total_flow = float(match.group(1))
                    break
                except:
                    continue
        
        if not total_flow:
            return None
        
        # 提取其他指标
        data = {
            'date': date_iso,
            'title': title,
            'url': url,
            'totalFlow': total_flow,
            'railway': None,
            'highway': None,
            'waterway': None,
            'aviation': None,
        }
        
        # 铁路
        railway_match = re.search(r'铁路[\s\S]{0,30}?客运量[\s]*([\d.]+)[\s]*万人次', text)
        if railway_match:
            data['railway'] = float(railway_match.group(1))
        
        # 公路
        highway_match = re.search(r'公路[\s\S]{0,30}?人员流动量[\s]*([\d.]+)[\s]*万人次', text)
        if highway_match:
            data['highway'] = float(highway_match.group(1))
        
        # 水路
        waterway_match = re.search(r'水路[\s\S]{0,30}?客运量[\s]*([\d.]+)[\s]*万人次', text)
        if waterway_match:
            data['waterway'] = float(waterway_match.group(1))
        
        # 民航
        aviation_match = re.search(r'民航[\s\S]{0,30}?客运量[\s]*([\d.]+)[\s]*万人次', text)
        if aviation_match:
            data['aviation'] = float(aviation_match.group(1))
        
        print(f"   ✅ 从 {url[:50]}... 提取到数据: {total_flow}万人次")
        return data
        
    except Exception as e:
        print(f"   提取失败: {e}")
        return None


def update_data_file(new_data):
    """更新数据文件"""
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            content = f.read()
        
        date_iso = new_data['date']
        
        # 检查是否已存在该日期
        if f"date: '{date_iso}'" in content:
            print(f"   ℹ️  {date_iso} 数据已存在，跳过")
            return False
        
        # 构建新的数据条目
        date_obj = datetime.strptime(date_iso, '%Y-%m-%d')
        lunar_date = get_lunar_date(date_obj)
        chunyun_day = get_chunyun_day(date_obj)
        
        # 构建数据条目
        data_entry = f"""  {{
    date: '{date_iso}',
    lunarDate: '{lunar_date}',
    chunyunDay: {chunyun_day},
    totalFlow: {new_data['totalFlow']},
    railway: {new_data['railway'] or 'null'},
    highway: {new_data['highway'] or 'null'},
    waterway: {new_data['waterway'] or 'null'},
    aviation: {new_data['aviation'] or 'null'},
    sourceUrl: '{new_data['url']}',
    sourceTitle: '{new_data['title']}',
  }},
"""
        
        # 插入到data2026数组中
        # 找到最后一个条目并插入其后
        pattern = r"(export const data2026: ChunyunDailyData\[\] = \[)"
        if re.search(pattern, content):
            # 在数组开始处插入（会按日期排序）
            content = re.sub(pattern, r"\1\n" + data_entry, content)
        
        # 写回文件
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"   ✅ 已更新 {date_iso} 数据到文件")
        return True
        
    except Exception as e:
        print(f"   ❌ 更新文件失败: {e}")
        return False


def get_missing_dates():
    """获取需要更新的日期列表"""
    today = datetime.now()
    
    # 如果春运还没开始，返回空列表
    if today < CHUNYUN_2026_START:
        print("ℹ️  2026年春运尚未开始")
        return []
    
    # 如果春运已结束，返回空列表
    if today > CHUNYUN_2026_END:
        print("ℹ️  2026年春运已结束")
        return []
    
    # 读取现有数据
    existing_dates = set()
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            content = f.read()
            # 查找所有2026年的日期
            matches = re.findall(r"date: '2026-(\d{2})-(\d{2})'", content)
            for month, day in matches:
                existing_dates.add(f"2026-{month}-{day}")
    except Exception as e:
        print(f"读取数据文件失败: {e}")
    
    # 计算需要更新的日期（从春运开始到昨天）
    missing_dates = []
    current = CHUNYUN_2026_START
    end_date = min(today - timedelta(days=1), CHUNYUN_2026_END)
    
    while current <= end_date:
        date_str = current.strftime('%Y-%m-%d')
        if date_str not in existing_dates:
            missing_dates.append(current)
        current += timedelta(days=1)
    
    return missing_dates


def main():
    """主函数"""
    print("=" * 60)
    print("🚄 春运数据自动更新脚本")
    print(f"⏰ 运行时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    # 获取需要更新的日期
    missing_dates = get_missing_dates()
    
    if not missing_dates:
        print("\n✅ 所有数据已是最新，无需更新")
        return
    
    print(f"\n📅 需要更新 {len(missing_dates)} 天的数据:")
    for d in missing_dates:
        print(f"   - {d.strftime('%Y-%m-%d')} ({get_lunar_date(d)})")
    
    # 逐个更新
    updated_count = 0
    for date_obj in missing_dates:
        print(f"\n{'='*60}")
        data = search_mot_official(date_obj)
        
        if data:
            if update_data_file(data):
                updated_count += 1
        else:
            print(f"   ❌ 未能获取 {date_obj.strftime('%Y-%m-%d')} 的数据")
        
        # 添加延迟，避免请求过快
        import time
        time.sleep(2)
    
    print(f"\n{'='*60}")
    print(f"📊 更新完成: {updated_count}/{len(missing_dates)} 天")
    
    # 如果有更新，触发重新构建
    if updated_count > 0:
        print("\n🔄 请手动运行 'npm run build' 重新构建项目")
        print("   或等待定时任务自动构建")


if __name__ == '__main__':
    main()
