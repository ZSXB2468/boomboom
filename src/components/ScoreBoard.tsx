import {createSignal, createEffect, For, Show} from "solid-js";
import 'mdui/components/avatar.js';
import 'mdui/components/fab.js';
import 'mdui/components/icon.js';
import type {Player as ConfigPlayer} from "../types/config";
import "./ScoreBoard.css";

interface GamePlayer extends ConfigPlayer {
  score: number;
  previousRank: number;
  currentRank: number;
}

interface ScoreBoardProps {
  players: ConfigPlayer[];
  playerScores: Record<number, number>;
  enableScoring: () => boolean;
  onPlayerAction: (playerId: number, action: PlayerAction) => void;
}

interface PlayerAction {
  songName: boolean;
  artist: boolean;
  album: boolean;
}

export default function ScoreBoard(props: ScoreBoardProps) {
  const [players, setPlayers] = createSignal<GamePlayer[]>([]);
  const [selectedPlayer, setSelectedPlayer] = createSignal<number | null>(null);
  const [actionForm, setActionForm] = createSignal({
    songName: false,
    artist: false,
    album: false
  });

  // Initialize players from props
  createEffect(() => {
    const configPlayers = props.players.map((player, index) => ({
      ...player,
      score: props.playerScores[player.id] || 0,
      previousRank: index + 1,
      currentRank: index + 1
    }));

    const rankedPlayers = updateRanks(configPlayers);
    setPlayers(rankedPlayers);
  });

  const updateRanks = (playerList: GamePlayer[]) => {
    // Sort by score descending
    const sorted = [...playerList].sort((a, b) => b.score - a.score);

    return sorted.map((player, index) => {
      const newRank = index + 1;
      return {
        ...player,
        previousRank: player.currentRank,
        currentRank: newRank
      };
    });
  };

  const handlePlayerClick = (playerId: number) => {
    // 检查是否启用加分功能
    if (!props.enableScoring()) {
      return;
    }

    if (selectedPlayer() === playerId) {
      setSelectedPlayer(null);
    } else {
      setSelectedPlayer(playerId);
      setActionForm({songName: false, artist: false, album: false});
    }
  };

  const handleConfirm = () => {
    const playerId = selectedPlayer();
    if (!playerId) return;

    const form = actionForm();

    // 调用父组件的回调
    if (form.songName || form.artist || form.album) {
      props.onPlayerAction(playerId, form);
    }

    setSelectedPlayer(null);
  };

  const handleCancel = () => {
    setSelectedPlayer(null);
    setActionForm({songName: false, artist: false, album: false});
  };

  const getRankChangeIcon = (player: GamePlayer) => {
    const change = player.previousRank - player.currentRank;
    if (change > 0) return '↑';
    if (change < 0) return '↓';
    return '=';
  };

  const getRankChangeClass = (player: GamePlayer) => {
    const change = player.previousRank - player.currentRank;
    if (change > 0) return 'rank-up';
    if (change < 0) return 'rank-down';
    return 'rank-same';
  };

  return (
    <div class="mdui-table score-board">
      <For each={players()}>
        {(player) => (
          <div class="player-row-container">
            <div
              class="player-row"
              onClick={() => handlePlayerClick(player.id)}
            >
              <div class="player-info">
                <div class={`rank ${getRankChangeClass(player)}`}>
                  <span class="rank-number">#{player.currentRank}</span>
                  <span class="rank-change">{getRankChangeIcon(player)}</span>
                </div>
                <mdui-avatar>
                  {player.avatar || player.name.substring(0, 2)}
                </mdui-avatar>
                <div class="player-name">{player.name}</div>
                <div class="player-score">{player.score}分</div>
              </div>
            </div>

            <Show when={selectedPlayer() === player.id}>
              <div class="action-overlay">
                <div class="action-options">
                  <mdui-fab
                    class={`action-fab ${actionForm().songName ? 'selected' : ''}`}
                    onClick={() => setActionForm(prev => ({
                      ...prev,
                      songName: !prev.songName
                    }))}
                    innerHTML="music_note"
                  ></mdui-fab>
                  <mdui-fab
                    class={`action-fab ${actionForm().artist ? 'selected' : ''}`}
                    onClick={() => setActionForm(prev => ({
                      ...prev,
                      artist: !prev.artist
                    }))}
                    innerHTML="person"
                  ></mdui-fab>
                  <mdui-fab
                    class={`action-fab ${actionForm().album ? 'selected' : ''}`}
                    onClick={() => setActionForm(prev => ({
                      ...prev,
                      album: !prev.album
                    }))}
                    innerHTML="album"
                  ></mdui-fab>
                  <mdui-fab
                    class="confirm-fab"
                    onClick={handleConfirm}
                    innerHTML="check"
                  ></mdui-fab>
                  <mdui-fab
                    class="cancel-fab"
                    onClick={handleCancel}
                    innerHTML="close"
                  ></mdui-fab>
                </div>
              </div>
            </Show>
          </div>
        )}
      </For>
    </div>
  );
}
