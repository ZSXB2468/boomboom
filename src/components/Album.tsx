import { Show, createSignal, createEffect } from "solid-js";
import { resolveFilePath } from "~/utils/fileSystemManager";
import "./Album.css";

interface AlbumProps {
    src: string;
    showAnswer: boolean;
    size?: number; // Optional size in pixels, default is 300
}

export default function Album(props: AlbumProps) {
    const size = props.size || 300;
    const [resolvedSrc, setResolvedSrc] = createSignal<string>("");

    // 解析图片路径
    createEffect(async () => {
      if (props.src) {
        try {
          const resolved = await resolveFilePath(props.src);
          setResolvedSrc(resolved);
        } catch (error) {
          console.error("解析封面路径失败:", error);
          setResolvedSrc(props.src); // 失败时使用原路径
        }
      }
    });

    // SVG placeholder when answer is not shown
    const placeholderSvg = `data:image/svg+xml,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
            <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
                </linearGradient>
            </defs>
            <rect width="200" height="200" fill="url(#grad)"/>
            <circle cx="100" cy="100" r="60" fill="none" stroke="white" stroke-width="3" opacity="0.3"/>
            <path d="M 100 60 L 100 100 L 130 115" stroke="white" stroke-width="4" stroke-linecap="round" fill="none" opacity="0.5"/>
            <text x="100" y="170" font-family="Arial, sans-serif" font-size="16" fill="white" text-anchor="middle" opacity="0.7">?</text>
        </svg>
    `)}`;

    return (
        <div class="album-container" style={{ width: `${size}px`, height: `${size}px` }}>
            <Show
                when={props.showAnswer}
                fallback={
                    <img
                        src={placeholderSvg}
                        alt="Hidden album cover"
                        class="album-image"
                    />
                }
            >
                <img
                    src={resolvedSrc()}
                    alt="Album cover"
                    class="album-image"
                />
            </Show>
        </div>
    );
}
