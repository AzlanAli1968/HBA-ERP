import { Link, usePage } from '@inertiajs/react';
import {
    BarChart3,
    Building2,
    Calculator,
    Car,
    ChevronDown,
    ChevronRight,
    FileBarChart,
    FileText,
    Hotel,
    LayoutDashboard,
    LogOut,
    Plane,
    ReceiptText,
    Settings,
    ShieldCheck,
    Ticket,
    Users,
    Wallet,
} from 'lucide-react';
import { useState, type ComponentType } from 'react';

import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarSeparator,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';

type NavigationItem = {
    title: string;
    href: string;
    icon: ComponentType<{ className?: string }>;
};

type NavigationSection = {
    label: string;
    items: NavigationItem[];
};

type NavigationGroup = {
    label: string;
    items?: NavigationItem[];
    sections?: NavigationSection[];
};

/*
|--------------------------------------------------------------------------
| Sidebar Navigation
|--------------------------------------------------------------------------
| All existing links are kept, including:
|
| Accounting
| - Accounts
| - General Ledger
| - Customer balance variants
| - Vendor balance variants
| - Vouchers / Journal Vouchers / Receipts / Payments
| - Cash/Bank balances
|
| Sales
| Operations
| Reports
| - Clientwise Clearance
| - Ledger vs Clearance
|
| Administration
|--------------------------------------------------------------------------
*/

