// 配置文件类型定义
// Type definitions for the game configuration

export interface GameConfig {
  game: GameSettings;
  selection_rules: SelectionRules;
  special_songs: SpecialSong[];
  players: Player[];
  songs: Song[];
  playback: PlaybackSettings;
  scoring: ScoringRules;
  ui: UISettings;
}

export interface GameSettings {
  name: string;
  rounds: number;
  round_end_mode: 'fixed' | 'manual';
  songs_per_round: number;
}

export interface SelectionRules {
  mode: 'random' | 'sequential' | 'weighted';
  allow_duplicates: boolean;
}

export interface SpecialSong {
  song_id: number;
  round: number; // 轮次，配置文件中从 1 开始（1 表示第一轮），程序内部使用时会转换为 0-based
  position: number; // 位置，从 1 开始（1 表示第一首），-1 表示最后一首
}

export interface Player {
  id: number;
  name: string;
  avatar?: string; // 可选：忽略时使用name首字母，文字时显示最多前两个字，路径时显示图片
  team?: string;
}

export interface Song {
  id: number;
  title: string;
  artist: string;
  album: string;
  path: string;
  cover: string;
  score: number;
  weight: number;
  duration: number;
  chorus_time?: number; // 副歌开始时间点（秒），可选
  tags: string[];
  is_special?: boolean;
}

export interface PlaybackSettings {
  clip_duration: number; // -1 表示播放完整歌曲
  start_position: number; // -1 表示随机位置
  fade_duration: number;
  volume: number; // 0.0 - 1.0
}

export interface ScoringRules {
  title_correct: number;
  artist_correct: number;
  album_bonus: number;
  speed_bonus: number;
  speed_threshold?: number; // 快答阈值（秒），可选
  time_limit?: number; // 答题时限（秒），可选，不设置表示无限制
}

export interface UISettings {
  theme_color: string;
  show_cover: boolean;
  show_lyrics: boolean;
  show_leaderboard: boolean;
  background_image?: string; // 背景图片路径，可选
}
