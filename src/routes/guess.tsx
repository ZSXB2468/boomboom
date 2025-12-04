import {Title} from "@solidjs/meta";
import {createSignal, Show, onMount} from "solid-js";
import {useNavigate} from "@solidjs/router";
import {snackbar} from 'mdui/functions/snackbar.js';
import Album from "~/components/Album";
import ScoreBoard from "~/components/ScoreBoard";
import {detectValidGameState, GameStateManager} from "~/utils/gameStateManager";
import type {GameConfig, Song, Player} from "~/types/config";
import type {Answer} from "~/utils/gameStateManager";
import {useAudioPlayer} from "~/hooks/useAudioPlayer";
import {checkAndRestoreLocalDirectory, showDirectorySelectionPrompt} from "~/utils/fileSystemManager";
import "~/styles/guess.css";

export default function Guess() {
  const [showAnswer, setShowAnswer] = createSignal(false);
  const [buzzerTime, setBuzzerTime] = createSignal<number | null>(null); // 抢答时间戳
  const [gameConfig, setGameConfig] = createSignal<GameConfig | null>(null);
  const [currentSong, setCurrentSong] = createSignal<Song | null>(null);
  const [answeredSong, setAnsweredSong] = createSignal<Song | null>(null); // 保存刚才答题的歌曲
  const [players, setPlayers] = createSignal<Player[]>([]);
  const [playerScores, setPlayerScores] = createSignal<Record<number, number>>({}); // 玩家分数响应式状态
  const [currentRound, setCurrentRound] = createSignal(0);
  const [gameManager, setGameManager] = createSignal<GameStateManager | null>(null);
  const [showRoundSummary, setShowRoundSummary] = createSignal(false); // 显示轮次结算
  const [showGameEnd, setShowGameEnd] = createSignal(false); // 显示游戏结束
  const [localDirectoryName, setLocalDirectoryName] = createSignal<string | null>(null);
  const navigate = useNavigate();

  // 控制加分功能：只有在抢答后且未显示答案时才启用
  const enableScoring = () => !showAnswer() && buzzerTime() !== null;

  // 初始化音频播放器
  const audioPlayer = useAudioPlayer(
    gameConfig()?.playback || {
      clip_duration: 30,
      start_position: 0,
      fade_duration: 2,
      volume: 0.7
    }
  );

  // Load game configuration on mount
  onMount(async () => {
    // 检查 localStorage 中是否有有效的游戏配置
    const detectedGameState = detectValidGameState();
    if (!detectedGameState) {
      console.log('No valid configuration found, redirecting to /config');
      navigate('/config', {replace: true});
      return;
    }

    console.log('Found valid game configuration');

    // 检查并恢复本地目录
    const result = await checkAndRestoreLocalDirectory(detectedGameState.gameConfig);

    if (result.restored) {
      if (result.directoryName) {
        setLocalDirectoryName(result.directoryName);
        console.log('✅ Local directory restored:', result.directoryName);
      }
    } else if (result.needsReselection) {
      // 需要重新选择文件夹
      showDirectorySelectionPrompt(
        (directoryName: string) => {
          setLocalDirectoryName(directoryName);
          console.log('✅ Local directory selected:', directoryName, 'Current directory:', localDirectoryName());
        },
        (error: string) => {
          console.error('Directory selection failed:', error);
        },
        // 回调：选择完文件夹后立即开始播放
        (directoryHandle: FileSystemDirectoryHandle) => {
          console.log('🎵 Directory selected, attempting to start playback...');

          // 获取当前歌曲和游戏状态
          const manager = gameManager();
          const song = currentSong();

          if (manager && song) {
            const gameStatus = manager.getGameStatus();
            console.log('Game status:', gameStatus, 'Current song:', song.title);

            if (gameStatus === 'playing') {
              // 检测 Audio API 是否可用
              if (!audioPlayer.isAudioAvailable) {
                import('mdui/functions/snackbar.js').then(({ snackbar }) => {
                  snackbar({
                    message: "⚠️ 音频功能不可用，游戏可以继续但无法播放音乐",
                    closeable: true,
                    placement: 'top',
                    autoCloseDelay: 5000,
                  });
                });
              } else {
                console.log('🎵 Starting audio playback...');
                audioPlayer.play(song);
              }
            }
          }
        }
      );
    }

    // 创建 GameStateManager 实例
    const manager = new GameStateManager(detectedGameState);
    setGameManager(manager);

    // 设置游戏配置和玩家
    setGameConfig(detectedGameState.gameConfig);
    setPlayers(detectedGameState.gameConfig.players);
    setPlayerScores(manager.getPlayerScores()); // 初始化玩家分数
    setCurrentRound(manager.getCurrentRound());

    // 使用 GameStateManager 获取当前歌曲
    const song = manager.getCurrentSong();
    if (song) {
      setCurrentSong(song);

      // 检测游戏状态，只有在 playing 状态才播放
      const gameStatus = manager.getGameStatus();
      if (gameStatus === 'playing') {
        // 检测 Audio API 是否可用
        if (!audioPlayer.isAudioAvailable) {
          snackbar({
            message: "⚠️ 音频功能不可用，游戏可以继续但无法播放音乐",
            closeable: true,
            placement: 'top',
            autoCloseDelay: 5000,
          });
        } else {
          audioPlayer.play(song);
        }
      }

      // 显示结算界面
      if (gameStatus === 'round-summary') {
        setShowRoundSummary(true);
      } else if (gameStatus === 'game-end') {
        setShowGameEnd(true);
      }
    } else {
      console.error('No current song available');
    }
  });

  // 处理玩家答题
  const handlePlayerAction = (playerId: number, action: Answer) => {
    const manager = gameManager();
    const config = gameConfig();

    if (!manager || !config) return;

    // 使用抢答时间或当前时间
    const actualBuzzerTime = buzzerTime() || Date.now();

    // 查找玩家
    const player = config.players.find(p => p.id === playerId);
    if (!player) {
      console.error(`Player with id ${playerId} not found`);
      return;
    }

    // 保存当前歌曲，用于显示答案
    const songBeforeAnswer = currentSong();

    // 使用 GameStateManager 添加分数
    manager.addScore(player, action, actualBuzzerTime);

    // 更新 playerScores signal 以触发响应式更新
    setPlayerScores(manager.getPlayerScores());

    // 如果有答对的
    const hasCorrectAnswer = action.songName || action.artist || action.album;
    if (hasCorrectAnswer) {
      // 保存答题的歌曲
      setAnsweredSong(songBeforeAnswer);

      // 判断是否是最后一首
      const isCurrentLastSong = manager.isLastSong();
      const isCurrentLastRound = manager.isLastRound();

      if (!isCurrentLastSong) {
        // 不是最后一首，立即执行 nextSong 但不播放
        const nextSong = manager.nextSong();
        if (nextSong) {
          setCurrentSong(nextSong);
        } else {
          console.error('No next song available');
        }
      } else {
        // 是最后一首，立即设置游戏状态
        if (isCurrentLastRound) {
          manager.setGameStatus('game-end');
        } else {
          manager.setGameStatus('round-summary');
          const nextSong = manager.nextRound();
          if (nextSong) {
            setCurrentSong(nextSong);
            setCurrentRound(manager.getCurrentRound());
          }
        }
      }

      setShowAnswer(true); // 显示刚才猜的歌曲答案
      setBuzzerTime(null); // 清除抢答时间（同时禁用加分功能）
    }
  };

  // 点击"下一首"按钮
  const handleNextSong = () => {
    const manager = gameManager();
    if (!manager) return;

    // 判断游戏状态
    const gameStatus = manager.getGameStatus();

    if (gameStatus === 'round-summary') {
      // 显示轮次结算
      setShowRoundSummary(true);
      setShowAnswer(false);
      return;
    }

    if (gameStatus === 'game-end') {
      // 显示游戏结束
      setShowGameEnd(true);
      setShowAnswer(false);
      return;
    }

    // 普通情况：隐藏答案，播放下一首
    setShowAnswer(false);
    const song = currentSong();
    if (song) {
      audioPlayer.play(song); // 在这里播放下一首
    }
  };

  // 抢答按钮：记录抢答时间并停止播放
  const handleBuzzer = () => {
    setBuzzerTime(Date.now());
    audioPlayer.stop(); // 停止播放
    console.log('抢答时间已记录，音乐已停止');
  };

  // 手动结束本轮：跳转到最后一首
  const handleEndRound = () => {
    const manager = gameManager();
    if (!manager) return;

    // 调用 lastSong 跳转到最后一首
    const lastSong = manager.lastSong();
    if (lastSong) {
      setCurrentSong(lastSong);
      audioPlayer.play(lastSong); // 播放最后一首
      setShowAnswer(false);
      setBuzzerTime(null); // 清除抢答时间
    }
  };

  // 继续下一轮
  const handleContinueNextRound = () => {
    const manager = gameManager();
    if (manager) {
      manager.setGameStatus('playing');
    }
    setShowRoundSummary(false);
    setShowAnswer(false);
    setBuzzerTime(null);

    // 播放当前歌曲（已在 nextRound 时设置）
    const song = currentSong();
    if (song) {
      audioPlayer.play(song);
    }
  };


  return (
    <main>
      <Title>Guess - {gameConfig()?.game.name || "Music Game"}</Title>

      {/* 轮次结算画面 */}
      <Show when={showRoundSummary()}>
        <div class="summary-overlay">
          <div class="summary-card">
            <h2 class="summary-title">第 {currentRound()} 轮结束</h2>
            <div class="summary-content">
              <h3>当前排名</h3>
              <div class="summary-rankings">
                {[...players()]
                  .sort((a, b) => (playerScores()[b.id] || 0) - (playerScores()[a.id] || 0))
                  .map((player, index) => (
                    <div class="summary-rank-item">
                      <span class="rank-number">#{index + 1}</span>
                      <span class="player-name">{player.name}</span>
                      <span class="player-score">{playerScores()[player.id] || 0} 分</span>
                    </div>
                  ))}
              </div>
            </div>
            <button class="continue-btn" onClick={handleContinueNextRound}>
              继续下一轮
            </button>
          </div>
        </div>
      </Show>

      {/* 游戏结束画面 */}
      <Show when={showGameEnd()}>
        <div class="summary-overlay">
          <div class="summary-card">
            <h2 class="summary-title">🎉 游戏结束 🎉</h2>
            <div class="summary-content">
              <h3>最终排名</h3>
              <div class="summary-rankings">
                {[...players()]
                  .sort((a, b) => (playerScores()[b.id] || 0) - (playerScores()[a.id] || 0))
                  .map((player, index) => (
                    <div class={`summary-rank-item ${index === 0 ? 'winner' : ''}`}>
                      <span class="rank-number">
                        {index === 0 ? '🏆' : `#${index + 1}`}
                      </span>
                      <span class="player-name">{player.name}</span>
                      <span class="player-score">{playerScores()[player.id] || 0} 分</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </Show>

      <div class="game-container">
        <div class="song-section">
          <div class="music-player">
            {/* 显示当前轮次信息 */}
            <div class="round-info">
              <span class="round-label">第 {currentRound() + 1} 轮</span>
              {gameConfig()?.game.round_end_mode === 'fixed' && (
                <span class="song-count-label">
                  / 共 {gameConfig()!.game.rounds} 轮
                </span>
              )}
            </div>

            <div class="album-display">
              <Album
                src={answeredSong()?.cover || ""}
                showAnswer={showAnswer()}
                size={280}
              />
            </div>
            <div class="song-info">
              <div class="song-title">
                <span class="song-number-prefix">
                  {showAnswer()
                    ? `♪ #${answeredSong()?.id || '?'} `
                    : `♪ #${currentSong()?.id || '?'} `
                  }
                </span>
                {showAnswer() ? (answeredSong()?.title || "Unknown Title") : "???"}
              </div>
              <div class="song-artist">
                {showAnswer() ? (answeredSong()?.artist || "Unknown Artist") : "???"}
              </div>
              <div class="song-album">
                {showAnswer() ? (answeredSong()?.album || "Unknown Album") : "???"}
              </div>
            </div>
            <div class="game-controls">
              {/* 抢答按钮：在未显示答案时显示 */}
              <Show when={!showAnswer()}>
                <button
                  class={`buzzer-btn ${buzzerTime() ? 'active' : ''}`}
                  onClick={handleBuzzer}
                >
                  {buzzerTime() ? '已抢答 ✓' : '抢答'}
                </button>

                {/* 跳转副歌按钮：只在播放中且有副歌时显示 */}
                <Show when={audioPlayer.isPlaying() && currentSong()?.chorus_time}>
                  <button
                    class="chorus-btn"
                    onClick={() => {
                      const song = currentSong();
                      if (song) audioPlayer.jumpToChorus(song);
                    }}
                    title="跳转到副歌"
                  >
                    <span>副歌</span>
                  </button>
                </Show>
              </Show>

              {/* 下一首和结束本轮按钮：显示答案后显示 */}
              <Show when={showAnswer()}>
                <button class="next-song-btn" onClick={handleNextSong}>
                  {gameManager() && gameManager()!.getGameStatus() != 'playing'
                    ? (gameManager()!.getGameStatus() == 'game-end' ? "游戏结束" : "轮次结算")
                    : "下一首"}
                </button>
                {/* 只有在不是最后一首时才显示"结束本轮"按钮 */}
                <Show when={gameManager() && gameManager()!.getGameStatus() == 'playing'}>
                  <button class="end-round-btn" onClick={handleEndRound}>
                    结束本轮
                  </button>
                </Show>
              </Show>
            </div>
          </div>
        </div>

        <div class="rank-section">
          <ScoreBoard
            players={players()}
            playerScores={playerScores()}
            enableScoring={enableScoring}
            onPlayerAction={handlePlayerAction}
          />
        </div>
      </div>
    </main>
  );
}
