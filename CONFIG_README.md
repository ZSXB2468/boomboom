# 配置文件说明文档

## 概述

本文档描述了"燃炸英语夜"猜歌游戏的配置文件结构。配置文件使用 YAML 格式，支持灵活的歌曲管理、玩家设置和游戏规则定义。

## 文件格式

配置文件使用 YAML 格式（`.yaml` 或 `.yml` 扩展名），也兼容 JSON 和 TOML 格式。

## 配置结构

### 1. 游戏基本设置 (game)

```yaml
game:
  name: "燃炸英语夜"           # 游戏名称
  rounds: 3                      # 总轮数
  round_end_mode: "fixed"        # 结束方式: "fixed" (固定歌曲数) / "manual" (手动截止)
  songs_per_round: 5             # 每轮歌曲数（当 round_end_mode 为 "fixed" 时有效）
```

**字段说明：**
- `name`: 游戏显示名称
- `rounds`: 游戏总共有多少轮
- `round_end_mode`: 
  - `fixed`: 每轮播放固定数量的歌曲后自动结束
  - `manual`: 由主持人手动控制每轮结束
- `songs_per_round`: 当 `round_end_mode` 为 `fixed` 时，每轮播放的歌曲数量

### 2. 歌曲抽取规则 (selection_rules)

```yaml
selection_rules:
  mode: "weighted"               # 抽取模式
  allow_duplicates: false        # 是否允许重复抽取
  weight_method: "custom"        # 权重计算方式
```

**字段说明：**
- `mode`: 歌曲抽取模式
  - `random`: 完全随机抽取
  - `sequential`: 按歌曲列表顺序抽取
  - `weighted`: 加权随机抽取（根据权重值）
- `allow_duplicates`: 是否允许在不同轮次中重复播放同一首歌
- `weight_method`: 权重计算方式（当 mode 为 "weighted" 时使用）
  - `score`: 基于歌曲分值作为权重
  - `custom`: 使用歌曲的自定义权重值
  - `equal`: 所有歌曲权重相等

### 3. 特殊曲目设置 (special_songs)

```yaml
special_songs:
  - song_id: 5      # 歌曲ID
    round: 2        # 出现在第几轮
    position: 3     # 出现在该轮的第几首（-1 表示最后一首）
  - song_id: 10
    round: 3
    position: -1    # 最后一首
```

**字段说明：**
- `song_id`: 歌曲ID（对应 songs 列表中的 id）
- `round`: 该歌曲固定出现在第几轮（从 1 开始）
- `position`: 该歌曲在该轮中的位置
  - 正数：表示第几首（从 1 开始）
  - -1：表示该轮的最后一首

**用途：** 用于设置压轴曲目、惊喜歌曲等特殊安排。

### 4. 玩家列表 (players)

```yaml
players:
  - id: 1
    name: "张三"
    avatar: "./avatars/zhangsan.jpg"
    team: "红队"
  - id: 2
    name: "李四"
    avatar: "https://example.com/avatars/lisi.jpg"
    team: "红队"
```

**字段说明：**
- `id`: 玩家唯一标识符
- `name`: 玩家姓名
- `avatar`: 玩家头像路径（支持相对路径、绝对路径、URL）
- `team`: 队伍名称（可选，用于团队模式）

### 5. 歌曲列表 (songs)

```yaml
songs:
  - id: 1
    title: "Shape of You"
    artist: "Ed Sheeran"
    album: "÷ (Divide)"
    path: "./music/ed_sheeran/shape_of_you.mp3"
    cover: "./covers/divide.jpg"
    score: 10
    weight: 1.0
    duration: 233
    tags: ["流行", "热门", "2017"]
    is_special: false
```

**字段说明：**
- `id`: 歌曲唯一标识符（必须唯一）
- `title`: 歌曲名称
- `artist`: 歌手/艺术家名称
- `album`: 专辑名称
- `path`: 歌曲文件路径（支持三种格式）
  - 相对路径：`./music/song.mp3`（相对于配置文件位置）
  - 绝对路径：`/home/user/music/song.mp3`
  - URL：`https://example.com/music/song.mp3`
- `cover`: 专辑封面图片路径（格式同上）
- `score`: 歌曲基础分值
- `weight`: 加权随机抽取时的权重值
- `duration`: 歌曲时长（秒）
- `tags`: 标签列表（用于分类和搜索）
- `is_special`: 是否为特殊歌曲（可选）

### 6. 播放设置 (playback)

```yaml
playback:
  clip_duration: 30      # 播放时长（秒）
  start_position: -1     # 开始位置（秒）
  fade_duration: 2       # 淡入淡出时长（秒）
  volume: 0.8            # 音量 (0.0 - 1.0)
```

**字段说明：**
- `clip_duration`: 每首歌播放的时长（秒）
  - -1：播放完整歌曲
  - 正数：播放指定秒数
