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
from urllib.parse import quote, urljoin

# 添加项目根目录到路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# 配置
DATA_FILE = os.path.join(os.path.dirname(__file__), '..', 'src', 'utils', 'chunyunData.ts')
USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'

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
    
    # 1. 首先尝试交通运输部官网专题页面
    mot_urls = [
        "https://www.mot.gov.cn/zhuanti/2026chunyun/",
        "https://www.mot.gov.cn/searchs/search?searchstr=2026%E6%98%A5%E8%BF%90",
    ]
    
    for base_url in mot_urls:
        try:
            print(f"   尝试访问: {base_url}")
            headers = {
                'User-Agent': USER_AGENT,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            }
            response = requests.get(base_url, headers=headers, timeout=15)
            print(f"   响应状态: {response.status_code}")
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # 查找包含该日期的链接 - 尝试多种日期格式
                date_formats = [
                    date_obj.strftime('%Y-%m-%d'),  # 2026-02-05
                    date_obj.strftime('%Y%m%d'),     # 20260205
                    f"{date_obj.month}月{date_obj.day}日",  # 2月5日
                    f"{date_obj.month:02d}月{date_obj.day:02d}日",  # 02月05日
                    date_str,  # 2026年02月05日
                ]
                
                links = soup.find_all('a', href=True)
                print(f"   找到 {len(links)} 个链接")
                
                for link in links:
                    text = link.get_text(strip=True)
                    href = link['href']
                    
                    # 检查是否包含日期
                    for df in date_formats:
                        if df in text or df in href:
                            print(f"   发现匹配链接: {text[:50]}... -> {href[:80]}")
                            
                            # 处理相对链接
                            if href.startswith('//'):
                                full_url = 'https:' + href
                            elif href.startswith('/'):
                                full_url = 'https://www.mot.gov.cn' + href
                            elif href.startswith('http'):
                                full_url = href
                            else:
                                full_url = urljoin(base_url, href)
                            
                            result = extract_from_url(full_url, date_iso)
                            if result:
                                return result[0]  # 返回数据字典
                            break
        except Exception as e:
            print(f"   官网搜索失败: {e}")
    
    # 2. 使用搜索引擎
    return search_via_engine(date_obj)


def search_via_engine(date_obj):
    """通过搜索引擎查找数据 - 收集多个来源进行交叉验证"""
    date_str = date_obj.strftime('%Y年%m月%d日')
    date_iso = date_obj.strftime('%Y-%m-%d')
    short_date = f"{date_obj.month}月{date_obj.day}日"
    
    print(f"   尝试搜索引擎查找...")
    
    collected_data = []
    credibility_scores = []
    checked_urls = set()  # 避免重复检查
    
    # 搜索关键词
    keywords = [
        f"{date_str} 全社会跨区域人员流动量",
        f"2026年春运 {short_date}",
        f"{short_date} 春运 人员流动量 交通运输部",
    ]
    
    for keyword in keywords:
        try:
            print(f"   搜索关键词: {keyword}")
            
            # 使用 DuckDuckGo HTML 版本（无反爬虫）
            search_url = f"https://html.duckduckgo.com/html/?q={quote(keyword)}"
            headers = {
                'User-Agent': USER_AGENT,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'zh-CN,zh;q=0.9',
            }
            
            response = requests.get(search_url, headers=headers, timeout=20)
            print(f"   DuckDuckGo 响应: {response.status_code}")
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # DuckDuckGo 结果在 .result 类中
                results = soup.find_all('a', class_='result__a', href=True)
                if not results:
                    results = soup.find_all('a', href=True)
                
                print(f"   找到 {len(results)} 个结果")
                
                for result in results[:15]:
                    href = result.get('href', '')
                    text = result.get_text(strip=True)
                    
                    # 处理 DuckDuckGo 的重定向链接
                    if 'duckduckgo.com/l/?' in href and 'uddg=' in href:
                        import urllib.parse
                        parsed = urllib.parse.parse_qs(urllib.parse.urlparse(href).query)
                        if 'uddg' in parsed:
                            href = urllib.parse.unquote(parsed['uddg'][0])
                    
                    # 跳过已检查的URL
                    if href in checked_urls:
                        continue
                    checked_urls.add(href)
                    
                    # 过滤掉包含"预计"的链接（预测数据而非实际数据）
                    if '预计' in text:
                        print(f"   ✗ 跳过预测链接: {text[:40]}...")
                        continue
                    
                    print(f"   检查: {text[:40]}... | {href[:60]}")
                    
                    # 优先访问交通运输部官网链接
                    if 'mot.gov.cn' in href:
                        print(f"   ✓ 发现交通运输部链接")
                        result = extract_from_url(href, date_iso)
                        if result:
                            data, score = result
                            collected_data.append(data)
                            credibility_scores.append(score)
                            # 官方来源优先，但继续收集其他来源做交叉验证
                    
                    # 也访问可信的新闻源
                    trusted_domains = ['gov.cn', 'xinhuanet.com', 'people.com.cn', 'cctv.com', 
                                      'sina.com.cn', '163.com', 'qq.com', 'sohu.com',
                                      'thepaper.cn', 'jiemian.com', '21jingji.com']
                    if any(domain in href for domain in trusted_domains):
                        print(f"   ✓ 发现可信来源")
                        result = extract_from_url(href, date_iso)
                        if result:
                            data, score = result
                            # 避免重复数据
                            if not any(d['url'] == data['url'] for d in collected_data):
                                collected_data.append(data)
                                credibility_scores.append(score)
                    
                    # 如果已经收集了2个数据，停止搜索
                    if len(collected_data) >= 2:
                        break
                            
        except Exception as e:
            print(f"   搜索失败: {e}")
        
        # 如果已经收集了足够数据，停止关键词循环
        if len(collected_data) >= 2:
            break
    
    # 交叉验证收集到的数据
    if collected_data:
        return cross_validate_data(collected_data, date_obj, credibility_scores)
    
    # 3. 最后尝试直接构造可能的 URL
    return try_direct_urls(date_obj)


