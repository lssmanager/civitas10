import type { ReactNode } from "react";

export type DataTableColumn<T> = {
  key: string;
  header: ReactNode;
  render: (item: T) => ReactNode;
};

export const DataTable = <T,>({ columns, data, getKey, emptyState }: { columns: DataTableColumn<T>[]; data: T[]; getKey: (item: T, index: number) => string; emptyState?: ReactNode }) => {
  if (data.length === 0 && emptyState) return <>{emptyState}</>;
  return (
    <div className="civitas-table-wrap civitas-scroll-x">
      <table className="civitas-table">
        <thead>
          <tr>{columns.map((column) => <th key={column.key}>{column.header}</th>)}</tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={getKey(item, index)}>{columns.map((column) => <td key={column.key}>{column.render(item)}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