const navigationGroups: NavigationGroup[] = [
    {
        label: 'Accounting',
        sections: [
            {
                label: 'Core Accounting',
                items: [
                    {
                        title: 'Accounts',
                        href: '/accounts',
                        icon: Wallet,
                    },
                    {
                        title: 'General Ledger',
                        href: '/accounting/ledger',
                        icon: FileBarChart,
                    },
                ],
            },
            {
                label: 'Customer Balances',
                items: [
                    {
                        title: 'Customer Balances',
                        href: '/accounting/balances/customers',
                        icon: Users,
                    },
                    {
                        title: 'Customer Balances - Datewise',
                        href: '/accounting/balances/customers/datewise',
                        icon: Users,
                    },
                    {
                        title: 'Customer Balances - With Phone',
                        href: '/accounting/balances/customers/phone',
                        icon: Users,
                    },
                    {
                        title: 'Customer Balances - Foreign Currency',
                        href: '/accounting/balances/customers/foreign',
                        icon: Plane,
                    },
                ],
            },
            {
                label: 'Vendor Balances',
                items: [
                    {
                        title: 'Vendor Balances',
                        href: '/accounting/balances/payables',
                        icon: Building2,
                    },
                    {
                        title: 'Vendor Balances - Foreign Currency',
                        href: '/accounting/balances/payables/foreign',
                        icon: Plane,
                    },
                ],
            },
            {
                label: 'Transactions',
                items: [
                    {
                        title: 'Vouchers',
                        href: '/accounting/vouchers',
                        icon: FileText,
                    },
                    {
                        title: 'Journal Vouchers',
                        href: '/accounting/journal-vouchers/all',
                        icon: Calculator,
                    },
                    {
                        title: 'Receipts',
                        href: '/accounting/receipts/all',
                        icon: ReceiptText,
                    },
                    {
                        title: 'Payments',
                        href: '/accounting/payments/all',
                        icon: Wallet,
                    },
                ],
            },
            {
                label: 'Cash & Bank',
                items: [
                    {
                        title: 'Cash/Bank Balances',
                        href: '/accounting/cash-bank-balances',
                        icon: Building2,
                    },
                    {
                        title: 'Cash/Bank Balances - Foreign Currencies',
                        href: '/accounting/cash-bank-balances/foreign-currencies',
                        icon: Plane,
                    },
                ],
            },
        ],
    },
    {
        label: 'Sales',
        sections: [
            {
                label: 'Sales & Customers',
                items: [
                    {
                        title: 'Invoices',
                        href: '/invoices',
                        icon: FileText,
                    },
                    {
                        title: 'Tickets',
                        href: '/tickets',
                        icon: Ticket,
                    },
                    {
                        title: 'Refunds',
                        href: '/refunds',
                        icon: ReceiptText,
                    },
                    {
                        title: 'Customers',
                        href: '/customers',
                        icon: Users,
                    },
                    {
                        title: 'Vendors',
                        href: '/vendors',
                        icon: Building2,
                    },
                ],
            },
        ],
    },
     {
        label: 'Operations',
        sections: [
            {
                label: 'Travel Operations',
                items: [
                    {
                        title: 'Quotations',
                        href: '/quotations',
                        icon: FileText,
                    },
                    {
                        title: 'Quotation Templates',
                        href: '/quotation-templates',
                        icon: FileText,
                    },
                ],
            },
        ],
    },
    {
        label: 'Reports',
        sections: [
            {
                label: 'General Reports',
                items: [
                    {
                        title: 'Sales Reports',
                        href: '/reports/sales',
                        icon: BarChart3,
                    },
                    {
                        title: 'Customer Ledger',
                        href: '/reports/customer-ledger',
                        icon: FileBarChart,
                    },
                    {
                        title: 'Vendor Ledger',
                        href: '/reports/vendor-ledger',
                        icon: FileBarChart,
                    },
                    {
                        title: 'Financial Reports',
                        href: '/reports/financial',
                        icon: BarChart3,
                    },
                ],
            },
            {
                label: 'Financial Reports',
                items: [
                    {
                        title: 'Balance Sheet',
                        href: '/reports/financial?report_type=Balance%20Sheet&report_name=Balance%20Sheet',
                        icon: FileBarChart,
                    },
                    {
                        title: 'Commission Reports',
                        href: '/reports/financial?report_type=Commission%20Reports&report_name=Commission%20Reports',
                        icon: BarChart3,
                    },
                    {
                        title: 'Datewise Profit & Loss',
                        href: '/reports/financial?report_type=Profit%20%26%20Loss&report_name=Datewise%20Profit%20%26%20Loss',
                        icon: BarChart3,
                    },
                    {
                        title: 'Datewise Profit & Loss - Branch',
                        href: '/reports/financial?report_type=Profit%20%26%20Loss&report_name=Datewise%20Profit%20%26%20Loss%20-%20Branch',
                        icon: BarChart3,
                    },
                    {
                        title: 'Datewise Profit & Loss - Client Summary',
                        href: '/reports/financial?report_type=Profit%20%26%20Loss&report_name=Datewise%20Profit%20%26%20Loss%20-%20Client%20Summary',
                        icon: BarChart3,
                    },
                    {
                        title: 'Datewise Profit & Loss - Department',
                        href: '/reports/financial?report_type=Profit%20%26%20Loss&report_name=Datewise%20Profit%20%26%20Loss%20-%20Department',
                        icon: BarChart3,
                    },
                    {
                        title: 'Datewise Profit & Loss - with Opening',
                        href: '/reports/financial?report_type=Profit%20%26%20Loss&report_name=Datewise%20Profit%20%26%20Loss%20-%20with%20Opening',
                        icon: BarChart3,
                    },
                    {
                        title: 'Profit & Loss',
                        href: '/reports/financial?report_type=Profit%20%26%20Loss&report_name=Profit%20%26%20Loss',
                        icon: BarChart3,
                    },
                    {
                        title: 'Trial Balance',
                        href: '/reports/financial?report_type=Trial%20Balance&report_name=Trial%20Balance',
                        icon: FileBarChart,
                    },
                ],
            },
            {
                label: 'Sales Reports',
                items: [
                    {
                        title: 'Simple Sale Register',
                        href: '/reports/sales?report_name=Simple%20Sale%20Register',
                        icon: BarChart3,
                    },
                    {
                        title: 'Simple Sale Register - Category wise Client Report',
                        href: '/reports/sales?report_name=Simple%20Sale%20Register%20-%20Category%20wise%20Client%20Report',
                        icon: BarChart3,
                    },
                    {
                        title: 'Simple Sale Register - Client wise',
                        href: '/reports/sales?report_name=Simple%20Sale%20Register%20-%20Client%20wise',
                        icon: BarChart3,
                    },
                    {
                        title: 'Simple Sale Register - Modewise',
                        href: '/reports/sales?report_name=Simple%20Sale%20Register%20-%20Modewise',
                        icon: BarChart3,
                    },
                ],
            },
            {
                label: 'Other Reports',
                items: [
                    {
                        title: 'Check In',
                        href: '/reports/other?report_name=Check%20In',
                        icon: Hotel,
                    },
                    {
                        title: 'Transportation Action Report',
                        href: '/reports/other?report_name=Transportation%20Action%20Report',
                        icon: Car,
                    },
                ],
            },
            {
                label: 'Clearance Reports',
                items: [
                    {
                        title: 'Clientwise Clearance',
                        href: '/accounting/clearance/clientwise',
                        icon: ReceiptText,
                    },
                    {
                        title: 'Ledger vs Clearance',
                        href: '/accounting/clearance/difference',
                        icon: FileBarChart,
                    },
                ],
            },
        ],
    },

    {
        label: 'Administration',
        sections: [
            {
                label: 'Administration',
                items: [
                    {
                        title: 'Users',
                        href: '/admin/users',
                        icon: Users,
                    },
                    {
                        title: 'Roles & Permissions',
                        href: '/admin/roles',
                        icon: ShieldCheck,
                    },
                    {
                        title: 'Company Settings',
                        href: '/admin/settings',
                        icon: Settings,
                    },
                ],
            },
        ],
    },
];