def try_direct_urls(date_obj):
    """尝试直接访问可能的 URL 模式，以及新浪财经兜底"""
    date_iso = date_obj.strftime('%Y-%m-%d')
    date_num = date_obj.strftime('%Y%m%d')
    
    # 常见的新闻 URL 模式
    possible_urls = [
        f"https://www.mot.gov.cn/searchs/search?searchstr={date_num}%E6%98%A5%E8%BF%90",
        f"https://www.mot.gov.cn/searchs/search?searchstr=2026%E6%98%A5%E8%BF%90{date_num}",
    ]
    
    for url in possible_urls:
        try:
            print(f"   尝试直接访问: {url}")
            result = extract_from_url(url, date_iso)
            if result:
                return result[0]  # 返回数据字典
        except Exception as e:
            print(f"   直接访问失败: {e}")
    
    # 最后尝试新浪财经作为兜底
    return fetch_sina_finance(date_obj)


def fetch_sina_finance(date_obj):
    """从新浪财经获取春运数据作为兜底和交叉验证"""
    date_iso = date_obj.strftime('%Y-%m-%d')
    short_date = f"{date_obj.month}月{date_obj.day}日"
    
    print(f"   尝试新浪财经...")
    
    keywords = [
        f"2026春运{short_date}全社会跨区域人员流动量",
        f"2026{short_date}春运人员流动量",
        f"交通运输部{short_date}春运",
    ]
    
    for keyword in keywords:
        try:
            search_url = f"https://search.sina.com.cn/?q={quote(keyword)}&c=news&from=channel&ie=utf-8"
            headers = {
                'User-Agent': USER_AGENT,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'zh-CN,zh;q=0.9',
            }
            
            response = requests.get(search_url, headers=headers, timeout=15)
            print(f"   新浪财经搜索响应: {response.status_code}")
            
            if response.status_code == 200:
                response.encoding = 'utf-8'
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # 查找搜索结果链接
                results = soup.find_all('a', href=True)
                
                for result in results[:10]:
                    href = result.get('href', '')
                    text = result.get_text(strip=True)
                    
                    # 过滤掉包含"预计"的链接（预测数据而非实际数据）
                    if '预计' in text:
                        print(f"   ✗ 跳过预测链接: {text[:40]}...")
                        continue
                    
                    # 优先新浪财经自己的新闻
                    if 'sina.com.cn' in href or 'finance.sina' in href:
                        print(f"   发现新浪财经链接: {text[:40]}...")
                        result = extract_from_url(href, date_iso)
                        if result:
                            return result[0]  # 返回数据字典
                    
                    # 也接受其他可信来源
                    if any(domain in href for domain in ['mot.gov.cn', 'xinhuanet.com', 'cctv.com']):
                        print(f"   发现其他可信来源: {text[:40]}...")
                        result = extract_from_url(href, date_iso)
                        if result:
                            return result[0]  # 返回数据字典
                        
        except Exception as e:
            print(f"   新浪财经搜索失败: {e}")
    
    return None


