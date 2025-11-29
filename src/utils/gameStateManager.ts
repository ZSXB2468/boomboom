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

  /**
   * 保存当前游戏状态到 localStorage
   */
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
   * 获取当前歌曲（内部实现）
   *
   * @param nextSong 是否移除上一首已播放的歌曲（仅在 Manual 模式下有效）
   *   - `false`: 仅查看当前歌曲，不修改歌曲池
   *   - `true`: 从歌曲池中移除上一首歌曲，返回移除后的当前歌曲（即原来的下一首）
   *
   * - Fixed 模式：总是根据 `currentSongIndex` 返回对应歌曲
   * - Manual 模式：歌曲池是动态的，`nextSong=true` 会修改 `songSequence`
   *
   * @returns 当前歌曲，若无则返回 null
   * @private
   */
  private _getCurrentSong(nextSong: boolean): Song | null {
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
        if(nextSong){
          this.gameState.songSequence.shift();
        }
        if (songs.length > 0) {
          return songs[0];
        }
      }
    }
    return null;
  }

  /**
   * 获取当前歌曲（公共接口）
   *
   * **注意**：此方法不会修改游戏状态，仅用于查询当前歌曲。
   * 如需推进游戏进度，请使用 `nextSong()` 或 `lastSong()` 方法。
   *
   * @returns 当前歌曲，若无则返回 null
   */
  public getCurrentSong(): Song | null {
    return this._getCurrentSong(false);
  }

  /**
   * 获取下一首歌曲
   * @returns 下一首歌曲，若无则返回 null
   */
  public nextSong(): Song | null {
    this.gameState.currentSongIndex++;
    this.gameState.songStartTimeStamp = Date.now(); // 重置时间戳
    this.save();
    return this._getCurrentSong(true);
  }

  /**
   * 手动结束当前轮次，获取该轮最后一首歌
   *
   * 调用此方法表示"声明接下来的一首为该轮最后一首"
   * - 会移除当前播放的歌曲（倒数第二首）
   * - 返回该轮的最后一首歌曲（可能是 position=-1 的特殊歌曲）
   *
   * @returns 该轮的最后一首歌曲，若无则返回 null
   */
  public lastSong(): Song | null {
    const {songSequence} = this.gameState;

    this.gameState.songStartTimeStamp = Date.now(); // 重置时间戳
    if (Array.isArray(songSequence[0])) {
      // 二维数组模式：每轮歌曲都预先生成
      // 设置该轮结束：将索引设置为该轮歌曲总数，表示该轮已完成
      this.gameState.currentSongIndex = this.gameState.gameConfig.game.songs_per_round - 1;
    } else {
      // 一维数组模式：检查是否有指定为最后一首的特殊曲目
      this.gameState.currentSongIndex = -2; // 使用-2表示手动结束
    }
    this.save();
    return this._getCurrentSong(true);
  }

  /**
   * 开始下一轮游戏
   * @returns 下一轮的第一首歌曲，若游戏结束则返回 null
   */
  public nextRound(): Song | null {
    // 检查是否还有下一轮
    if (this.isLastRound()) {
      return null;
    }

    // 更新到下一轮
    this.gameState.currentRound++;
    this.gameState.currentSongIndex = 0;
    this.gameState.songStartTimeStamp = Date.now(); // 重置时间戳
    this.save();

    return this._getCurrentSong(true);
  }

  /**
   * 判断是否是当前轮的最后一首歌
   * @returns 如果是最后一首歌返回 true，否则返回 false
   */
  public isLastSong(): boolean {
    const {songSequence, currentRound, currentSongIndex} = this.gameState;

    if (Array.isArray(songSequence[0])) {
      // 二维数组模式
      const songs = songSequence as Song[][];
      const currentRoundSongs = songs[currentRound];

      if (!currentRoundSongs) return true;

      // 检查是否是当前轮的最后一首
      return currentSongIndex >= currentRoundSongs.length - 1;
    } else {
      // 一维数组模式，即手动结束模式，检查是否已经手动结束（currentSongIndex为-2）
      return currentSongIndex === -2 || (songSequence as Song[]).length === 0;
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

    // 累加分数
    this.gameState.playerScores[player.id] = (this.gameState.playerScores[player.id] || 0) + scoreThisRound;

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
