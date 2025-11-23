# 配置文件快速参考

## 最小配置模板

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

## 字段速查表

### 抽取模式 (selection_rules.mode)
- `random`: 随机抽取
- `sequential`: 顺序抽取
- `weighted`: 加权随机

### 结束方式 (game.round_end_mode)
- `fixed`: 固定歌曲数
- `manual`: 手动截止

### 权重方法 (selection_rules.weight_method)
- `score`: 基于分值
- `custom`: 自定义权重
- `equal`: 平等权重

### 特殊位置 (special_songs.position)
- `1, 2, 3...`: 第几首
- `-1`: 最后一首

## 路径格式

```yaml
# 相对路径（推荐）
path: "./music/song.mp3"
path: "../songs/song.mp3"

# 绝对路径
path: "/home/user/music/song.mp3"
path: "C:/Music/song.mp3"

# URL
path: "https://example.com/music/song.mp3"
```

## 常用配置组合

### 1. 随机模式（适合练习）
```yaml
selection_rules:
  mode: "random"
  allow_duplicates: false
  weight_method: "equal"
```

### 2. 加权模式（难歌少出现）
```yaml
selection_rules:
  mode: "weighted"
  allow_duplicates: false
  weight_method: "custom"

# 在歌曲中设置较低的 weight
songs:
  - id: 1
    weight: 2.0  # 容易的歌，高权重
  - id: 2
    weight: 0.5  # 困难的歌，低权重
```

### 3. 顺序模式（适合教学）
```yaml
selection_rules:
  mode: "sequential"
  allow_duplicates: false
  weight_method: "equal"
```

### 4. 允许重复（歌曲少时）
```yaml
selection_rules:
  mode: "random"
  allow_duplicates: true
  weight_method: "equal"
```

## 评分计算示例

假设一首歌曲 `score: 10`，评分规则如下：
```yaml
scoring:
  title_correct: 1.0
  artist_correct: 0.5
  album_bonus: 0.3
  speed_bonus: 5
  time_limit: 30
```

**场景 1**: 只猜对歌名
```
得分 = 10 × 1.0 = 10分
```

**场景 2**: 猜对歌名和歌手
```
得分 = 10 × 1.0 + 10 × 0.5 = 15分
```

**场景 3**: 全部猜对（歌名+歌手+专辑）
```
得分 = 10 × 1.0 + 10 × 0.5 + 10 × 0.3 = 18分
```

**场景 4**: 全部猜对 + 5秒内回答
```
得分 = 10 × 1.0 + 10 × 0.5 + 10 × 0.3 + 5 = 23分
```

## 特殊曲目配置示例

### 开场曲 + 压轴曲
```yaml
special_songs:
  - song_id: 1
    round: 1
    position: 1     # 第1轮第1首
  - song_id: 99
    round: 3
    position: -1    # 第3轮最后一首
```

### 每轮都有压轴
```yaml
special_songs:
  - song_id: 10
    round: 1
    position: -1
  - song_id: 20
    round: 2
    position: -1
  - song_id: 30
    round: 3
    position: -1
```

### 中场彩蛋
```yaml
special_songs:
  - song_id: 15
    round: 2
    position: 3     # 第2轮第3首
```

## 常见问题

### Q: 歌曲数量不够怎么办？
A: 设置 `allow_duplicates: true` 允许重复，或减少轮数/每轮歌曲数

### Q: 如何让难歌少出现？
A: 使用 `weighted` 模式，给难歌设置较低的 `weight` 值

### Q: 如何固定某首歌的位置？
A: 在 `special_songs` 中配置该歌曲的轮次和位置

### Q: 支持哪些音频格式？
A: 浏览器支持的所有格式：mp3, ogg, wav, m4a 等

### Q: 路径可以用中文吗？
A: 可以，但建议使用英文以避免编码问题

### Q: 配置错误会怎样？
A: 上传时会显示详细的错误提示，指出具体问题

## 检查清单

上传配置前，请确认：

- [ ] 所有歌曲 ID 唯一
- [ ] 所有玩家 ID 唯一
- [ ] 歌曲数量足够（如果不允许重复）
- [ ] 特殊曲目的 song_id 存在
- [ ] 特殊曲目的位置合理
- [ ] 文件路径正确且文件存在
- [ ] 轮数和每轮歌曲数合理
- [ ] YAML 格式正确（缩进、冒号等）

## 更多信息

详细文档请参考 `CONFIG_README.md`
示例配置请参考 `config.example.yaml`
测试配置请参考 `config.test.yaml`

