import { createSignal, onCleanup } from "solid-js";
import type { Song, PlaybackSettings } from "~/types/config";

export function useAudioPlayer(playbackSettings: PlaybackSettings) {
  // 检测 Audio API 是否可用
  const isAudioAvailable = typeof window !== 'undefined' && typeof Audio !== 'undefined';

  // 如果 Audio 不可用，返回空实现
  if (!isAudioAvailable) {
    console.warn('Audio API is not available');
    return {
      isPlaying: () => false,
      currentTime: () => 0,
      duration: () => 0,
      play: () => {},
      stop: () => {},
      jumpToChorus: () => {},
      isAudioAvailable: false,
    };
  }

  const [audio] = createSignal(new Audio());
  const [isPlaying, setIsPlaying] = createSignal(false);
  const [currentTime, setCurrentTime] = createSignal(0);
  const [duration, setDuration] = createSignal(0);

  let fadeInterval: number | null = null;
  let clipTimeout: number | null = null;

  const audioElement = audio();

  // 设置音量
  audioElement.volume = playbackSettings.volume;

  // 事件监听
  audioElement.addEventListener('timeupdate', () => {
    setCurrentTime(audioElement.currentTime);
  });

  audioElement.addEventListener('loadedmetadata', () => {
    setDuration(audioElement.duration);
  });

  audioElement.addEventListener('ended', () => {
    setIsPlaying(false);
  });

  // 淡入效果
  const fadeIn = (duration: number) => {
    const steps = 20;
    const stepDuration = (duration * 1000) / steps;
    const volumeStep = playbackSettings.volume / steps;
    let currentStep = 0;

    audioElement.volume = 0;
    fadeInterval = window.setInterval(() => {
      currentStep++;
      audioElement.volume = Math.min(volumeStep * currentStep, playbackSettings.volume);
      if (currentStep >= steps && fadeInterval) {
        clearInterval(fadeInterval);
        fadeInterval = null;
      }
    }, stepDuration);
  };

  // 淡出效果
  const fadeOut = (duration: number, callback?: () => void) => {
    const steps = 20;
    const stepDuration = (duration * 1000) / steps;
    const volumeStep = audioElement.volume / steps;
    let currentStep = 0;

    fadeInterval = window.setInterval(() => {
      currentStep++;
      audioElement.volume = Math.max(audioElement.volume - volumeStep, 0);
      if (currentStep >= steps && fadeInterval) {
        clearInterval(fadeInterval);
        fadeInterval = null;
        callback?.();
      }
    }, stepDuration);
  };

  // 播放歌曲
  const play = (song: Song) => {
    // 停止当前播放
    stop();

    // 加载新歌曲
    audioElement.src = song.path;

    // 计算起始位置
    let startTime = 0;
    if (playbackSettings.start_position === -1) {
      // 随机位置
      const maxStart = Math.max(0, song.duration - (playbackSettings.clip_duration > 0 ? playbackSettings.clip_duration : 30));
      startTime = Math.random() * maxStart;
    } else if (playbackSettings.start_position === 0 && song.chorus_time) {
      // 副歌位置
      startTime = song.chorus_time;
    } else if (playbackSettings.start_position > 0) {
      // 指定位置
      startTime = playbackSettings.start_position;
    }

    audioElement.currentTime = startTime;

    // 播放
    audioElement.play().then(() => {
      setIsPlaying(true);

      // 淡入
      if (playbackSettings.fade_duration > 0) {
        fadeIn(playbackSettings.fade_duration);
      }

      // 设置播放时长
      if (playbackSettings.clip_duration > 0) {
        const fadeOutTime = playbackSettings.clip_duration - playbackSettings.fade_duration;
        clipTimeout = window.setTimeout(() => {
          if (playbackSettings.fade_duration > 0) {
            fadeOut(playbackSettings.fade_duration, () => {
              audioElement.pause();
              setIsPlaying(false);
            });
          } else {
            audioElement.pause();
            setIsPlaying(false);
          }
        }, fadeOutTime * 1000);
      }
    }).catch(err => {
      console.error('播放失败:', err);
    });
  };

  // 停止播放
  const stop = () => {
    if (fadeInterval) {
      clearInterval(fadeInterval);
      fadeInterval = null;
    }
    if (clipTimeout) {
      clearTimeout(clipTimeout);
      clipTimeout = null;
    }
    audioElement.pause();
    audioElement.currentTime = 0;
    audioElement.volume = playbackSettings.volume;
    setIsPlaying(false);
  };

  // 跳转到副歌
  const jumpToChorus = (song: Song) => {
    if (song.chorus_time && isPlaying()) {
      audioElement.currentTime = song.chorus_time;
    }
  };

  // 清理
  onCleanup(() => {
    stop();
  });

  return {
    isPlaying,
    currentTime,
    duration,
    play,
    stop,
    jumpToChorus,
    isAudioAvailable: true,
  };
}

