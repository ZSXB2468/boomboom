/// <reference types="@solidjs/start/env" />
/// <reference types="mdui/jsx.zh-cn.d.ts" />

// File System Access API 类型定义
interface FileSystemDirectoryHandle {
  readonly name: string;
  readonly kind: 'directory';
  getDirectoryHandle(name: string): Promise<FileSystemDirectoryHandle>;
  getFileHandle(name: string): Promise<FileSystemFileHandle>;
}

interface FileSystemFileHandle {
  readonly name: string;
  readonly kind: 'file';
  getFile(): Promise<File>;
}

interface Window {
  showDirectoryPicker?(options?: {
    mode?: 'read' | 'readwrite';
    startIn?: 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos';
  }): Promise<FileSystemDirectoryHandle>;
}


