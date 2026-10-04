export function ColumnSplitter({
  isDragging = false,
  onStart,
  onReset,
  title = "Drag to resize (Double-click to reset 50/50)",
}) {
  return (
    <div
      className={`forge-splitter-handle-col ${isDragging ? "active-drag" : ""}`}
      onMouseDown={onStart}
      onTouchStart={onStart}
      onDoubleClick={onReset}
      title={title}
      role="separator"
      aria-orientation="vertical"
      tabIndex={0}
    >
      <div className="splitter-grip-dots-col" />
    </div>
  );
}

export function RowSplitter({
  isDragging = false,
  onStart,
  onReset,
  title = "Drag to resize (Double-click to reset)",
}) {
  return (
    <div
      className={`forge-splitter-handle-row ${isDragging ? "active-drag" : ""}`}
      onMouseDown={onStart}
      onTouchStart={onStart}
      onDoubleClick={onReset}
      title={title}
      role="separator"
      aria-orientation="horizontal"
      tabIndex={0}
    >
      <div className="splitter-grip-dots-row" />
    </div>
  );
}
