import { For, JSX } from "solid-js";
import "./Table.css";
export interface TableColumn<T = any> {
  key: string;
  title: string;
  width?: string;
  align?: "left" | "center" | "right";
  render?: (value: any, record: T, index: number) => JSX.Element | string | number;
}
export interface TableProps<T = any> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  bordered?: boolean;
  hoverable?: boolean;
  striped?: boolean;
  onRowClick?: (record: T, index: number) => void;
  class?: string;
}
export default function Table<T = any>(props: TableProps<T>): JSX.Element {
  const getTableClass = () => {
    const classes = ["mdui-table"];
    if (props.bordered) classes.push("mdui-table-bordered");
    if (props.hoverable) classes.push("mdui-table-hoverable");
    if (props.striped) classes.push("mdui-table-striped");
    if (props.class) classes.push(props.class);
    return classes.join(" ");
  };
  const getCellValue = (record: T, column: TableColumn<T>, index: number) => {
    const value = (record as any)[column.key];
    if (column.render) {
      return column.render(value, record, index);
    }
    return value;
  };
  const handleRowClick = (record: T, index: number) => {
    if (props.onRowClick) {
      props.onRowClick(record, index);
    }
  };
  return (
    <div class="mdui-table-container">
      {props.loading && (
        <div class="mdui-table-loading">
          <div class="mdui-spinner"></div>
        </div>
      )}
      <table class={getTableClass()}>
        <thead>
          <tr>
            <For each={props.columns}>
              {(column) => (
                <th
                  style={{
                    width: column.width,
                    "text-align": column.align || "left",
                  }}
                >
                  {column.title}
                </th>
              )}
            </For>
          </tr>
        </thead>
        <tbody>
          <For each={props.data}>
            {(record, index) => (
              <tr
                onClick={() => handleRowClick(record, index())}
                class={props.onRowClick ? "mdui-table-row-clickable" : ""}
              >
                <For each={props.columns}>
                  {(column) => (
                    <td
                      style={{
                        "text-align": column.align || "left",
                      }}
                    >
                      {getCellValue(record, column, index())}
                    </td>
                  )}
                </For>
              </tr>
            )}
          </For>
        </tbody>
      </table>
      {props.data.length === 0 && !props.loading && (
        <div class="mdui-table-empty">
          <div class="mdui-table-empty-icon">📭</div>
          <div class="mdui-table-empty-text">暂无数据</div>
        </div>
      )}
    </div>
  );
}
