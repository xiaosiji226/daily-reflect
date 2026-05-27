import type { DaySummary } from '../../types';
import EntryListItem from './EntryListItem';

interface Props {
  entries: DaySummary[];
  selectable?: boolean;
  selectedDates?: Set<string>;
  onToggleDate?: (date: string) => void;
}

export default function HistoryList({ entries, selectable, selectedDates, onToggleDate }: Props) {
  return (
    <div className="space-y-2 p-4">
      {entries.map((entry) => (
        <EntryListItem
          key={entry.date}
          entry={entry}
          selectable={selectable}
          selected={selectedDates?.has(entry.date)}
          onToggle={onToggleDate}
        />
      ))}
    </div>
  );
}
