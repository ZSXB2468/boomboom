import { Title } from "@solidjs/meta";
import FileInput from "~/components/FileInput";
import { snackbar } from 'mdui/functions/snackbar.js';
import { dialog } from 'mdui/functions/dialog.js';
import { parseConfig, generateSongSequence } from "~/utils/configParser";
import { createSignal } from "solid-js";
import type { GameConfig } from "~/types/config";

export default function Home() {
  const [gameConfig, setGameConfig] = createSignal<GameConfig | null>(null);
  const [isConfigLoaded, setIsConfigLoaded] = createSignal(false);

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
      <h1>燃炸英语夜</h1>

      <FileInput
        onFileSelect={handleConfigFile}
        accept=".yaml,.yml"
        buttonText="上传配置文件"
      />

      {/* 显示配置信息 */}
      {isConfigLoaded() && gameConfig() && (
        <div style="margin-top: 20px; padding: 20px; background: #f5f5f5; border-radius: 8px;">
          <h2>游戏配置</h2>
          <p><strong>游戏名称：</strong>{gameConfig()!.game.name}</p>
          <p><strong>游戏轮数：</strong>{gameConfig()!.game.rounds}</p>
          <p><strong>歌曲总数：</strong>{gameConfig()!.songs.length}</p>
          <p><strong>玩家数量：</strong>{gameConfig()!.players.length}</p>
          <p><strong>抽取模式：</strong>{
            gameConfig()!.selection_rules.mode === 'random' ? '随机' :
            gameConfig()!.selection_rules.mode === 'sequential' ? '顺序' : '加权随机'
          }</p>
        </div>
      )}


      {/*<Counter />*/}
      {/*<p>*/}
      {/*  Visit{" "}*/}
      {/*  <a href="https://start.solidjs.com" target="_blank">*/}
      {/*    start.solidjs.com*/}
      {/*  </a>{" "}*/}
      {/*  to learn how to build SolidStart apps.*/}
      {/*</p>*/}

    </main>
  );
}
