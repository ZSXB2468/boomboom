import { useNavigate } from "@solidjs/router";
import { onMount } from "solid-js";
import { detectValidGameState } from "~/utils/gameStateManager";

export default function Home() {
  const navigate = useNavigate();

  onMount(() => {
    // 检查 localStorage 中是否有有效的游戏配置
    const gameState = detectValidGameState();

    if (gameState) {
      console.log('Found valid game configuration, redirecting to /guess');
      navigate('/guess', { replace: true });
    } else {
      console.log('No valid configuration found, redirecting to /config');
      navigate('/config', { replace: true });
    }
  });

  return (
    <div style="display: flex; justify-content: center; align-items: center; height: 100vh;">
      <h1>正在检测游戏配置...</h1>
    </div>
  );
}