- `start_position`: 从歌曲的第几秒开始播放
  - -1：随机位置
  - 0：从头开始
  - 正数：从指定秒数开始
- `fade_duration`: 音频淡入淡出效果的时长
- `volume`: 播放音量（0.0 为静音，1.0 为最大音量）

### 7. 评分规则 (scoring)

```yaml
scoring:
  title_correct: 1.0      # 猜对歌名得分比例
  artist_correct: 0.5     # 猜对歌手得分比例
  album_bonus: 0.3        # 猜对专辑额外加分比例
  speed_bonus: 5          # 快速答题额外加分
  time_limit: 30          # 答题时间限制（秒）
```

**字段说明：**
- `title_correct`: 猜对歌名时，获得歌曲基础分值的倍数
- `artist_correct`: 猜对歌手时，额外获得歌曲基础分值的倍数
- `album_bonus`: 猜对专辑时，额外获得歌曲基础分值的倍数
- `speed_bonus`: 在前 5 秒内答对的额外加分
- `time_limit`: 答题时间限制（超时视为放弃）

**计分公式：**
```
总分 = 歌曲分值 × title_correct 
     + 歌曲分值 × artist_correct (如果猜对歌手)
     + 歌曲分值 × album_bonus (如果猜对专辑)
     + speed_bonus (如果在5秒内答题)
```

### 8. 界面设置 (ui)

```yaml
ui:
  theme_color: "#FF6B6B"     # 主题色
  show_cover: true            # 是否显示专辑封面
  show_lyrics: false          # 是否显示歌词
  show_leaderboard: true      # 是否显示实时排行榜
```

**字段说明：**
- `theme_color`: 界面主题颜色（CSS 颜色值）
- `show_cover`: 播放时是否显示专辑封面
- `show_lyrics`: 是否显示歌词（需要歌词文件）
- `show_leaderboard`: 是否实时显示玩家排行榜

## 路径说明

配置文件中的所有路径字段（`path`、`cover`、`avatar` 等）支持三种格式：

1. **相对路径**：以 `./` 或 `../` 开头
   - 相对于配置文件所在目录
   - 例如：`./music/song.mp3`

2. **绝对路径**：以 `/` 开头（Linux/Mac）或盘符开头（Windows）
   - 例如：`/home/user/music/song.mp3`
   - 例如：`C:/Music/song.mp3`

3. **URL**：以 `http://` 或 `https://` 开头
   - 例如：`https://example.com/music/song.mp3`

## 使用示例

### 场景 1：简单的随机模式游戏

```yaml
game:
  name: "周末练习赛"
  rounds: 2
  round_end_mode: "fixed"
  songs_per_round: 10

selection_rules:
  mode: "random"
  allow_duplicates: false
  weight_method: "equal"

special_songs: []

players:
  - id: 1
    name: "小明"
    avatar: "./avatars/xiaoming.jpg"
  - id: 2
    name: "小红"
    avatar: "./avatars/xiaohong.jpg"

songs:
  # ... 添加至少 20 首歌曲
```

### 场景 2：带特殊曲目的正式比赛

```yaml
game:
  name: "年度总决赛"
  rounds: 3
  round_end_mode: "fixed"
  songs_per_round: 8

selection_rules:
  mode: "weighted"
  allow_duplicates: false
  weight_method: "custom"

special_songs:
  - song_id: 100    # 开场曲
    round: 1
    position: 1
  - song_id: 200    # 第二轮压轴
    round: 2
    position: -1
  - song_id: 300    # 终极挑战
    round: 3
    position: -1

players:
  - id: 1
    name: "红队选手A"
    avatar: "./avatars/red_a.jpg"
    team: "红队"
  - id: 2
    name: "红队选手B"
    avatar: "./avatars/red_b.jpg"
    team: "红队"
  - id: 3
    name: "蓝队选手A"
    avatar: "./avatars/blue_a.jpg"
    team: "蓝队"
  - id: 4
    name: "蓝队选手B"
    avatar: "./avatars/blue_b.jpg"
    team: "蓝队"

songs:
  # ... 添加足够数量的歌曲
```

## 注意事项

1. **歌曲数量**：确保歌曲数量足够支撑所有轮次
   - 如果不允许重复：歌曲数 ≥ 轮数 × 每轮歌曲数
   - 如果允许重复：至少需要几首歌曲即可

2. **特殊曲目位置**：特殊曲目的位置不能超出每轮的歌曲数量

3. **文件路径**：确保所有路径指向的文件都存在且可访问

4. **ID 唯一性**：歌曲 ID 和玩家 ID 必须唯一

5. **权重值**：在加权随机模式下，权重值越大，被抽中的概率越高

## 验证配置

上传配置文件后，系统会自动验证：
- 必填字段是否完整
- ID 是否唯一
- 数值是否合理
- 特殊曲目引用是否有效

如果验证失败，会显示详细的错误信息。

## 文件示例

完整的示例配置文件请参考 `config.example.yaml`。

