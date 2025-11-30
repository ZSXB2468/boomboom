import {Title} from "@solidjs/meta";
import {createSignal, Show, onMount} from "solid-js";
import {useNavigate} from "@solidjs/router";
import Album from "~/components/Album";
import ScoreBoard from "~/components/ScoreBoard";
import {detectValidGameState, GameStateManager} from "~/utils/gameStateManager";
import type {GameConfig, Song, Player} from "~/types/config";
import type {Answer} from "~/utils/gameStateManager";
import "~/styles/guess.css";

export default function Guess() {
  const [showAnswer, setShowAnswer] = createSignal(false);
  const [buzzerTime, setBuzzerTime] = createSignal<number | null>(null); // 抢答时间戳
  const [gameConfig, setGameConfig] = createSignal<GameConfig | null>(null);
  const [currentSong, setCurrentSong] = createSignal<Song | null>(null);
  const [players, setPlayers] = createSignal<Player[]>([]);
  const [playerScores, setPlayerScores] = createSignal<Record<number, number>>({}); // 玩家分数响应式状态
  const [currentRound, setCurrentRound] = createSignal(0);
  const [gameManager, setGameManager] = createSignal<GameStateManager | null>(null);
  const [showRoundSummary, setShowRoundSummary] = createSignal(false); // 显示轮次结算
  const [showGameEnd, setShowGameEnd] = createSignal(false); // 显示游戏结束
  const navigate = useNavigate();

  // 控制加分功能：只有在抢答后且未显示答案时才启用
  const enableScoring = () => !showAnswer() && buzzerTime() !== null;

  // Load game configuration on mount
  onMount(() => {
    // 检查 localStorage 中是否有有效的游戏配置
    const detectedGameState = detectValidGameState();
    if (!detectedGameState) {
      console.log('No valid configuration found, redirecting to /config');
      navigate('/config', {replace: true});
      return;
    }

    console.log('Found valid game configuration');

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
    } else {
      console.error('No current song available');
    }

    // 检测游戏状态并显示对应界面
    const gameStatus = manager.getGameStatus();
    if (gameStatus === 'round-summary') {
      setShowRoundSummary(true);
    } else if (gameStatus === 'game-end') {
      setShowGameEnd(true);
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

    // 使用 GameStateManager 添加分数
    manager.addScore(player, action, actualBuzzerTime);

    // 更新 playerScores signal 以触发响应式更新
    setPlayerScores(manager.getPlayerScores());

    // 如果有答对的
    if (action.songName || action.artist || action.album) {
      // 关键：在推进前先判断是否是最后一首
      const isCurrentLastSong = manager.isLastSong();
      const isCurrentLastRound = manager.isLastRound();

      if (!isCurrentLastSong) {
        // 不是最后一首，立即执行 nextSong
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
          manager.nextRound();
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

    // 判断当前是否是最后一首（因为没有执行 nextSong，所以还是最后一首）
    if (manager.getGameStatus() != 'playing') {
      if (manager.getGameStatus() == 'game-end') {
        // 最后一轮的最后一首，显示游戏结束
        console.log("Game finished!");
        setShowGameEnd(true);
      } else {
        // 不是最后一轮，显示轮次结算
        console.log("Round finished!");
        setShowRoundSummary(true);
        // 立即推进到下一轮的第一首歌
        const nextSong = manager.getCurrentSong();
        if (nextSong) {
          setCurrentSong(nextSong);
          setCurrentRound(manager.getCurrentRound());
        }
      }
      setShowAnswer(false);
      return;
    }

    // 不是最后一首，隐藏答案继续播放
    setShowAnswer(false);
  };

  // 抢答按钮：记录抢答时间
  const handleBuzzer = () => {
    setBuzzerTime(Date.now());
    console.log('抢答时间已记录');
  };

  // 手动结束本轮：跳转到最后一首
  const handleEndRound = () => {
    const manager = gameManager();
    if (!manager) return;

    // 调用 lastSong 跳转到最后一首
    const lastSong = manager.lastSong();
    if (lastSong) {
      setCurrentSong(lastSong);
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
                src={currentSong()?.cover || ""}
                showAnswer={showAnswer()}
                size={280}
              />
            </div>
            <div class="song-info">
              <div class="song-title">
                {showAnswer() ? (currentSong()?.title || "Unknown Title") : "???"}
              </div>
              <div class="song-artist">
                {showAnswer() ? (currentSong()?.artist || "Unknown Artist") : "???"}
              </div>
              <div class="song-album">
                {showAnswer() ? (currentSong()?.album || "Unknown Album") : "???"}
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
