# 面试练习工具

一个基于React的AI面试练习平台，帮助求职者提升面试技巧和表达能力。

## 功能特性

- 🎯 **多岗位面试题库**：支持产品、前端、运营等多个岗位的面试题
- 🤖 **AI智能评分**：实时分析回答内容，提供专业的评分和建议
- 📊 **综合评分系统**：结合语言表达、面部表情、眼神交流、姿态等多个维度
- 🎭 **面试模拟器**：AI面试官实时观察和反馈
- 📚 **错题本功能**：记录和分析错误回答，帮助查漏补缺
- 🏆 **经验值系统**：通过练习获得经验值，提升段位等级
- 🌙 **黑夜/白天模式**：支持主题切换，保护视力

## 技术栈

- React 18
- Vite
- Tailwind CSS
- shadcn/ui
- TensorFlow.js (面部识别)
- Supabase (数据库)
- React Query

## 快速开始

### 本地开发

1. 克隆项目
```bash
git clone https://github.com/your-username/interview-practice-tool.git
cd interview-practice-tool
```

2. 安装依赖
```bash
npm install
```

3. 启动开发服务器
```bash
npm run dev
```

4. 打开浏览器访问 `http://localhost:5173`

### 构建部署

```bash
# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

## 环境变量配置

创建 `.env` 文件：

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_ALIYUN_API_KEY=your_aliyun_api_key
```

## 项目结构

```
src/
├── components/          # React组件
├── pages/              # 页面组件
├── utils/              # 工具函数
├── services/           # 服务层
├── data/               # 静态数据
└── integrations/       # 第三方集成
```

## 主要功能说明

### 面试练习模式
- 选择不同岗位进行针对性练习
- 压力模式：限时回答，模拟真实面试环境
- 实时关键词提示和评分反馈

### AI面试模拟器
- 启用摄像头进行面部表情识别
- 实时分析表情、眼神、姿态
- AI面试官观察记录和反馈

### 评分系统
- 内容质量评分（50%权重）
- 表情评分（20%权重）
- 眼神交流评分（15%权重）
- 姿态评分（15%权重）

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 许可证

MIT License
