# 燃炸英语夜 - 猜歌游戏

一个基于 SolidStart 构建的现场音乐猜歌游戏应用。

## 项目特性

- 🎵 支持多种歌曲选择模式（随机、顺序、加权随机）
- 🎯 灵活的评分系统
- 👥 多玩家/团队支持
- 🎨 可自定义的界面主题
- 📝 YAML 配置文件
- 🎪 特殊曲目和压轴歌曲设置
- 📊 实时排行榜

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

应用将在 http://localhost:3000 启动

### 生产构建

```bash
npm run build
npm start
```

## 配置文件

### 配置文件结构

游戏使用 YAML 格式的配置文件，包含以下主要部分：

- **游戏设置** (game): 游戏名称、轮数、结束方式
- **选择规则** (selection_rules): 歌曲抽取模式、权重计算
- **特殊曲目** (special_songs): 固定位置的特殊歌曲
- **玩家列表** (players): 参与玩家信息
- **歌曲列表** (songs): 所有可用歌曲及其元数据
- **播放设置** (playback): 播放时长、音量等
- **评分规则** (scoring): 得分计算方式
- **界面设置** (ui): 主题颜色、显示选项

### 配置文件示例

参考项目中的示例文件：

- `config.example.yaml` - 完整配置示例
- `config.test.yaml` - 简单测试配置
- `CONFIG_README.md` - 详细配置文档
- `CONFIG_QUICKREF.md` - 快速参考指南
- `config.schema.json` - JSON Schema 定义

### 路径支持

配置文件中的所有路径字段支持三种格式：

```yaml
# 相对路径（相对于配置文件位置）
- id: 1
  path: "./music/song.mp3"

# 绝对路径
- id: 2
  path: "/home/user/music/song.mp3"

# URL
- id: 3
  path: "https://example.com/music/song.mp3"
```

### 最小配置示例

```yaml
game:
  name: "我的游戏"
  rounds: 3
  round_end_mode: "fixed"
  songs_per_round: 5

selection_rules:
  mode: "random"
  allow_duplicates: false
  weight_method: "equal"

special_songs: []

players:
  - id: 1
    name: "玩家1"
    avatar: "./avatars/player1.jpg"

songs:
  - id: 1
    title: "歌曲名"
    artist: "歌手名"
    album: "专辑名"
    path: "./music/song.mp3"
    cover: "./covers/cover.jpg"
    score: 10
    weight: 1.0
    duration: 180
    tags: ["流行"]

playback:
  clip_duration: 30
  start_position: -1
  fade_duration: 2
  volume: 0.8

scoring:
  title_correct: 1.0
  artist_correct: 0.5
  album_bonus: 0.3
  speed_bonus: 5
  time_limit: 30

ui:
  theme_color: "#FF6B6B"
  show_cover: true
  show_lyrics: false
  show_leaderboard: true
```

## 使用方法

1. 准备配置文件（参考 `config.example.yaml`）
2. 准备音乐文件和封面图片
3. 启动应用
4. 在首页上传配置文件
5. 开始游戏

## 项目��构

```
boomboom/
├── src/
│   ├── routes/           # 路由页面
│   │   ├── config.tsx    # 首页（配置上传）
│   │   └── guess.tsx     # 游戏页面
│   ├── components/       # 组件
│   │   ├── FileInput.tsx # 文件上传组件
│   │   └── Album.tsx     # 专辑展示组件
│   ├── types/           # 类型定义
│   │   └── config.ts    # 配置文件类型
│   └── utils/           # 工具函数
│       └── configParser.ts  # 配置解析器
├── public/              # 静态资源
├── config.example.yaml  # 完整配置示例
├── config.test.yaml     # 测试配置
├── CONFIG_README.md     # 配置文档
└── CONFIG_QUICKREF.md   # 快速参考
```

## 技术栈

- [SolidJS](https://www.solidjs.com/) - 响应式 UI 框架
- [SolidStart](https://start.solidjs.com/) - 全栈框架
- [MDUI](https://www.mdui.org/) - Material Design UI 组件库
- [js-yaml](https://github.com/nodeca/js-yaml) - YAML 解析器
- TypeScript - 类型安全

## 开发指南

### 添加新功能

1. 在 `src/types/config.ts` 中定义类型
2. 在 `src/utils/configParser.ts` 中添加解析逻辑
3. 在对应的组件中实现功能
4. 更新配置文档

### 调试

使用浏览器开发者工具查看控制台输出：

```typescript
console.log("配置文件内容:", content);
console.log("生成的歌曲序列:", songSequence);
```

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可

MIT License

---

## SolidStart

Everything you need to build a Solid project, powered by [`solid-start`](https://start.solidjs.com);

## Creating a project

```bash
# create a new project in the current directory
npm init solid@latest

# create a new project in my-app
npm init solid@latest my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

Solid apps are built with _presets_, which optimise your project for deployment to different environments.

By default, `npm run build` will generate a Node app that you can run with `npm start`. To use a different preset, add it to the `devDependencies` in `package.json` and specify in your `app.config.js`.

## This project was created with the [Solid CLI](https://github.com/solidjs-community/solid-cli)
