import {GameConfig, Player, Song} from "~/types/config";
import {calculateScore, getSpecialSong} from "~/utils/configParser";

export interface GameState {
  gameConfig: GameConfig;
  songSequence: Song[][] | Song[];
  currentRound: number;
  currentSongIndex: number;
  playerScores: Record<Player["id"], number>;
  songStartTimeStamp: number;
}

export interface Answer {
  songName: boolean;
  artist: boolean;
  album: boolean;
}

export class GameStateManager {
  private readonly gameState: GameState;

  constructor(initialState: GameState) {
    this.gameState = initialState;
  }

  public save() {
    saveGameState(this.gameState);
  }

  /**
   * 获取所有玩家的分数
   * @returns 玩家ID到分数的映射
   */
  public getPlayerScores(): Record<number, number> {
    return {...this.gameState.playerScores};
  }

  /**
   * 获取当前轮次（0-based）
   * @returns 当前轮次索引
   */
  public getCurrentRound(): number {
    return this.gameState.currentRound;
  }

  /**
   * 获取当前歌曲索引（0-based）
   * @returns 当前歌曲索引
   */
  public getCurrentSongIndex(): number {
    return this.gameState.currentSongIndex;
  }

  /**
   * 获取当前歌曲
   * @returns 当前歌曲，若无则返回 null
   */
  public getCurrentSong(): Song | null {
    const {gameConfig, songSequence, currentRound, currentSongIndex} = this.gameState;

    // 边界检查：确保 songSequence 不为空
    if (!songSequence || !Array.isArray(songSequence) || songSequence.length === 0) {
      return null;
    }

    if (Array.isArray(songSequence[0])) {
      const songs = songSequence as Song[][];
      const currentRoundSongs = songs[currentRound];
      if (currentRoundSongs && currentSongIndex < currentRoundSongs.length) {
        return currentRoundSongs[currentSongIndex];
      }
    } else {
      const songs = songSequence as Song[];

      // 检查是否有特殊曲目需要在这个位置
      const specialSong = getSpecialSong(gameConfig, currentRound, currentSongIndex + 1);

      if (specialSong) {
        return specialSong;
      } else {
        if (songs.length > 0) {
          return songs[0];
        }
      }
    }
    return null;
  }

  /**
   * 获取下一首歌曲
   * @returns 下一首歌曲，若无则返回 null
   */
  public nextSong(): Song | null {
    const {gameConfig, songSequence, currentRound} = this.gameState;

    if (Array.isArray(songSequence[0])) {
      // 二维数组模式：直接更新索引
      this.gameState.currentSongIndex++;
      this.gameState.songStartTimeStamp = Date.now(); // 重置时间戳
      this.save();

      return this.getCurrentSong();
    } else {
      // 一维数组模式：先更新索引，再检查新位置是否有特殊曲目
      this.gameState.currentSongIndex++;

      const specialSong = getSpecialSong(gameConfig, currentRound, this.gameState.currentSongIndex + 1);

      if (specialSong) {
        // 有特殊曲目，保持队列不变
        this.gameState.songStartTimeStamp = Date.now(); // 重置时间戳
        this.save();

        return this.getCurrentSong();
      } else {

        this.gameState.songStartTimeStamp = Date.now(); // 重置时间戳
        this.save();

        // 普通曲目，需要从队列中移除
        if (!gameConfig.selection_rules.allow_duplicates) {
          this.gameState.songSequence.shift();
        }
        return this.getCurrentSong();
      }
    }
  }

