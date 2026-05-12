import { Bell, Moon, Sun } from "lucide-react";
import { Fragment } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "@/app/theme";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/shared/ui/breadcrumb";
import { Button } from "@/shared/ui/button";
import { Separator } from "@/shared/ui/separator";
import { SidebarTrigger } from "@/shared/ui/sidebar";

type BreadcrumbItemType = {
  label: string;
  href?: string;
};

type AppHeaderProps = {
  breadcrumbs?: BreadcrumbItemType[];
  title?: string;
};

export function AppHeader({ breadcrumbs = [], title }: AppHeaderProps) {
  const { isDark, toggleTheme } = useTheme();
  const ThemeIcon = isDark ? Moon : Sun;

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />

      {breadcrumbs.length > 0 && (
        <Breadcrumb className="hidden md:flex">
          <BreadcrumbList>
            {breadcrumbs.map((item, index) => (
              <Fragment key={item.label}>
                {index > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {index === breadcrumbs.length - 1 ? (
                    <BreadcrumbPage>{item.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link to={item.href ?? "/app"}>{item.label}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      )}

      {title && breadcrumbs.length === 0 && <h1 className="text-sm font-medium">{title}</h1>}

      <div className="flex-1" />

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="relative h-8 w-8" aria-label="Notificações">
          <Bell className="h-4 w-4" />
          <span className="-top-1 -right-1 absolute flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] text-primary-foreground">
            2
          </span>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label="Alternar tema"
          onClick={toggleTheme}
        >
          <ThemeIcon className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
