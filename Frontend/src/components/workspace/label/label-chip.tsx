import { labelColorClasses } from "@/constant";
import { cn } from "@/lib/utils";
import { LabelType } from "@/types/api.type";

const LabelChip = ({
  label,
  className,
}: {
  label: LabelType;
  className?: string;
}) => (
  <span
    className={cn(
      "inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium leading-none max-w-[120px] truncate",
      labelColorClasses[label.color] || labelColorClasses.GRAY,
      className
    )}
    title={label.name}
  >
    {label.name}
  </span>
);

export const LabelChips = ({
  labels,
  max = 3,
}: {
  labels?: LabelType[];
  max?: number;
}) => {
  if (!labels || labels.length === 0) return null;
  const visible = labels.slice(0, max);
  const hidden = labels.length - visible.length;

  return (
    <div className="flex flex-wrap items-center gap-1">
      {visible.map((label) => (
        <LabelChip key={label._id} label={label} />
      ))}
      {hidden > 0 && (
        <span className="text-[11px] text-muted-foreground">+{hidden}</span>
      )}
    </div>
  );
};

export default LabelChip;
