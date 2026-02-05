# 春运数据自动更新配置指南

## 功能说明

本项目支持自动更新2026年春运数据，每天自动运行3次（北京时间 9:00, 15:00, 21:00）。

## 自动更新原理

1. **定时触发**：GitHub Actions 每天自动运行3次
2. **数据抓取**：脚本自动搜索交通运输部官网获取最新数据
3. **文件更新**：自动更新 `src/utils/chunyunData.ts` 文件
4. **自动部署**：数据更新后自动触发 Netlify 重新构建部署

## 配置步骤

### 1. 配置 Netlify Build Hook

1. 登录 Netlify 控制台
2. 进入你的项目 → Site settings → Build & deploy → Build hooks
3. 点击 "Add build hook"
4. 名称填写：`GitHub Auto Update`
5. 复制生成的 webhook URL（格式如：`https://api.netlify.com/build_hooks/xxxxx`）

### 2. 配置 GitHub Secrets

1. 打开你的 GitHub 仓库
2. 进入 Settings → Secrets and variables → Actions
3. 点击 "New repository secret"
4. 名称填写：`NETLIFY_BUILD_HOOK`
5. 值填写：上一步复制的 Netlify webhook URL

### 3. 启用 GitHub Actions

1. 进入仓库的 Actions 页面
2. 找到 "Auto Update Chunyun Data" 工作流
3. 点击 "Enable workflow"

## 手动触发更新

如果急需更新数据，可以手动触发：

1. 进入 GitHub 仓库的 Actions 页面
2. 选择 "Auto Update Chunyun Data"
3. 点击 "Run workflow"

## 本地测试更新脚本

```bash
# 安装依赖
pip install requests beautifulsoup4

# 运行更新脚本
python scripts/update_chunyun_data.py
```

## 数据更新日志

每次更新后，GitHub Actions 会自动提交一条 commit，格式为：
```
Auto-update: 2026 Chunyun data 2026-02-05 09:00
```

## 常见问题

### Q: 数据没有自动更新？

A: 请检查以下几点：
1. GitHub Actions 是否已启用
2. `NETLIFY_BUILD_HOOK` Secret 是否正确配置
3. 查看 Actions 运行日志是否有错误

### Q: 如何修改更新频率？

A: 编辑 `.github/workflows/auto-update.yml` 文件中的 `schedule` 部分：
```yaml
schedule:
  - cron: '0 1 * * *'   # 北京时间 9:00
  - cron: '0 7 * * *'   # 北京时间 15:00
  - cron: '0 13 * * *'  # 北京时间 21:00
```

Cron 表达式格式：`分 时 日 月 周`

### Q: 数据来源是什么？

A: 脚本会按以下优先级获取数据：
1. 交通运输部官网 (mot.gov.cn)
2. 官方新闻网站 (新华社、人民网、央视等)
3. 搜索引擎结果

### Q: 2026年春运结束后还会更新吗？

A: 不会。脚本会自动检测春运时间范围（2026-02-02 至 2026-03-13），春运结束后自动停止更新。

## 技术细节

### 数据抓取流程

```
定时触发
    ↓
搜索交通运输部官网
    ↓
提取数据字段
    - 全社会跨区域人员流动量
    - 铁路客运量
    - 公路人员流动量
    - 水路客运量
    - 民航客运量
    ↓
更新数据文件
    ↓
提交到 GitHub
    ↓
触发 Netlify 部署
```

### 文件结构

```
scripts/
  └── update_chunyun_data.py    # 数据更新脚本
.github/
  └── workflows/
      └── auto-update.yml        # GitHub Actions 配置
src/
  └── utils/
      └── chunyunData.ts         # 数据文件（自动更新）
```

## 联系方式

如有问题，请在 GitHub Issues 中反馈。
