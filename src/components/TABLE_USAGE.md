# MDUI Table 组件使用说明

## 简介

这是一个基于 MDUI 设计风格的表格组件，使用 SolidJS 构建，提供了丰富的功能和灵活的定制选项。

## 功能特性

- ✅ MDUI Material Design 设计风格
- ✅ 响应式设计，支持移动端
- ✅ 支持自定义列渲染
- ✅ 支持行点击事件
- ✅ 支持加载状态
- ✅ 支持空数据状态
- ✅ 支持多种样式变体（边框、悬停、条纹）
- ✅ 支持列对齐方式
- ✅ 完整的 TypeScript 类型支持

## 基本用法

```tsx

// noinspection JSAnnotator

import Table, {TableColumn} from "./components/Table";

interface User {
  id: number;
  name: string;
  email: string;
  age: number;
}

function MyComponent() {
  const columns: TableColumn<User>[] = [
    {
      key: "id",
      title: "ID",
      width: "80px",
      align: "center",
    },
    {
      key: "name",
      title: "姓名",
    },
    {
      key: "email",
      title: "邮箱",
    },
    {
      key: "age",
      title: "年龄",
      align: "right",
    },
  ];

  const data: User[] = [
    {id: 1, name: "张三", email: "zhangsan@example.com", age: 25},
    {id: 2, name: "李四", email: "lisi@example.com", age: 30},
    {id: 3, name: "王五", email: "wangwu@example.com", age: 28},
  ];

  return <Table columns={columns} data={data}/>;
}
```

## 自定义渲染

```tsx
const columns: TableColumn<User>[] = [
  {
    key: "id",
    title: "ID",
    width: "80px",
    align: "center",
  },
  {
    key: "name",
    title: "姓名",
    render: (value, record) => (
      <strong style={{ color: "#1976d2" }}>{value}</strong>
    ),
  },
  {
    key: "age",
    title: "年龄",
    render: (value) => {
      const color = value >= 30 ? "#f44336" : "#4caf50";
      return <span style={{ color }}>{value} 岁</span>;
    },
  },
  {
    key: "actions",
    title: "操作",
    align: "center",
    render: (_, record) => (
      <button onClick={() => console.log("编辑", record)}>编辑</button>
    ),
  },
];
```

## 样式变体

```tsx
// 带边框
<Table columns={columns} data={data} bordered />

// 悬停高亮
<Table columns={columns} data={data} hoverable />

// 条纹样式
<Table columns={columns} data={data} striped />

// 组合使用
<Table columns={columns} data={data} bordered hoverable striped />
```

## 行点击事件

```tsx
const handleRowClick = (record: User, index: number) => {
  console.log("点击了行:", record, "索引:", index);
};

<Table columns={columns} data={data} onRowClick={handleRowClick} hoverable />;
```

## 加载状态

```tsx
import { createSignal } from "solid-js";

function MyComponent() {
  const [loading, setLoading] = createSignal(true);
  const [data, setData] = createSignal<User[]>([]);

  // 模拟数据加载
  setTimeout(() => {
    setData([
      { id: 1, name: "张三", email: "zhangsan@example.com", age: 25 },
    ]);
    setLoading(false);
  }, 2000);

  return <Table columns={columns} data={data()} loading={loading()} />;
}
```

## 空数据状态

当 `data` 为空数组时，会自动显示"暂无数据"提示。

```tsx
<Table columns={columns} data={[]} />
```

## Props 接口

### TableProps

| 属性        | 类型                                    | 必填 | 默认值  | 说明                     |
| ----------- | --------------------------------------- | ---- | ------- | ------------------------ |
| columns     | TableColumn[]                           | 是   | -       | 表格列配置               |
| data        | T[]                                     | 是   | -       | 表格数据                 |
| loading     | boolean                                 | 否   | false   | 是否显示加载状态         |
| bordered    | boolean                                 | 否   | false   | 是否显示边框             |
| hoverable   | boolean                                 | 否   | false   | 是否启用悬停效果         |
| striped     | boolean                                 | 否   | false   | 是否显示条纹样式         |
| onRowClick  | (record: T, index: number) => void      | 否   | -       | 行点击回调函数           |
| class       | string                                  | 否   | -       | 自定义样式类名           |

