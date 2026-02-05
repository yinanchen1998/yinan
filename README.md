# 春运数据看板 (Chunyun Dashboard)

![GitHub Actions](https://github.com/YOUR_USERNAME/YOUR_REPO_NAME/workflows/Auto%20Update%20Chunyun%20Data/badge.svg)

📊 展示2023-2026年春运数据的交互式看板，数据来源于交通运输部官方发布。

🔗 **在线访问**: https://springfestival2026.netlify.app/

## 功能特性

- 📈 **多维度数据展示**：全社会跨区域人员流动量、铁路、公路、水路、民航客运量
- 📅 **四年对比**：2023-2026年数据对比，按农历对齐（除夕为基准）
- 📊 **可视化图表**：折线图、柱状图展示数据趋势
- 💾 **数据导出**：支持导出CSV和JSON格式
- 🔄 **自动更新**：2026年数据每天自动更新3次

## 技术栈

- **前端**: React + TypeScript + Vite
- **样式**: Tailwind CSS + shadcn/ui
- **图表**: Recharts
- **部署**: Netlify
- **自动更新**: GitHub Actions

## 数据说明

| 年份 | 数据来源 | 数据完整性 |
|------|----------|-----------|
| 2023 | 交通运输部官网 | ✅ 完整 |
| 2024 | 交通运输部官网 | ✅ 完整 |
| 2025 | 交通运输部官网 | ✅ 完整 |
| 2026 | 交通运输部官网 | 🔄 自动更新中 |

## 自动更新配置

本项目支持自动更新2026年春运数据，详细配置请参考 [UPDATE_GUIDE.md](./UPDATE_GUIDE.md)。

### 快速配置

1. **配置 Netlify Build Hook**
   - 登录 Netlify 控制台 → Site settings → Build hooks
   - 创建新的 build hook，复制 URL

2. **配置 GitHub Secrets**
   - 仓库 Settings → Secrets → Actions
   - 添加 `NETLIFY_BUILD_HOOK`，值为上一步的 URL

3. **启用 Actions**
   - 仓库 Actions 页面 → 启用 "Auto Update Chunyun Data"

### 更新频率

- 每天 9:00、15:00、21:00（北京时间）自动检查更新
- 仅在数据有变化时才会触发重新部署

## 本地开发

```bash
# 克隆仓库
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 项目结构

```
.
├── .github/workflows/        # GitHub Actions 配置
│   └── auto-update.yml       # 自动更新工作流
├── scripts/                  # 自动化脚本
│   └── update_chunyun_data.py # 数据更新脚本
├── src/
│   ├── components/           # React 组件
│   ├── utils/
│   │   └── chunyunData.ts    # 数据文件
│   └── ...
├── UPDATE_GUIDE.md           # 自动更新配置指南
└── README.md                 # 本文件
```

## 数据来源

- [中华人民共和国交通运输部](https://www.mot.gov.cn/)
- [交通运输部春运专栏](https://www.mot.gov.cn/zhuanti/2026chunyun/)

## License

MIT