type CompanyLogoProps = {
    company?: {
        logo_url?: string | null;
    };
};

function CompanyLogoMark() {
    const { company } = usePage<CompanyLogoProps>().props;
    const logoUrl = company?.logo_url ?? null;

    if (logoUrl) {
        return (
            <div className="flex size-9 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm">
                <img
                    src={logoUrl}
                    alt="Company logo"
                    className="size-full object-contain p-1"
                />
            </div>
        );
    }

    return (
        <div className="flex size-9 items-center justify-center rounded-xl bg-neutral-900 text-sm font-bold text-white shadow-sm dark:bg-white dark:text-neutral-900">
            HBA
        </div>
    );
}

export function AppSidebar() {
    const page = usePage();

    const { auth } = page.props as {
        auth: {
            user?: {
                name?: string;
                email?: string;
                avatar?: string;
            };
        };
    };

    const currentUrl = page.url;

    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
        Object.fromEntries(
            navigationGroups.map((group) => [group.label, true]),
        ),
    );

    const [openSections, setOpenSections] = useState<Record<string, boolean>>(
        () =>
            Object.fromEntries(
                navigationGroups.flatMap((group) =>
                    (group.sections ?? []).map((section) => [
                        `${group.label}:${section.label}`,
                        true,
                    ]),
                ),
            ),
    );

    function isActive(href: string): boolean {
        if (href === '/') {
            return currentUrl === '/';
        }

        return (
            currentUrl === href ||
            currentUrl.startsWith(`${href}/`)
        );
    }

    function toggleGroup(label: string) {
        setOpenGroups((previous) => ({
            ...previous,
            [label]: !(previous[label] ?? true),
        }));
    }

    function toggleSection(groupLabel: string, sectionLabel: string) {
        const key = `${groupLabel}:${sectionLabel}`;

        setOpenSections((previous) => ({
            ...previous,
            [key]: !(previous[key] ?? true),
        }));
    }

    return (
        <Sidebar
            collapsible="icon"
            variant="sidebar"
            className="overflow-x-hidden"
        >
            {/* ---------------------------------------------------------------- */}
            {/* BRAND                                                           */}
            {/* ---------------------------------------------------------------- */}
            <SidebarHeader className="border-b border-sidebar-border/70">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            size="lg"
                            tooltip="HBA Travel & Tours"
                        >
                            <Link href={dashboard()} prefetch>
                                <CompanyLogoMark />

                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-bold tracking-tight">
                                        HBA ERP
                                    </span>

                                    <span className="truncate text-xs text-muted-foreground">
                                        Travel & Tours
                                    </span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            {/* ---------------------------------------------------------------- */}
            {/* CONTENT                                                         */}
            {/* ---------------------------------------------------------------- */}
            <SidebarContent className="gap-0 overflow-x-hidden">
                {/* Dashboard */}
                <SidebarGroup className="py-3">
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                asChild
                                isActive={isActive(dashboard().url)}
                                tooltip="Dashboard"
                            >
                                <Link href={dashboard()} prefetch>
                                    <LayoutDashboard />
                                    <span>Dashboard</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>

                <SidebarSeparator />

                {/* Navigation Groups */}
                {navigationGroups.map((group) => {
                    const groupOpen = openGroups[group.label] ?? true;

                    return (
                        <SidebarGroup
                            key={group.label}
                            className="py-2"
                        >
                            <SidebarGroupLabel
                                role="button"
                                tabIndex={0}
                                aria-expanded={groupOpen}
                                onClick={() => toggleGroup(group.label)}
                                onKeyDown={(event) => {
                                    if (
                                        event.key === 'Enter' ||
                                        event.key === ' '
                                    ) {
                                        event.preventDefault();
                                        toggleGroup(group.label);
                                    }
                                }}
                                className="cursor-pointer select-none px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                {groupOpen ? (
                                    <ChevronDown className="mr-1 size-3.5 shrink-0" />
                                ) : (
                                    <ChevronRight className="mr-1 size-3.5 shrink-0" />
                                )}

                                <span className="truncate">{group.label}</span>
                            </SidebarGroupLabel>

                            {groupOpen && (
                                <>
                                    {group.sections?.map((section) => {
                                        const sectionKey = `${group.label}:${section.label}`;
                                        const sectionOpen =
                                            openSections[sectionKey] ?? true;

                                        return (
                                            <div
                                                key={sectionKey}
                                                className="mt-1"
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        toggleSection(
                                                            group.label,
                                                            section.label,
                                                        )
                                                    }
                                                    aria-expanded={sectionOpen}
                                                    className="flex h-8 w-full items-center gap-1.5 rounded-md px-2 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-data-[collapsible=icon]:hidden"
                                                >
                                                    {sectionOpen ? (
                                                        <ChevronDown className="size-3" />
                                                    ) : (
                                                        <ChevronRight className="size-3" />
                                                    )}

                                                    <span className="truncate">
                                                        {section.label}
                                                    </span>
                                                </button>

                                                {sectionOpen && (
                                                    <SidebarMenu className="mt-0.5">
                                                        {section.items.map(
                                                            (item) => (
                                                                <SidebarMenuItem
                                                                    key={
                                                                        item.title
                                                                    }
                                                                >
                                                                    <SidebarMenuButton
                                                                        asChild
                                                                        isActive={isActive(
                                                                            item.href,
                                                                        )}
                                                                        tooltip={
                                                                            item.title
                                                                        }
                                                                    >
                                                                        <Link
                                                                            href={
                                                                                item.href
                                                                            }
                                                                            prefetch
                                                                        >
                                                                            <item.icon />
                                                                            <span>
                                                                                {
                                                                                    item.title
                                                                                }
                                                                            </span>
                                                                        </Link>
                                                                    </SidebarMenuButton>
                                                                </SidebarMenuItem>
                                                            ),
                                                        )}
                                                    </SidebarMenu>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {group.items && group.items.length > 0 && (
                                        <SidebarMenu>
                                            {group.items.map((item) => (
                                                <SidebarMenuItem
                                                    key={item.title}
                                                >
                                                    <SidebarMenuButton
                                                        asChild
                                                        isActive={isActive(
                                                            item.href,
                                                        )}
                                                        tooltip={item.title}
                                                    >
                                                        <Link
                                                            href={item.href}
                                                            prefetch
                                                        >
                                                            <item.icon />
                                                            <span>
                                                                {item.title}
                                                            </span>
                                                        </Link>
                                                    </SidebarMenuButton>
                                                </SidebarMenuItem>
                                            ))}
                                        </SidebarMenu>
                                    )}
                                </>
                            )}
                        </SidebarGroup>
                    );
                })}
            </SidebarContent>

            {/* ---------------------------------------------------------------- */}
            {/* FOOTER                                                          */}
            {/* ---------------------------------------------------------------- */}
            <SidebarFooter className="border-t border-sidebar-border/70">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            tooltip="Settings"
                        >
                            <Link href="/settings">
                                <Settings />
                                <span>Settings</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            tooltip="Logout"
                        >
                            <Link
                                href="/logout"
                                method="post"
                                as="button"
                            >
                                <LogOut />
                                <span>Logout</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>

                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
