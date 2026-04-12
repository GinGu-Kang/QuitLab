import type { HardFilter } from '@/types';

import { OptionButton } from '@/components/diagnose/OptionButton';

export function HardFilterQuestion({
  filter,
  onSelect
}: {
  filter: HardFilter;
  onSelect: (value: string | number | boolean) => void;
}) {
  return (
    <div className={filter.id === 'career' ? 'grid grid-cols-2 gap-3' : 'space-y-3'}>
      {filter.options.map((option) => (
        <OptionButton
          key={`${filter.id}_${String(option.value)}`}
          icon={option.icon}
          title={option.text}
          onClick={() => onSelect(option.value)}
        />
      ))}
    </div>
  );
}
