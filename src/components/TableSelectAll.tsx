import './table-select-all.css';

type TableSelectAllProps = {
  label?: string;
  rowCount: number;
  selectedCount: number;
  onChange: (checked: boolean) => void;
};

export function TableSelectAll({
  label = 'Select all visible students',
  rowCount,
  selectedCount,
  onChange,
}: TableSelectAllProps) {
  return (
    <input
      className="table-select-all"
      type="checkbox"
      aria-label={label}
      title={label}
      checked={rowCount > 0 && selectedCount === rowCount}
      disabled={rowCount === 0}
      ref={input => {
        if (input) input.indeterminate = selectedCount > 0 && selectedCount < rowCount;
      }}
      onChange={event => onChange(event.currentTarget.checked)}
    />
  );
}