### TableColumn

| 属性   | 类型                                                | 必填 | 默认值 | 说明                       |
| ------ | --------------------------------------------------- | ---- | ------ | -------------------------- |
| key    | string                                              | 是   | -      | 数据字段名                 |
| title  | string                                              | 是   | -      | 列标题                     |
| width  | string                                              | 否   | -      | 列宽度（如 "100px", "20%"）|
| align  | "left" \| "center" \| "right"                       | 否   | "left" | 列对齐方式                 |
| render | (value: any, record: T, index: number) => JSX.Element \| string \| number | 否 | - | 自定义渲染函数 |

## 完整示例

```tsx
// noinspection JSAnnotator

import {createSignal} from "solid-js";
import Table, {TableColumn} from "./components/Table";

interface Song {
  id: number;
  title: string;
  artist: string;
  album: string;
  duration: number;
  score: number;
}

export default function SongList() {
  const [loading, setLoading] = createSignal(false);

  const columns: TableColumn<Song>[] = [
    {
      key: "id",
      title: "ID",
      width: "60px",
      align: "center",
    },
    {
      key: "title",
      title: "歌曲名",
      render: (value) => <strong>{value}</strong>,
    },
    {
      key: "artist",
      title: "歌手",
    },
    {
      key: "album",
      title: "专辑",
    },
    {
      key: "duration",
      title: "时长",
      align: "center",
      render: (value) => {
        const minutes = Math.floor(value / 60);
        const seconds = value % 60;
        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
      },
    },
    {
      key: "score",
      title: "分值",
      align: "center",
      render: (value) => (
        <span
          style={{
            padding: "4px 8px",
            "border-radius": "4px",
            background: "#e3f2fd",
            color: "#1976d2",
            "font-weight": "500",
          }}
        >
          {value}
        </span>
      ),
    },
  ];

  const data: Song[] = [
    {
      id: 1,
      title: "Shape of You",
      artist: "Ed Sheeran",
      album: "÷ (Divide)",
      duration: 233,
      score: 10,
    },
    {
      id: 2,
      title: "Bohemian Rhapsody",
      artist: "Queen",
      album: "A Night at the Opera",
      duration: 354,
      score: 15,
    },
    {
      id: 3,
      title: "Hotel California",
      artist: "Eagles",
      album: "Hotel California",
      duration: 391,
      score: 12,
    },
  ];

  const handleRowClick = (song: Song, index: number) => {
    console.log(`点击了第 ${index + 1} 行:`, song.title);
  };

  return (
    <div style={{padding: "20px"}}>
      <h2>歌曲列表</h2>
      <Table
        columns={columns}
        data={data}
        loading={loading()}
        bordered
        hoverable
        striped
        onRowClick={handleRowClick}
      />
    </div>
  );
}
```

## 样式定制

如果需要自定义样式，可以通过 `class` 属性传入自定义类名：

```tsx
<Table columns={columns} data={data} class="my-custom-table" />
```

然后在你的 CSS 文件中定义样式：

```css
.my-custom-table th {
  background-color: #1976d2;
  color: white;
}

.my-custom-table tbody tr:hover {
  background-color: #e3f2fd;
}
```

## 注意事项

1. 确保每条数据都有唯一的 `id` 或使用 SolidJS 的 `index()` 作为 key
2. 使用 `render` 函数时，返回的 JSX 元素会直接渲染，注意性能优化
3. 当数据量很大时，建议结合虚拟滚动库使用
4. 列的 `key` 必须与数据对象的属性名匹配

