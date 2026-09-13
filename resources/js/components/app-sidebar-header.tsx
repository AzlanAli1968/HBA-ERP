import { Bell, Moon, Search, Sun } from 'lucide-react';
import { useAppearance } from '@/hooks/use-appearance';

import { Breadcrumbs } from '@/components/breadcrumbs';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const { resolvedAppearance, updateAppearance } = useAppearance();

    const toggleAppearance = () => {
        updateAppearance(
            resolvedAppearance === 'dark' ? 'light' : 'dark',
        );
    };

    return (
        <header className="sticky top-0 z-30 border-b border-sidebar-border/70 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <div className="flex h-14 items-center gap-3 px-4 md:px-6">
                {/* Sidebar toggle */}
                <SidebarTrigger className="shrink-0" />

                {/* Breadcrumbs */}
                {breadcrumbs.length > 0 && (
                    <div className="hidden min-w-0 md:block">
                        <Breadcrumbs breadcrumbs={breadcrumbs} />
                    </div>
                )}

                {/* Global search */}
                <div className="flex flex-1 justify-center">
                    <button
                        type="button"
                        className="flex h-9 w-full max-w-xl items-center gap-2 rounded-lg border bg-muted/30 px-3 text-sm text-muted-foreground transition hover:bg-muted/60"
                    >
                        <Search className="size-4 shrink-0" />

                        <span>Search anything...</span>

                        <span className="ml-auto hidden rounded border bg-background px-1.5 py-0.5 text-[10px] font-medium lg:inline">
                            Ctrl K
                        </span>
                    </button>
                </div>

                {/* Right-side controls */}
                <div className="ml-auto flex shrink-0 items-center gap-1.5">
                    {/* Branch */}
                    <Button
                        variant="outline"
                        size="sm"
                        className="hidden h-9 gap-2 lg:flex"
                    >
                        <span className="text-muted-foreground">
                            Branch
                        </span>

                        <span>Head Office</span>
                    </Button>

                    {/* Financial year */}
                    <Button
                        variant="outline"
                        size="sm"
                        className="hidden h-9 gap-2 lg:flex"
                    >
                        <span className="text-muted-foreground">
                            FY
                        </span>

                        <span>2026–2027</span>
                    </Button>

                    {/* Theme toggle */}
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={toggleAppearance}
                        className="size-9"
                        title={
                            resolvedAppearance === 'dark'
                                ? 'Switch to light mode'
                                : 'Switch to dark mode'
                        }
                    >
                        {resolvedAppearance === 'dark' ? (
                            <Sun className="size-5" />
                        ) : (
                            <Moon className="size-5" />
                        )}

                        <span className="sr-only">
                            Toggle theme
                        </span>
                    </Button>

                    {/* Notifications */}
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-9"
                        title="Notifications"
                    >
                        <Bell className="size-5" />

                        <span className="sr-only">
                            Notifications
                        </span>
                    </Button>
                </div>
            </div>

            {/* Mobile breadcrumbs */}
            {breadcrumbs.length > 0 && (
                <div className="border-t border-sidebar-border/40 px-4 py-2 md:hidden">
                    <Breadcrumbs breadcrumbs={breadcrumbs} />
                </div>
            )}
        </header>
    );
}