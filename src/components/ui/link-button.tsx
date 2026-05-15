import Link from "next/link";
import { type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

type LinkButtonProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
} & VariantProps<typeof buttonVariants>;

export function LinkButton({ href, children, variant, size, className }: LinkButtonProps) {
  return (
    <Link href={href} className={cn(buttonVariants({ variant, size }), className)}>
      {children}
    </Link>
  );
}
