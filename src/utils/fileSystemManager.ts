/**
 * 文件系统管理器
 * 用于处理本地文件访问和在线文件
 */

interface FileHandleCache {
  directoryHandle: FileSystemDirectoryHandle | null;
  fileCache: Map<string, string>; // path -> Blob URL
}

const fileSystemCache: FileHandleCache = {
  directoryHandle: null,
  fileCache: new Map(),
};

/**
 * 检查浏览器是否支持 File System Access API
 */
export function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

/**
 * 请求用户选择本地文件夹
 */
export async function selectLocalDirectory(): Promise<FileSystemDirectoryHandle> {
  if (!isFileSystemAccessSupported()) {
    throw new Error('浏览器不支持 File System Access API，请使用在线文件或更新浏览器');
  }

  const directoryHandle = await (window as any).showDirectoryPicker({
    mode: 'read',
    startIn: 'downloads',
  });

  fileSystemCache.directoryHandle = directoryHandle;
  return directoryHandle;
}

/**
 * 判断路径是否为本地相对路径
 */
export function isLocalPath(path: string): boolean {
  return path.startsWith('./') || path.startsWith('../');
}

/**
 * 判断路径是否为在线路径
 */
export function isOnlinePath(path: string): boolean {
  return path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:');
}

/**
 * 从本地文件夹中读取文件并转换为 Blob URL
 */
async function getFileFromDirectory(
  directoryHandle: FileSystemDirectoryHandle,
  relativePath: string
): Promise<string> {
  // 移除开头的 ./
  const cleanPath = relativePath.replace(/^\.\//, '');
  const pathParts = cleanPath.split('/');
  
  let currentHandle: FileSystemDirectoryHandle | FileSystemFileHandle = directoryHandle;
  
  // 遍历路径，逐级进入文件夹
  for (let i = 0; i < pathParts.length - 1; i++) {
    currentHandle = await (currentHandle as FileSystemDirectoryHandle).getDirectoryHandle(pathParts[i]);
  }
  
  // 获取最后的文件
  const fileHandle = await (currentHandle as FileSystemDirectoryHandle).getFileHandle(
    pathParts[pathParts.length - 1]
  );
  const file = await fileHandle.getFile();
  
  // 创建 Blob URL
  return URL.createObjectURL(file);
}

/**
 * 解析文件路径，返回可用的 URL
 * - 在线路径：直接返回
 * - 本地路径：从选择的文件夹中读取并返回 Blob URL
 */
export async function resolveFilePath(path: string): Promise<string> {
  // 在线路径直接返回
  if (isOnlinePath(path)) {
    return path;
  }

  // 不是本地路径，直接返回（可能是绝对路径或其他格式）
  if (!isLocalPath(path)) {
    return path;
  }

  // 检查缓存
  if (fileSystemCache.fileCache.has(path)) {
    return fileSystemCache.fileCache.get(path)!;
  }

  // 需要本地文件夹
  if (!fileSystemCache.directoryHandle) {
    throw new Error('未选择本地文件夹，请先指定资源文件夹');
  }

  try {
    const blobUrl = await getFileFromDirectory(fileSystemCache.directoryHandle, path);
    fileSystemCache.fileCache.set(path, blobUrl);
    return blobUrl;
  } catch (error) {
    console.error(`无法读取文件: ${path}`, error);
    throw new Error(`无法读取文件: ${path}`);
  }
}

/**
 * 批量解析文件路径
 */
export async function resolveFilePaths(paths: string[]): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  
  for (const path of paths) {
    try {
      const resolvedPath = await resolveFilePath(path);
      result.set(path, resolvedPath);
    } catch (error) {
      console.error(`解析路径失败: ${path}`, error);
      result.set(path, path); // 失败时保持原路径
    }
  }
  
  return result;
}

/**
 * 清除文件缓存
 */
export function clearFileCache() {
  // 释放所有 Blob URL
  fileSystemCache.fileCache.forEach(url => {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  });
  
  fileSystemCache.fileCache.clear();
  fileSystemCache.directoryHandle = null;
}

/**
 * 检查配置中是否包含本地路径
 */
export function hasLocalPaths(config: any): boolean {
  // 检查歌曲路径和封面
  const hasSongLocalPaths = config.songs?.some((song: any) => 
    isLocalPath(song.path) || isLocalPath(song.cover)
  );
  
  // 检查玩家头像
  const hasPlayerLocalPaths = config.players?.some((player: any) => 
    player.avatar && isLocalPath(player.avatar)
  );
  
  // 检查背景图片
  const hasBackgroundLocalPath = config.ui?.background_image && 
    isLocalPath(config.ui.background_image);
  
  return hasSongLocalPaths || hasPlayerLocalPaths || hasBackgroundLocalPath;
}

/**
 * 获取当前是否已选择文件夹
 */
export function hasDirectorySelected(): boolean {
  return fileSystemCache.directoryHandle !== null;
}

