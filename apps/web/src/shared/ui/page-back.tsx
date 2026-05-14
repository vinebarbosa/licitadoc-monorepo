import { ArrowLeft } from "lucide-react";
import type * as React from "react";
import { Link, type LinkProps } from "react-router-dom";
import { cn } from "@/shared/lib/utils";

const pageBackClassName =
  "inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

function PageBackContent() {
  return (
    <>
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      <span>Voltar</span>
    </>
  );
}

export function PageBackLink({ className, children, ...props }: LinkProps) {
  return (
    <Link className={cn(pageBackClassName, className)} {...props}>
      {children ?? <PageBackContent />}
    </Link>
  );
}

export function PageBackButton({
  className,
  children,
  type = "button",
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button type={type} className={cn(pageBackClassName, className)} {...props}>
      {children ?? <PageBackContent />}
    </button>
  );
}