  /**
   * 手动结束一轮时获取最后一首歌并设置该轮结束
   * @returns 该轮的最后一首歌曲，若无则返回 null
   */
  public lastSong(): Song | null {
    const {gameConfig, songSequence, currentRound} = this.gameState;

    if (Array.isArray(songSequence[0])) {
      // 二维数组模式：每轮歌曲都预先生成
      const songs = songSequence as Song[][];
      const currentRoundSongs = songs[currentRound];

      if (!currentRoundSongs || currentRoundSongs.length === 0) {
        return null;
      }

      // 获取该轮的最后一首歌
      const lastSongInRound = currentRoundSongs[currentRoundSongs.length - 1];

      // 设置该轮结束：将索引设置为该轮歌曲总数，表示该轮已完成
      this.gameState.currentSongIndex = currentRoundSongs.length;
      this.gameState.songStartTimeStamp = Date.now(); // 重置时间戳
      this.save();

      return lastSongInRound;
    } else {
      // 一维数组模式：检查是否有指定为最后一首的特殊曲目
      const songs = songSequence as Song[];
      const specialSong = getSpecialSong(gameConfig, currentRound, -1);

      if (specialSong) {
        // 如果有指定为最后一首的特殊曲目，返回它
        const lastSongInRound = specialSong;

        // 手动结束该轮，设置为固定歌曲数或标记轮次结束
        if (gameConfig.game.round_end_mode === 'fixed') {
          this.gameState.currentSongIndex = gameConfig.game.songs_per_round;
        } else {
          // 对于手动模式，可以通过设置一个标记来表示轮次结束
          this.gameState.currentSongIndex = -1; // 使用-1表示手动结束
        }

        this.gameState.songStartTimeStamp = Date.now(); // 重置时间戳
        this.save();

        return lastSongInRound;
      } else {
        // 如果没有特殊的最后一首歌，返回队列中的第一首作为最后播放的歌
        if (songs.length > 0) {
          const lastSongInRound = songs[0];

          // 从队列中移除
          if (!gameConfig.selection_rules.allow_duplicates) {
            this.gameState.songSequence = songs.slice(1);
          }

          // 手动结束该轮
          if (gameConfig.game.round_end_mode === 'fixed') {
            this.gameState.currentSongIndex = gameConfig.game.songs_per_round;
          } else {
            this.gameState.currentSongIndex = -1; // 手动结束
          }

          this.gameState.songStartTimeStamp = Date.now(); // 重置时间戳
          this.save();

          return lastSongInRound;
        }
      }
    }

    return null;
  }

  /**
   * 开始下一轮游戏
   * @returns 下一轮的第一首歌曲，若游戏结束则返回 null
   */
  public nextRound(): Song | null {
    const {songSequence} = this.gameState;

    // 检查是否还有下一轮
    if (this.isLastRound()) {
      return null;
    }

    // 更新到下一轮
    this.gameState.currentRound++;
    this.gameState.currentSongIndex = 0;
    this.gameState.songStartTimeStamp = Date.now(); // 重置时间戳
    this.save();

    if (Array.isArray(songSequence[0])) {
      // 二维数组模式
      const songs = songSequence as Song[][];
      const currentRoundSongs = songs[this.gameState.currentRound];

      if (currentRoundSongs && currentRoundSongs.length > 0) {
        return currentRoundSongs[0];
      }
    } else {
      // 一维数组模式：获取当前轮的第一首歌（不调用 nextSong 避免索引错位）
      return this.getCurrentSong();
    }

    return null;
  }

  /**
   * 判断是否是当前轮的最后一首歌
   * @returns 如果是最后一首歌返回 true，否则返回 false
   */
  public isLastSong(): boolean {
    const {gameConfig, songSequence, currentRound, currentSongIndex} = this.gameState;

    if (Array.isArray(songSequence[0])) {
      // 二维数组模式
      const songs = songSequence as Song[][];
      const currentRoundSongs = songs[currentRound];

      if (!currentRoundSongs) return true;

      // 检查是否是当前轮的最后一首
      return currentSongIndex >= currentRoundSongs.length - 1;
    } else {
      // 一维数组模式
      if (gameConfig.game.round_end_mode === 'fixed') {
        // 固定歌曲数模式
        return currentSongIndex >= gameConfig.game.songs_per_round - 1;
      } else {
        // 手动结束模式，检查是否已经手动结束（currentSongIndex为-1）
        return currentSongIndex === -1;
      }
    }
  }

  /**
   * 判断是否是最后一轮
   * @returns 如果是最后一轮返回 true，否则返回 false
   */
  public isLastRound(): boolean {
    const {gameConfig, currentRound} = this.gameState;
    return currentRound >= gameConfig.game.rounds - 1;
  }


