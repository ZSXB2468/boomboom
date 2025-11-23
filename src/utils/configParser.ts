// 配置文件解析和验证工具
// Configuration parser and validator

import yaml from 'js-yaml';
import type { GameConfig, Song, SelectionRules } from '~/types/config';

/**
 * 解析 YAML 配置文件
 * @param content YAML 文件内容
 * @returns 解析后的配置对象
 */
export function parseConfig(content: string): GameConfig {
  try {
    const config = yaml.load(content) as GameConfig;
    validateConfig(config);
    return config;
  } catch (error) {
    throw new Error(`YAML 配置文件解析失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 验证配置文件的有效性
 * @param config 配置对象
 */
export function validateConfig(config: GameConfig): void {
  // 验证基本结构
  if (!config.game || !config.songs || !config.players) {
    throw new Error('配置文件缺少必要字段: game, songs, players');
  }

  // 验证游戏设置
  if (config.game.rounds < 1) {
    throw new Error('游戏轮数必须大于0');
  }

  if (config.game.round_end_mode === 'fixed' && config.game.songs_per_round < 1) {
    throw new Error('每轮歌曲数必须大于0');
  }

  // 验证歌曲列表
  if (config.songs.length === 0) {
    throw new Error('歌曲列表不能为空');
  }

  const songIds = new Set<number>();
  for (const song of config.songs) {
    if (songIds.has(song.id)) {
      throw new Error(`重复的歌曲ID: ${song.id}`);
    }
    songIds.add(song.id);

    if (!song.title || !song.artist || !song.path) {
      throw new Error(`歌曲ID ${song.id} 缺少必要字段`);
    }
  }

  // 验证特殊曲目设置
  if (config.special_songs) {
    for (const special of config.special_songs) {
      if (!songIds.has(special.song_id)) {
        throw new Error(`特殊曲目引用了不存在的歌曲ID: ${special.song_id}`);
      }

      if (special.round < 1 || special.round > config.game.rounds) {
        throw new Error(`特殊曲目的轮次 ${special.round} 超出游戏总轮数`);
      }

      if (config.game.round_end_mode === 'fixed') {
        if (special.position !== -1 &&
            (special.position < 1 || special.position > config.game.songs_per_round)) {
          throw new Error(`特殊曲目的位置 ${special.position} 超出每轮歌曲数`);
        }
      }
    }
  }

  // 验证玩家列表
  if (config.players.length === 0) {
    throw new Error('玩家列表不能为空');
  }

  const playerIds = new Set<number>();
  for (const player of config.players) {
    if (playerIds.has(player.id)) {
      throw new Error(`重复的玩家ID: ${player.id}`);
    }
    playerIds.add(player.id);

    if (!player.name) {
      throw new Error(`玩家ID ${player.id} 缺少名称`);
    }
  }
}

/**
 * 解析路径，将相对路径转换为基于配置文件的绝对路径
 * @param path 原始路径
 * @param configBasePath 配置文件所在目录
 * @returns 解析后的路径
 */
export function resolvePath(path: string, configBasePath: string): string {
  // 如果是URL，直接返回
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // 如果是相对路径，基于配置文件目录解析
  if (path.startsWith('./') || path.startsWith('../')) {
    return new URL(path, `file://${configBasePath}/`).pathname;
  }

  // 绝对路径直接返回
  return path;
}

/**
 * 根据选择规则生成歌曲序列
 * @param config 游戏配置
 * @returns 每轮的歌曲ID数组
 */
export function generateSongSequence(config: GameConfig): number[][] {
  const { game, selection_rules, special_songs, songs } = config;
  const rounds: number[][] = [];

  // 创建可用歌曲池
  let availableSongs = [...songs];

  for (let round = 1; round <= game.rounds; round++) {
    const roundSongs: number[] = [];
    const songsNeeded = game.round_end_mode === 'fixed' ? game.songs_per_round : 10;

    // 获取本轮的特殊曲目
    const specialInThisRound = special_songs?.filter(s => s.round === round) || [];

    // 生成本轮歌曲
    for (let i = 0; i < songsNeeded; i++) {
      // 检查是否有特殊曲目需要在这个位置
      const specialAtPosition = specialInThisRound.find(
        s => s.position === i + 1 || (s.position === -1 && i === songsNeeded - 1)
      );

      if (specialAtPosition) {
        roundSongs.push(specialAtPosition.song_id);
        // 从可用歌曲池中移除
        if (!selection_rules.allow_duplicates) {
          availableSongs = availableSongs.filter(s => s.id !== specialAtPosition.song_id);
        }
      } else {
        // 按照选择规则选择歌曲
        const selectedSong = selectSong(availableSongs, selection_rules);
        if (selectedSong) {
          roundSongs.push(selectedSong.id);
          // 从可用歌曲池中移除
          if (!selection_rules.allow_duplicates) {
            availableSongs = availableSongs.filter(s => s.id !== selectedSong.id);
          }
        }
      }
    }

    rounds.push(roundSongs);

    // 如果允许重复，重置歌曲池
    if (selection_rules.allow_duplicates) {
      availableSongs = [...songs];
    }
  }

  return rounds;
}

/**
 * 根据选择规则选择一首歌
 * @param songs 可用歌曲列表
 * @param rules 选择规则
 * @returns 选中的歌曲
 */
function selectSong(songs: Song[], rules: SelectionRules): Song | null {
  if (songs.length === 0) return null;

  switch (rules.mode) {
    case 'sequential':
      return songs[0];

    case 'random':
      return songs[Math.floor(Math.random() * songs.length)];

    case 'weighted':
      return selectWeightedSong(songs, rules.weight_method);

    default:
      return songs[0];
  }
}

/**
 * 加权随机选择歌曲
 * @param songs 可用歌曲列表
 * @param weightMethod 权重计算方法
 * @returns 选中的歌曲
 */
function selectWeightedSong(songs: Song[], weightMethod: string): Song {
  let weights: number[];

  switch (weightMethod) {
    case 'score':
      weights = songs.map(s => s.score);
      break;
    case 'custom':
      weights = songs.map(s => s.weight);
      break;
    case 'equal':
    default:
      weights = songs.map(() => 1);
      break;
  }

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < songs.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return songs[i];
    }
  }

  return songs[songs.length - 1];
}

/**
 * 计算玩家得分
 * @param titleCorrect 歌名是否正确
 * @param artistCorrect 歌手是否正确
 * @param albumCorrect 专辑是否正确
 * @param answerTime 答题时间（秒）
 * @param song 歌曲信息
 * @param scoring 评分规则
 * @returns 得分
 */
export function calculateScore(
  titleCorrect: boolean,
  artistCorrect: boolean,
  albumCorrect: boolean,
  answerTime: number,
  song: Song,
  scoring: GameConfig['scoring']
): number {
  if (!titleCorrect) return 0;

  let score = song.score * scoring.title_correct;

  if (artistCorrect) {
    score += song.score * scoring.artist_correct;
  }

  if (albumCorrect) {
    score += song.score * scoring.album_bonus;
  }

  // 速度加成（前5秒内回答）
  if (answerTime <= 5) {
    score += scoring.speed_bonus;
  }

  return Math.round(score);
}

