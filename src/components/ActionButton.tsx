import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const actionButton = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
  {
    variants: {
      variant: {
        primary: "bg-accent text-paper ring-1 ring-accent hover:bg-accent/90",
        quiet: "bg-panel text-ink ring-1 ring-black/5 hover:bg-paper",
        onAccent: "bg-paper text-accent ring-1 ring-paper hover:bg-paper/90",
        danger: "bg-err-soft text-err ring-1 ring-err/20 hover:bg-err-soft/70",
      },
      size: {
        md: "h-9 px-3",
        lg: "h-11 px-4",
        block: "h-10 w-full px-3",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof actionButton>;

export function ActionButton({ className, variant, size, ...props }: Props) {
  return <button {...props} className={cn(actionButton({ variant, size }), className)} />;
}
