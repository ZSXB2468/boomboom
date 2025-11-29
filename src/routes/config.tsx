import { Title } from "@solidjs/meta";
import FileInput from "~/components/FileInput";
import Table, { TableColumn } from "~/components/Table";
import { snackbar } from 'mdui/functions/snackbar.js';
import { dialog } from 'mdui/functions/dialog.js';
import 'mdui/components/card.js';
import 'mdui/components/button.js';
import {parseConfig, generateSongSequence} from "~/utils/configParser";
import { createSignal, onMount } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { detectValidGameState, saveGameState, clearGameState } from "~/utils/gameStateManager";
import type { GameConfig, Song, Player } from "~/types/config";
import '../styles/config.css'

export default function Config() {
  const [gameConfig, setGameConfig] = createSignal<GameConfig | null>(null);
  const [isConfigLoaded, setIsConfigLoaded] = createSignal(false);
  const navigate = useNavigate();

  // 页面加载时检测已有配置
  onMount(() => {
    const existingGameState = detectValidGameState();
    if (existingGameState) {
      console.log('Found existing valid game configuration');
      setGameConfig(existingGameState.gameConfig);
      setIsConfigLoaded(true);

      snackbar({
        message: "检测到已有游戏配置，已自动加载",
        closeable: true,
        placement: 'top',
        autoCloseDelay: 2000,
      });
    }
  });

  const startGame = () => {
    const config = gameConfig();
    if (!config) return;

    try {

      // 生成歌曲序列
      const songSequence = generateSongSequence(config);

      // 保存游戏状态
      saveGameState({
        gameConfig: config,
        songSequence: songSequence, // 现在是 Song[][]
        currentRound: 0, // 内部使用 0-based 索引
        currentSongIndex: 0,
        playerScores: config.players.reduce((scores, player) => {
          scores[player.id] = 0;
          return scores;
        }, {} as Record<string, number>)
      });

      snackbar({
        message: "游戏配置已保存，开始游戏！",
        closeable: true,
        placement: 'top',
        autoCloseDelay: 2000,
      });

      // 跳转到游戏页面
      setTimeout(() => {
        navigate('/guess');
      }, 500);
    } catch (error) {
      dialog({
        headline: "开始游戏失败",
        description: `保存配置时发生错误: ${error instanceof Error ? error.message : '未知错误'}`,
        closeOnEsc: true,
        closeOnOverlayClick: true,
        actions: [
          {
            text: "确定",
          }
        ]
      });
    }
  };

  const clearConfig = () => {
    dialog({
      headline: "清除配置",
      description: "确定要清除当前游戏配置吗？这将删除所有已保存的游戏数据。",
      closeOnEsc: true,
      closeOnOverlayClick: true,
      actions: [
        {
          text: "取消",
        },
        {
          text: "确认清除",
          onClick: () => {
            clearGameState();
            setGameConfig(null);
            setIsConfigLoaded(false);
            snackbar({
              message: "游戏配置已清除",
              closeable: true,
              placement: 'top',
              autoCloseDelay: 2000,
            });
          }
        }
      ]
    });
  };

  const handleConfigFile = async (file: File, content: string) => {
    try {
      console.log("配置文件内容:", content);

      // 解析并验证配置文件
      const config = parseConfig(content);

      // 生成歌曲序列
      const songSequence = generateSongSequence(config);
      console.log("生成的歌曲序列:", songSequence);

      // 保存配置
      setGameConfig(config);
      setIsConfigLoaded(true);

      // 成功提示使用 snackbar
      snackbar({
        message: `配置文件 "${file.name}" 上传成功！共 ${config.songs.length} 首歌曲，${config.players.length} 位玩家，${config.game.rounds} 轮游戏`,
        closeable: true,
        placement: 'top',
        autoCloseDelay: 3000,
      });
    } catch (error) {
      console.error("处理失败:", error);

      // 失败提示使用 dialog
      dialog({
        headline: "上传失败",
        description: `文件处理时发生错误: ${error instanceof Error ? error.message : '未知错误'}`,
        closeOnEsc: true,
        closeOnOverlayClick: true,
        actions: [
          {
            text: "确定",
          }
        ]
      });

      // 重新抛出错误，让 FileInput 知道处理失败
      throw error;
    }
  };

  return (
    <main>
      <Title>Hello World</Title>
      <h1>游戏配置管理</h1>

      <FileInput
        onFileSelect={handleConfigFile}
        accept=".yaml,.yml"
        buttonText="上传配置文件"
      />

      {/* 显示配置信息 */}
      {isConfigLoaded() && gameConfig() && (
        <div class="config-info-section">
          <h2 class="config-section-title">游戏配置</h2>

          {/* 基本信息 */}
          <div class="config-grid">
            <mdui-card class="config-card-content">
              <div class="config-card-label">游戏名称</div>
              <div class="config-card-value">{gameConfig()!.game.name}</div>
            </mdui-card>
            <mdui-card class="config-card-content">
              <div class="config-card-label">游戏轮数</div>
              <div class="config-card-value">{gameConfig()!.game.rounds} 轮</div>
            </mdui-card>
            <mdui-card class="config-card-content">
              <div class="config-card-label">歌曲总数</div>
              <div class="config-card-value">{gameConfig()!.songs.length} 首</div>
            </mdui-card>
            <mdui-card class="config-card-content">
              <div class="config-card-label">玩家数量</div>
              <div class="config-card-value">{gameConfig()!.players.length} 人</div>
            </mdui-card>
            <mdui-card class="config-card-content">
              <div class="config-card-label">抽取模式</div>
              <div class="config-card-value">{
                gameConfig()!.selection_rules.mode === 'random' ? '随机' :
                gameConfig()!.selection_rules.mode === 'sequential' ? '顺序' : '加权随机'
              }</div>
            </mdui-card>
          </div>

          {/* 游戏规则 */}
          <h2 class="config-section-title">游戏规则</h2>
          <div class="config-grid">
            <mdui-card class="config-card-content">
              <div class="config-card-label">结束方式</div>
              <div class="config-card-value">
                {gameConfig()!.game.round_end_mode === 'fixed'
                  ? `固定 ${gameConfig()!.game.songs_per_round} 首`
                  : '手动截止'
                }
              </div>
            </mdui-card>
            <mdui-card class="config-card-content">
              <div class="config-card-label">猜对歌名</div>
              <div class="config-card-value config-score-value">{(gameConfig()!.scoring.title_correct * 100).toFixed(0)}% 基础分</div>
            </mdui-card>
            <mdui-card class="config-card-content">
              <div class="config-card-label">猜对歌手</div>
              <div class="config-card-value config-score-value">{(gameConfig()!.scoring.artist_correct * 100).toFixed(0)}% 基础分</div>
            </mdui-card>
            <mdui-card class="config-card-content">
              <div class="config-card-label">专辑加分</div>
              <div class="config-card-value config-score-value">+{gameConfig()!.scoring.album_bonus} 分</div>
            </mdui-card>
            <mdui-card class="config-card-content">
              <div class="config-card-label">快答加分</div>
              <div class="config-card-value config-score-value">+{gameConfig()!.scoring.speed_bonus} 分</div>
            </mdui-card>
            <mdui-card class="config-card-content">
              <div class="config-card-label">快答阈值</div>
              <div class="config-card-value">{gameConfig()!.scoring.speed_threshold ? `${gameConfig()!.scoring.speed_threshold} 秒` : '未设置'}</div>
            </mdui-card>
            <mdui-card class="config-card-content">
              <div class="config-card-label">答题时限</div>
              <div class="config-card-value">{gameConfig()!.scoring.time_limit ? `${gameConfig()!.scoring.time_limit} 秒` : '无限制'}</div>
            </mdui-card>
          </div>

          {/* 数据列表区域 - 垂直布局 */}
          <div class="config-tables-container">
            {/* 玩家列表 */}
            <mdui-card class="config-table-card">
              <h3 class="config-section-title">玩家列表</h3>
              <Table
                columns={[
                  {
                    key: "id",
                    title: "ID",
                    width: "80px",
                    align: "center",
                  },
                  {
                    key: "name",
                    title: "姓名",
                    render: (value, record: Player) => {
                      // 渲染头像函数
                      const renderAvatar = () => {
                        if (!record.avatar) {
                          // 没有avatar字段，使用姓名首字母
                          return (
                            <div class="player-avatar player-avatar-text">
                              {value.charAt(0)}
                            </div>
                          );
                        }

                        // 判断是否为路径（包含 / 或 http）
                        if (record.avatar.includes('/') || record.avatar.startsWith('http')) {
                          // 图片路径
                          return (
                            <img
                              src={record.avatar}
                              alt={value}
                              class="player-avatar"
                              onError={(e) => {
                                // 图片加载失败时显示文字
                                e.currentTarget.style.display = 'none';
                                const textAvatar = document.createElement('div');
                                textAvatar.className = 'player-avatar player-avatar-text';
                                textAvatar.textContent = value.charAt(0);
                                e.currentTarget.parentNode?.insertBefore(textAvatar, e.currentTarget);
                              }}
                            />
                          );
                        } else {
                          // 文字头像，显示最多前两个字
                          return (
                            <div class="player-avatar player-avatar-text">
                              {record.avatar.substring(0, 2)}
                            </div>
                          );
                        }
                      };

                      return (
                        <div class="player-info-container">
                          {renderAvatar()}
                          <strong class="player-name">{value}</strong>
                        </div>
                      );
                    },
                  },
                  {
                    key: "team",
                    title: "队伍",
                    align: "center",
                    render: (value) => value ? (
                      <span class="player-team-badge">
                        {value}
                      </span>
                    ) : (
                      <span class="empty-state">-</span>
                    ),
                  },
                ] as TableColumn<Player>[]}
                data={gameConfig()!.players}
                bordered
                hoverable
                striped
              />
            </mdui-card>

            {/* 歌曲列表 */}
            <mdui-card class="config-table-card">
              <h3 class="config-section-title">歌曲列表</h3>
              <Table
                columns={[
                  {
                    key: "id",
                    title: "ID",
                    width: "60px",
                    align: "center",
                  },
                  {
                    key: "title",
                    title: "歌曲名",
                    render: (value, record: Song) => (
                      <div class="song-info-container">
                        <img
                          src={record.cover}
                          alt={value}
                          class="song-cover"
                        />
                        <div>
                          <div class="song-title">{value}</div>
                          <div class="song-artist">{record.artist}</div>
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: "album",
                    title: "专辑",
                    render: (value) => <span class="song-album">{value}</span>,
                  },
                  {
                    key: "duration",
                    title: "时长",
                    width: "80px",
                    align: "center",
                    render: (value) => {
                      const minutes = Math.floor(value / 60);
                      const seconds = value % 60;
                      return <span class="song-duration">{minutes}:{seconds.toString().padStart(2, "0")}</span>;
                    },
                  },
                  {
                    key: "score",
                    title: "分值",
                    width: "80px",
                    align: "center",
                    render: (value) => (
                      <span class="song-score-badge">
                        {value}
                      </span>
                    ),
                  },
                  {
                    key: "chorus_time",
                    title: "副歌时间",
                    width: "100px",
                    align: "center",
                    render: (value) => {
                      if (!value && value !== 0) return <span class="empty-state">-</span>;
                      const minutes = Math.floor(value / 60);
                      const seconds = value % 60;
                      return <span class="song-chorus-time">{minutes}:{seconds.toString().padStart(2, "0")}</span>;
                    },
                  },
                  {
                    key: "weight",
                    title: "权重",
                    width: "80px",
                    align: "center",
                    render: (value) => <span class="song-weight">{value.toFixed(1)}</span>,
                  },
                  {
                    key: "tags",
                    title: "标签",
                    render: (value: string[]) => (
                      <div class="song-tags-container">
                        {value.map((tag) => (
                          <span class="song-tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                    ),
                  },
                ] as TableColumn<Song>[]}
                data={gameConfig()!.songs}
                bordered
                hoverable
                striped
              />
            </mdui-card>

            {/* 特殊歌曲 */}
            {gameConfig()!.special_songs && gameConfig()!.special_songs.length > 0 && (
              <mdui-card class="config-table-card">
                <h3 class="config-section-title">特殊歌曲配置</h3>
                <Table
                  columns={[
                    {
                      key: "song_id",
                      title: "歌曲ID",
                      width: "100px",
                      align: "center",
                      render: (value) => (
                        <span class="special-song-id-badge">
                          #{value}
                        </span>
                      ),
                    },
                    {
                      key: "song_id",
                      title: "歌曲信息",
                      render: (value) => {
                        const song = gameConfig()!.songs.find(s => s.id === value);
                        return song ? (
                          <div>
                            <div class="song-title">{song.title}</div>
                            <div class="song-artist">{song.artist}</div>
                          </div>
                        ) : <span class="empty-state">未找到歌曲</span>;
                      },
                    },
                    {
                      key: "round",
                      title: "指定轮次",
                      width: "100px",
                      align: "center",
                      render: (value) => <span class="special-song-round">第 {value} 轮</span>,
                    },
                    {
                      key: "position",
                      title: "位置",
                      width: "100px",
                      align: "center",
                      render: (value) => (
                        <span class="song-album">
                          {value === -1 ? "最后一首" : `第 ${value} 首`}
                        </span>
                      ),
                    },
                  ]}
                  data={gameConfig()!.special_songs}
                  bordered
                  hoverable
                />
              </mdui-card>
            )}
          </div>

          {/* 操作按钮区域 */}
          <div class="config-actions">
            <mdui-button
              class="config-primary-button"
              onClick={startGame}
            >
              确认配置，开始游戏
            </mdui-button>
            <mdui-button
              class="config-secondary-button"
              onClick={clearConfig}
            >
              清除配置
            </mdui-button>
          </div>

        </div>
      )}
    </main>
  );
}
