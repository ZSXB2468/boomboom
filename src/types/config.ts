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
  weight_method: 'score' | 'custom' | 'equal';
}

export interface SpecialSong {
  song_id: number;
  round: number;
  position: number; // -1 表示最后一首
}

export interface Player {
  id: number;
  name: string;
  avatar: string;
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
  time_limit: number;
}

export interface UISettings {
  theme_color: string;
  show_cover: boolean;
  show_lyrics: boolean;
  show_leaderboard: boolean;
}

// 游戏运行时状态
export interface GameState {
  currentRound: number;
  currentSongIndex: number;
  scores: Map<number, number>; // player_id -> score
  playedSongs: number[]; // song ids
  roundSongs: number[][]; // songs for each round
}

