import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CategoryChipProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export function CategoryChip({ label, active = false, onClick, className }: CategoryChipProps) {
  return (
    <Badge
      variant={active ? 'default' : 'secondary'}
      className={cn(
        'cursor-pointer rounded-full border-0 px-4 py-2 transition-all',
        active
          ? 'bg-primary text-primary-foreground hover:bg-primary-hover'
          : 'bg-surface-muted text-foreground hover:bg-surface-muted/80 hover:text-primary',
        className,
      )}
      onClick={onClick}
    >
      {label}
    </Badge>
  );
}