  /**
   * 添加玩家分数
   * @param player 玩家对象
   * @param answer 答题结果
   * @param buzzerTime 抢到回答权的时间戳（毫秒）
   */
  public addScore(player: Player, answer: Answer, buzzerTime: number) {
    const currentSong = this.getCurrentSong();
    if (!currentSong) {
      console.error('No current song available for scoring');
      return;
    }

    // 内部计算答题时间：从歌曲开始到抢到回答权的时间（秒）
    const songStartTime = this.gameState.songStartTimeStamp || Date.now();
    const answerTime = (buzzerTime - songStartTime) / 1000;

    // 计算本次得分
    const scoreThisRound = calculateScore(
      answer.songName,
      answer.artist,
      answer.album,
      answerTime,
      currentSong,
      this.gameState.gameConfig.scoring
    );

    // 累加分数而非覆盖
    this.gameState.playerScores[player.id] = (this.gameState.playerScores[player.id]) + scoreThisRound;

    // 保存状态
    this.save();
  }
}

/**
 * 检测 localStorage 中是否有有效的游戏配置
 * @returns 如果有效则返回游戏状态，否则返回 null
 */
export function detectValidGameState(): GameState | null {
  try {
    const gameConfigStr = localStorage.getItem('gameConfig');
    const songSequenceStr = localStorage.getItem('songSequence');
    const currentRoundStr = localStorage.getItem('currentRound');
    const currentSongIndexStr = localStorage.getItem('currentSongIndex');
    const playerScoresStr = localStorage.getItem('playerScores');

    if (!gameConfigStr || !songSequenceStr) {
      return null;
    }

    // 解析配置数据
    const gameConfig = JSON.parse(gameConfigStr);
    const songSequence = JSON.parse(songSequenceStr);
    const currentRound = currentRoundStr ? parseInt(currentRoundStr) : 0;
    const currentSongIndex = currentSongIndexStr ? parseInt(currentSongIndexStr) : 0;
    const playerScores = playerScoresStr ? JSON.parse(playerScoresStr) : {};

    // 验证配置是否有效
    if (!gameConfig || !gameConfig.players || !gameConfig.songs ||
      !Array.isArray(gameConfig.players) || !Array.isArray(gameConfig.songs) ||
      gameConfig.players.length === 0 || gameConfig.songs.length === 0 ||
      !songSequence || !Array.isArray(songSequence) || songSequence.length === 0) {
      return null;
    }

    // 验证必要字段
    if (!gameConfig.game || !gameConfig.scoring || !gameConfig.selection_rules) {
      return null;
    }

    return {
      gameConfig,
      songSequence,
      currentRound,
      currentSongIndex,
      playerScores,
      songStartTimeStamp: Date.now() // 初始化为当前时间
    };

  } catch (error) {
    console.error('Error detecting game state:', error);
    return null;
  }
}

/**
 * 清除游戏状态
 */
export function clearGameState(): void {
  localStorage.removeItem('gameConfig');
  localStorage.removeItem('songSequence');
  localStorage.removeItem('currentRound');
  localStorage.removeItem('currentSongIndex');
  localStorage.removeItem('playerScores');
  localStorage.removeItem('finishSongs');
}

/**
 * 保存游戏状态到 localStorage
 */
export function saveGameState(gameState: Partial<GameState>): void {
  if (gameState.gameConfig) {
    localStorage.setItem('gameConfig', JSON.stringify(gameState.gameConfig));
  }
  if (gameState.songSequence) {
    localStorage.setItem('songSequence', JSON.stringify(gameState.songSequence));
  }
  if (gameState.currentRound !== undefined) {
    localStorage.setItem('currentRound', gameState.currentRound.toString());
  }
  if (gameState.currentSongIndex !== undefined) {
    localStorage.setItem('currentSongIndex', gameState.currentSongIndex.toString());
  }
  if (gameState.playerScores) {
    localStorage.setItem('playerScores', JSON.stringify(gameState.playerScores));
  }
}