def cross_validate_data(data_list, date_obj, credibility_scores=None):
    """
    交叉验证多个数据源的数据
    返回最可靠的综合结果
    """
    if not data_list:
        return None
    
    if len(data_list) == 1:
        print(f"   仅有一个数据源，直接使用")
        return data_list[0]
    
    print(f"   交叉验证 {len(data_list)} 个数据源...")
    
    # 如果有可信度评分，优先使用高可信度的数据
    if credibility_scores:
        max_score = max(credibility_scores)
        if max_score >= 4:
            # 优先使用高可信度（带年份的日期匹配）的数据
            high_credibility_data = [d for d, s in zip(data_list, credibility_scores) if s >= 4]
            if high_credibility_data:
                print(f"   优先使用高可信度数据 (评分>=4)")
                data_list = high_credibility_data
    
    # 提取所有总量数据
    total_flows = [(i, d['totalFlow']) for i, d in enumerate(data_list) if d.get('totalFlow')]
    
    if len(total_flows) < 2:
        return data_list[0]
    
    # 检查一致性
    values = [v for _, v in total_flows]
    avg_value = sum(values) / len(values)
    max_diff = max(abs(v - avg_value) for v in values) / avg_value if avg_value > 0 else 0
    
    print(f"   总量对比: {values}, 平均: {avg_value:.0f}万, 最大差异: {max_diff:.1%}")
    
    # 如果差异小于3%，取平均值
    if max_diff <= 0.03:
        print(f"   ✓ 数据源一致性良好，取平均值")
        result = data_list[0].copy()
        result['totalFlow'] = round(avg_value, 1)
        return result
    
    # 如果差异在3-10%之间，优先选择官方来源或高可信度来源
    if max_diff <= 0.10:
        for data in data_list:
            if 'mot.gov.cn' in data.get('url', ''):
                print(f"   数据源差异{max_diff:.1%}，优先使用官方来源")
                return data
    
    # 如果差异较大，使用更严格的标准：
    # 1. 优先使用明确包含"完成"字样（表示实际数据而非预测）
    # 2. 选择数据源更详细的（有分项数据的）
    best_data = None
    best_score = -1
    
    for data in data_list:
        score = 0
        # 有铁路数据加分
        if data.get('railway'):
            score += 1
        # 有公路数据加分
        if data.get('highway'):
            score += 1
        # 标题包含"完成"加分（表示是实际数据）
        if '完成' in data.get('title', ''):
            score += 2
        # 标题包含"预计"减分（表示是预测数据）
        if '预计' in data.get('title', ''):
            score -= 1
            
        if score > best_score:
            best_score = score
            best_data = data
    
    if best_data:
        print(f"   ⚠ 数据源差异{max_diff:.1%}，选择数据最完整的来源")
        return best_data
    
    # 默认选择总量中位数（比平均值更稳健）
    sorted_values = sorted(values)
    median_value = sorted_values[len(sorted_values) // 2]
    median_data = next(d for d in data_list if d['totalFlow'] == median_value)
    print(f"   ⚠ 数据源差异{max_diff:.1%}，选择中位数")
    return median_data


def extract_from_url(url, date_iso):
    """从URL提取数据 - 带验证逻辑"""
    try:
        print(f"   📄 提取: {url[:70]}...")
        
        headers = {
            'User-Agent': USER_AGENT,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9',
        }
        
        response = requests.get(url, headers=headers, timeout=15)
        response.encoding = 'utf-8'
        
        if response.status_code != 200:
            print(f"   HTTP错误: {response.status_code}")
            return None
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # 移除脚本和样式元素
        for script in soup(["script", "style"]):
            script.decompose()
        
        text = soup.get_text(separator=' ', strip=True)
        
        # 提取标题
        title_tag = soup.find('h1') or soup.find('h2') or soup.find('title')
        title = title_tag.get_text(strip=True) if title_tag else f'2026年春运数据 {date_iso}'
        
        escaped_title = title.replace('\\', '/')
        print(f"   页面标题: {escaped_title[:60]}")
        
        # 提取数据 - 使用验证逻辑
        result = extract_data_with_validation(text, date_iso, url, title)
        if result[0] is None:
            return None
        return result
        
    except Exception as e:
        print(f"   提取失败: {e}")
        import traceback
        traceback.print_exc()
        return None


def validate_date_in_text(text, date_iso, chunyun_day):
    """
    验证文本中是否包含目标日期的信息
    使用更严格的验证逻辑，避免误匹配
    返回 (是否匹配, 匹配到的日期信息, 可信度评分)
    """
    date_obj = datetime.strptime(date_iso, '%Y-%m-%d')
    
    # 构建多种日期格式用于匹配
    date_patterns = [
        (date_obj.strftime('%-m月%-d日'), 3),      # 2月5日 (最高优先级)
        (date_obj.strftime('%m月%d日'), 3),         # 02月05日
        (date_obj.strftime('%Y年%-m月%-d日'), 4),   # 2026年2月5日 (最高优先级)
        (date_obj.strftime('%Y年%m月%d日'), 4),     # 2026年02月05日
    ]
    
    # 春运第几天的模式
    chunyun_patterns = [
        (f'春运第{chunyun_day}天', 2),
        (f'第{chunyun_day}天', 1),
    ]
    
    # 前后一天的日期（用于排除）
    yesterday = (date_obj - timedelta(days=1)).strftime('%-m月%-d日')
    yesterday2 = (date_obj - timedelta(days=1)).strftime('%Y年%-m月%-d日')
    tomorrow = (date_obj + timedelta(days=1)).strftime('%-m月%-d日')
    tomorrow2 = (date_obj + timedelta(days=1)).strftime('%Y年%-m月%-d日')
    
    # 检查是否包含前后一天的日期
    has_yesterday = yesterday in text or yesterday2 in text
    has_tomorrow = tomorrow in text or tomorrow2 in text
    
    # 计分系统
    score = 0
    matched_info = []
    
    # 检查目标日期匹配
    for pattern, points in date_patterns:
        if pattern in text:
            score += points
            matched_info.append(pattern)
            break
    
    # 检查春运天数匹配
    for pattern, points in chunyun_patterns:
        if pattern in text:
            score += points
            matched_info.append(pattern)
            break
    
    # 减分：如果包含前后一天的日期，且没有明确的目标日期前缀（如"2026年"）
    if has_yesterday and not any(p[0].startswith('2026年') for p in date_patterns if p[0] in text):
        score -= 2
        matched_info.append(f"⚠含{yesterday}")
    
    if has_tomorrow and not any(p[0].startswith('2026年') for p in date_patterns if p[0] in text):
        score -= 2
        matched_info.append(f"⚠含{tomorrow}")
    
    # 验证逻辑：
    # 分数 >= 3：可信（明确匹配目标日期）
    # 分数 = 2：可能可信（仅匹配春运天数，需人工确认）
    # 分数 < 2：不可信
    is_match = score >= 2
    
    return is_match, ' + '.join(matched_info) if matched_info else '无匹配', score


def extract_data_with_validation(text, date_iso, url, title):
    """
    从文本中提取数据，并进行验证
    确保提取到正确的指标和正确的日期
    返回 (data_dict, credibility_score) 或 (None, 0)
    """
    date_obj = datetime.strptime(date_iso, '%Y-%m-%d')
    chunyun_day = get_chunyun_day(date_obj)
    
    # 首先验证日期匹配
    is_date_match, matched_info, score = validate_date_in_text(text, date_iso, chunyun_day)
    
    if not is_date_match:
        print(f"   ⚠ 日期不匹配: 目标{date_obj.strftime('%-m月%-d日')}(春运第{chunyun_day}天)，可信度{score}")
        # 打印部分文本用于调试
        debug_text = text[:300].replace('\n', ' ')
        print(f"   文本预览: {debug_text}...")
        return None, 0
    
    if score < 3:
        print(f"   ⚠ 日期验证弱匹配: {matched_info} (可信度{score})，谨慎使用")
    else:
        print(f"   ✓ 日期验证通过: {matched_info} (可信度{score})")
    
    # 提取全社会跨区域人员流动量 - 增强验证
    total_flow = None
    
    # 优先匹配：找关键词后紧跟的数字（20-50个字符内）
    proximity_patterns = [
        # 标准格式，关键词和数字之间最多20个字符
        r'全社会跨区域人员流动量.{0,20}?([\d,]{3,}(?:\.\d+)?)\s*[万]?[\s]*人次',
        # 可能有"完成"字样
        r'全社会跨区域人员流动量.{0,30}?完成[\s：:]*([\d,]{3,}(?:\.\d+)?)',
        # 关键词后紧跟冒号或空格
        r'全社会跨区域人员流动量[\s：:]+([\d,]{3,}(?:\.\d+)?)',
    ]
    
    for pattern in proximity_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            try:
                num_str = match.group(1).replace(',', '')
                value = float(num_str)
                # 验证：春运每天应该在 3000万 - 50000万（5亿）之间
                if 3000 <= value <= 50000:
                    total_flow = value
                    print(f"   ✓ 数据验证通过 - 总量: {total_flow} 万 (匹配: {match.group(0)[:40]}...)")
                    break
            except:
                continue
    
    # 如果没找到，尝试宽松匹配
    if not total_flow:
        loose_patterns = [
            r'人员流动量[\s\w]*完成[\s：:]*([\d,]{3,}(?:\.\d+)?)[\s]*万?人次',
            r'人员流动量[\s：:]*([\d,]{3,}(?:\.\d+)?)[\s]*万?人次',
        ]
        for pattern in loose_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    num_str = match.group(1).replace(',', '')
                    value = float(num_str)
                    if 3000 <= value <= 50000:
                        total_flow = value
                        print(f"   ⚠ 宽松匹配 - 总量: {total_flow} 万")
                        break
                except:
                    continue
    
    if not total_flow:
        print(f"   ⚠ 未找到有效的人员流动量数据")
        debug_text = text[:500].replace('\n', ' ')
        print(f"   文本预览: {debug_text}...")
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
    
    # 提取各交通方式数据 - 使用类似的关键词邻近匹配
    
    # 铁路 - 找"铁路"关键词附近的客运量数字
    railway_match = re.search(r'铁路.{0,30}?客运量.{0,10}?([\d,]{2,}(?:\.\d+)?)', text, re.IGNORECASE)
    if not railway_match:
        railway_match = re.search(r'铁路.{0,30}?发送旅客.{0,10}?([\d,]{2,}(?:\.\d+)?)', text, re.IGNORECASE)
    if railway_match:
        try:
            val = float(railway_match.group(1).replace(',', ''))
            # 铁路春运单日一般在 500-2000 万之间
            if 100 <= val <= 3000:
                data['railway'] = val
        except:
            pass
    
    # 公路
    highway_match = re.search(r'公路.{0,30}?人员流动量.{0,10}?([\d,]{3,}(?:\.\d+)?)', text, re.IGNORECASE)
    if not highway_match:
        highway_match = re.search(r'公路.{0,30}?客流量.{0,10}?([\d,]{3,}(?:\.\d+)?)', text, re.IGNORECASE)
    if highway_match:
        try:
            val = float(highway_match.group(1).replace(',', ''))
            # 公路春运单日一般在 2000-40000 万之间
            if 1000 <= val <= 50000:
                data['highway'] = val
        except:
            pass
    
    # 水路
    waterway_match = re.search(r'水路.{0,30}?客运量.{0,10}?([\d,]{1,}(?:\.\d+)?)', text, re.IGNORECASE)
    if not waterway_match:
        waterway_match = re.search(r'水运.{0,30}?客运量.{0,10}?([\d,]{1,}(?:\.\d+)?)', text, re.IGNORECASE)
    if waterway_match:
        try:
            val = float(waterway_match.group(1).replace(',', ''))
            # 水路春运单日一般在 50-200 万之间
            if 10 <= val <= 500:
                data['waterway'] = val
        except:
            pass
    
    # 民航
    aviation_match = re.search(r'民航.{0,30}?客运量.{0,10}?([\d,]{1,}(?:\.\d+)?)', text, re.IGNORECASE)
    if not aviation_match:
        aviation_match = re.search(r'民航.{0,30}?发送旅客.{0,10}?([\d,]{1,}(?:\.\d+)?)', text, re.IGNORECASE)
    if not aviation_match:
        aviation_match = re.search(r'航空.{0,30}?客运量.{0,10}?([\d,]{1,}(?:\.\d+)?)', text, re.IGNORECASE)
    if aviation_match:
        try:
            val = float(aviation_match.group(1).replace(',', ''))
            # 民航春运单日一般在 100-300 万之间
            if 50 <= val <= 500:
                data['aviation'] = val
        except:
            pass
    
    # 数据合理性验证
    # 各分项之和应该接近总量（允许一定误差）
    subtotal = sum(v for v in [data['railway'], data['highway'], data['waterway'], data['aviation']] if v is not None)
    
    if subtotal > 0:
        ratio = subtotal / total_flow
        print(f"   📊 分项验证: 分项和={subtotal:.0f}万, 总量={total_flow:.0f}万, 比例={ratio:.1%}")
        
        # 如果分项和远大于总量（超过150%），可能是匹配到了错误的数据
        if ratio > 1.5:
            print(f"   ⚠ 警告: 分项和远大于总量，数据可能不准确")
            # 保留总量，但清空分项
            data['railway'] = None
            data['highway'] = None
            data['waterway'] = None
            data['aviation'] = None
        elif ratio < 0.5:
            print(f"   ⚠ 警告: 分项和远小于总量，可能部分数据未提取到")
    
    print(f"   ✅ 成功提取: 总量{total_flow}万, 铁路{data['railway']}, 公路{data['highway']}, 水路{data['waterway']}, 民航{data['aviation']}")
    return data, score


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
        
        # 构建数据条目 - 先处理特殊字符
        escaped_title = new_data['title'].replace("'", "\\'")
        data_entry = f"""  {{
    date: '{date_iso}',
    lunarDate: '{lunar_date}',
    chunyunDay: {chunyun_day},
    totalFlow: {new_data['totalFlow']},
    railway: {new_data['railway'] if new_data['railway'] is not None else 'null'},
    highway: {new_data['highway'] if new_data['highway'] is not None else 'null'},
    waterway: {new_data['waterway'] if new_data['waterway'] is not None else 'null'},
    aviation: {new_data['aviation'] if new_data['aviation'] is not None else 'null'},
    sourceUrl: '{new_data['url']}',
    sourceTitle: '{escaped_title}',
  }},
"""
        
        # 插入到data2026数组中
        pattern = r"(export const data2026: ChunyunDailyData\[\] = \[)"
        if re.search(pattern, content):
            content = re.sub(pattern, r"\1\n" + data_entry, content)
        
        # 写回文件
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"   ✅ 已更新 {date_iso} 数据到文件")
        return True
        
    except Exception as e:
        print(f"   ❌ 更新文件失败: {e}")
        import traceback
        traceback.print_exc()
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
        print(f"📋 现有数据: {len(existing_dates)} 天")
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
    print("=" * 70)
    print("🚄 春运数据自动更新脚本")
    print(f"⏰ 运行时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)
    
    # 检查数据文件是否存在
    if not os.path.exists(DATA_FILE):
        print(f"❌ 数据文件不存在: {DATA_FILE}")
        return
    
    print(f"📁 数据文件: {DATA_FILE}")
    
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
        print(f"\n{'='*70}")
        data = search_mot_official(date_obj)
        
        if data:
            if update_data_file(data):
                updated_count += 1
        else:
            print(f"   ❌ 未能获取 {date_obj.strftime('%Y-%m-%d')} 的数据")
        
        # 添加延迟，避免请求过快
        import time
        time.sleep(3)
    
    print(f"\n{'='*70}")
    print(f"📊 更新完成: {updated_count}/{len(missing_dates)} 天")
    
    # 如果有更新，触发重新构建
    if updated_count > 0:
        print("\n🔄 请手动运行 'npm run build' 重新构建项目")
        print("   或等待定时任务自动构建")


if __name__ == '__main__':
    main()
