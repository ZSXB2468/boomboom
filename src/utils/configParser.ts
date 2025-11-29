// 配置文件解析和验证工具
// Configuration parser and validator

import yaml from 'js-yaml';
import Ajv from 'ajv';
import type {GameConfig, Song, SelectionRules, ScoringRules} from '~/types/config';
import configSchemaYaml from './config.schema.yaml?raw';

// 初始化 Ajv 验证器
const ajv = new Ajv({ allErrors: true, verbose: true });

// 加载 schema
const schema = yaml.load(configSchemaYaml) as Record<string, any>;
const validateSchema = ajv.compile(schema);

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
  // 使用 JSON Schema 进行基础结构验证
  const valid = validateSchema(config);
  if (!valid) {
    const errors = validateSchema.errors || [];
    const errorMessages = errors.map(err => {
      const path = err.instancePath || err.schemaPath;
      return `${path}: ${err.message}`;
    }).join('; ');
    throw new Error(`配置文件验证失败: ${errorMessages}`);
  }

  // 以下是 schema 无法验证的运行时检查（如唯一性、引用完整性等）

  // 验证歌曲ID唯一性
  const songIds = new Set<number>();
  for (const song of config.songs) {
    if (songIds.has(song.id)) {
      throw new Error(`重复的歌曲ID: ${song.id}`);
    }
    songIds.add(song.id);
  }

  // 验证特殊曲目引用的歌曲ID存在性
  if (config.special_songs) {
    for (const special of config.special_songs) {
      if (!songIds.has(special.song_id)) {
        throw new Error(`特殊曲目引用了不存在的歌曲ID: ${special.song_id}`);
      }

      // 验证特殊曲目的轮次范围
      if (special.round < 1 || special.round > config.game.rounds) {
        throw new Error(`特殊曲目的轮次 ${special.round} 超出游戏总轮数（有效范围：1-${config.game.rounds}）`);
      }

      // 验证特殊曲目的位置范围（仅在 fixed 模式下）
      if (config.game.round_end_mode === 'fixed') {
        if (special.position !== -1 &&
          (special.position < 1 || special.position > config.game.songs_per_round)) {
          throw new Error(`特殊曲目的位置 ${special.position} 超出每轮歌曲数（有效范围：1-${config.game.songs_per_round} 或 -1）`);
        }
      }
    }
  }

  // 验证玩家ID唯一性
  const playerIds = new Set<number>();
  for (const player of config.players) {
    if (playerIds.has(player.id)) {
      throw new Error(`重复的玩家ID: ${player.id}`);
    }
    playerIds.add(player.id);
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
 * 检查指定位置是否为特殊歌曲
 * @param config 游戏配置
 * @param round 轮次（从 0 开始，0 表示第一轮）
 * @param position 位置（从1开始），-1表示最后一首
 * @returns 如果是特殊歌曲，返回对应的Song对象，否则返回null
 */
export function getSpecialSong(config: GameConfig, round: number, position: number): Song | null {
  // 获取本轮的特殊曲目
  // 注意：配置文件中 round 从 1 开始，需要转换为 0-based
  const specialInThisRound = config.special_songs?.filter(song => song.round === round + 1) || [];

  // 检查是否有特殊曲目在指定位置
  const specialAtPosition = specialInThisRound.find(song => song.position === position);

  if (specialAtPosition) {
    return config.songs.find(song => song.id === specialAtPosition.song_id) || null;
  }

  return null;
}

/**
 * 根据选择规则生成歌曲序列
 * @param config 游戏配置
 * @returns fixed 模式返回 Song[][]（预生成所有轮次），manual 模式返回 Song[]（歌曲池）
 */
export function generateSongSequence(config: GameConfig): Song[][] | Song[] {
  const {game, selection_rules, special_songs, songs} = config;

  // 创建可用歌曲池（移除所有特殊歌曲）
  let availableSongs = [...songs];
  for (const special of special_songs) {
    availableSongs = availableSongs.filter(song => song.id !== special.song_id);
  }

  if (game.round_end_mode === 'manual') {
    // manual 模式：返回一维数组（歌曲池）
    // 特殊歌曲会在运行时通过 getSpecialSong 动态获取
    return availableSongs;
  } else {
    // fixed 模式：预生成所有轮次的歌曲序列（二维数组）
    const rounds: Song[][] = [];

    for (let round = 0; round < game.rounds; round++) {
      const roundSongs: Song[] = [];
      const songsNeeded = game.songs_per_round;

      // 生成本轮歌曲
      for (let i = 0; i < songsNeeded; i++) {
        // 检查是否有特殊曲目需要在这个位置
        const position = i + 1;
        const specialSong = getSpecialSong(config, round, position) ||
          (i === songsNeeded - 1 ? getSpecialSong(config, round, -1) : null);

        if (specialSong) {
          // 使用特殊歌曲
          roundSongs.push(specialSong);
        } else {
          // 按照选择规则选择歌曲
          const selectedSong = selectSong(availableSongs, selection_rules);
          if (selectedSong) {
            roundSongs.push(selectedSong);
            // 每选一首歌就从池子移除，避免重复
            availableSongs = availableSongs.filter(s => s.id !== selectedSong.id);
          }
        }
      }

      rounds.push(roundSongs);
    }

    return rounds;
  }
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
      return selectWeightedSong(songs);

    default:
      return songs[0];
  }
}

/**
 * 加权随机选择歌曲
 * @param songs 可用歌曲列表
 * @returns 选中的歌曲
 */
function selectWeightedSong(songs: Song[]): Song {
  let weights: number[];
  weights = songs.map(s => s.weight);

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
  scoring: ScoringRules
): number {
  let score = 0;

  if (titleCorrect) {
    score += song.score * scoring.title_correct;
  }

  if (artistCorrect) {
    score += song.score * scoring.artist_correct;
  }

  if (albumCorrect) {
    score += scoring.album_bonus;
  }

  if (scoring.speed_threshold) {
    // 速度加成（前5秒内回答）
    if (answerTime <= scoring.speed_threshold) {
      score += scoring.speed_bonus;
    }
  }

  return Math.round(score);
}
