import {
    ArrowDownLeft,
    ArrowUpRight,
    Building2,
    ChevronRight,
    FileText,
    Hotel,
    LayoutDashboard,
    Plane,
    ReceiptText,
    RefreshCw,
    Ticket,
    TrendingUp,
    Users,
    Wallet,
} from 'lucide-react';
import { Head, Link, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import type { ComponentType, ReactNode } from 'react';



type Trend = {
    direction: 'up' | 'down' | 'flat';
    percentage: number | null;
    label: string;
};

type Kpis = {
    todaySales: number;
    todayTransactions: number;
    todayProfit: number;
    receivables: number;
    receivableAccounts: number;
    payables: number;
    payableAccounts: number;
    salesTrend: Trend;
    profitTrend: Trend;
    monthSales: number;
    monthProfit: number;
};

type ChartPoint = {
    date: string;
    label: string;
    sales: number;
    profit: number;
};

type CheckInRow = {
    invoice: number;
    passenger: string;
    hotel: string;
    check_in: string;
    check_out: string;
    room_type: string;
    rooms: number;
    client: string;
};

type TransferRow = {
    invoice: number;
    passenger: string;
    transfer_date: string;
    route: string;
    ticket_no: string;
    client: string;
};

type RecentSale = {
    invoice: number;
    customer: string;
    service: string;
    amount: number;
    profit: number;
    date: string;
};

type QuickAction = {
    title: string;
    description: string;
    href: string;
    icon: 'invoice' | 'voucher' | 'receipt' | 'payment';
};

type DashboardProps = {
    todayLabel: string;
    tomorrowLabel: string;
    monthLabel: string;
    chartLabel: string;
    currency: string;
    kpis: Kpis;
    chart: ChartPoint[];
    tomorrow: {
        checkIns: CheckInRow[];
        checkInsCount: number;
        transfers: TransferRow[];
        transfersCount: number;
    };
    recentSales: RecentSale[];
    overview: {
        activeCustomers: number;
        activeVendors: number;
        hotelBookings: number;
        ticketTransactions: number;
    };
    quickActions: QuickAction[];
};

function formatMoney(value: number, compact = false) {
    const amount = Number(value || 0);

    if (!compact) {
        return `PKR ${amount.toLocaleString('en-PK', {
            maximumFractionDigits: 0,
        })}`;
    }

    const absolute = Math.abs(amount);

    if (absolute >= 1_000_000) {
        return `PKR ${(amount / 1_000_000).toFixed(2)}M`;
    }

    if (absolute >= 1_000) {
        return `PKR ${(amount / 1_000).toFixed(0)}K`;
    }

    return `PKR ${amount.toLocaleString('en-PK', {
        maximumFractionDigits: 0,
    })}`;
}

function formatCount(value: number) {
    return Number(value || 0).toLocaleString('en-PK');
}

function TrendBadge({ trend }: { trend: Trend }) {
    const positive = trend.direction === 'up';
    const negative = trend.direction === 'down';

    return (
        <div className="mt-4 flex items-center gap-1 text-xs font-medium">
            {positive ? (
                <ArrowUpRight className="size-3.5" />
            ) : negative ? (
                <ArrowDownLeft className="size-3.5" />
            ) : (
                <span className="text-muted-foreground">•</span>
            )}

            <span className={negative ? 'text-muted-foreground' : undefined}>
                {trend.label}
            </span>
        </div>
    );
}

function StatCard({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
}: {
    title: string;
    value: string;
    subtitle: string;
    icon: ComponentType<{ className?: string }>;
    trend?: Trend;
}) {
    return (
        <div className="rounded-2xl border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between">
                <div className="min-w-0">
                    <p className="text-sm font-medium text-muted-foreground">
                        {title}
                    </p>
                    <p className="mt-2 text-2xl font-bold tracking-tight">
                        {value}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {subtitle}
                    </p>
                </div>

                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                    <Icon className="size-5" />
                </div>
            </div>

            {trend && <TrendBadge trend={trend} />}
        </div>
    );
}

function SectionTitle({
    title,
    subtitle,
    action,
}: {
    title: string;
    subtitle: string;
    action?: ReactNode;
}) {
    return (
        <div className="flex items-end justify-between gap-4 border-b px-5 py-4">
            <div>
                <h2 className="font-semibold">{title}</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                    {subtitle}
                </p>
            </div>
            {action}
        </div>
    );
}

function EmptyTableState({ message }: { message: string }) {
    return (
        <div className="flex min-h-32 items-center justify-center px-6 text-sm text-muted-foreground">
            {message}
        </div>
    );
}

/* HBA_DASHBOARD_INTERACTIVE_TOOLTIP_20260916_V4 */
function MiniChart({
    points,
    mode,
}: {
    points: ChartPoint[];
    mode: 'sales' | 'profit';
}) {
    const width = 980;
    const height = 300;
    const padding = {
        top: 20,
        right: 20,
        bottom: 42,
        left: 58,
    };

    const values = points.map((point) => Number(point[mode] || 0));
    const maxValue = Math.max(...values, 1);
    const minValue = 0;

    const innerWidth = width - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;

    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const pointPosition = (index: number) => {
        const x =
            padding.left +
            (index / Math.max(points.length - 1, 1)) * innerWidth;

        const value = Number(points[index]?.[mode] || 0);

        const y =
            padding.top +
            innerHeight -
            ((value - minValue) /
                Math.max(maxValue - minValue, 1)) *
                innerHeight;

        return { x, y };
    };

    const path = useMemo(() => {
        return points
            .map((point, index) => {
                const { x, y } = pointPosition(index);
                return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
            })
            .join(' ');
    }, [points, mode, maxValue]);

    const gridLines = [0, 0.25, 0.5, 0.75, 1];

    function handlePointerMove(
        event: React.PointerEvent<SVGSVGElement>,
    ) {
        if (points.length === 0) {
            return;
        }

        const rect =
            event.currentTarget.getBoundingClientRect();

        if (rect.width <= 0) {
            return;
        }

        const localX =
            ((event.clientX - rect.left) / rect.width) * width;

        const rawIndex =
            ((localX - padding.left) / innerWidth) *
            Math.max(points.length - 1, 1);

        const index = Math.max(
            0,
            Math.min(
                points.length - 1,
                Math.round(rawIndex),
            ),
        );

        setHoveredIndex(index);
    }

    const hoveredPoint =
        hoveredIndex !== null
            ? points[hoveredIndex]
            : null;

    const hoveredPosition =
        hoveredIndex !== null
            ? pointPosition(hoveredIndex)
            : null;

    const tooltipLeft =
        hoveredPosition
            ? Math.max(
                  12,
                  Math.min(
                      88,
                      (hoveredPosition.x / width) * 100,
                  ),
              )
            : 0;

    const tooltipTop =
        hoveredPosition
            ? Math.max(
                  8,
                  Math.min(
                      82,
                      ((hoveredPosition.y + 18) / height) * 100,
                  ),
              )
            : 0;

    return (
        <div className="relative w-full overflow-hidden">
            <svg
                viewBox={`0 0 ${width} ${height}`}
                className="h-[300px] w-full min-w-[680px]"
                role="img"
                aria-label={`${mode === 'sales' ? 'Sales' : 'Profit'} chart`}
                onPointerMove={handlePointerMove}
                onPointerLeave={() => setHoveredIndex(null)}
                style={{ cursor: 'crosshair' }}
            >
                {gridLines.map((ratio) => {
                    const y =
                        padding.top +
                        innerHeight * ratio;
                    const value =
                        maxValue * (1 - ratio);

                    return (
                        <g key={ratio}>
                            <line
                                x1={padding.left}
                                x2={width - padding.right}
                                y1={y}
                                y2={y}
                                stroke="currentColor"
                                className="text-border"
                                strokeDasharray="3 5"
                            />
                            <text
                                x={padding.left - 12}
                                y={y + 4}
                                textAnchor="end"
                                className="fill-muted-foreground text-[11px]"
                            >
                                {formatMoney(value, true).replace(
                                    'PKR ',
                                    '',
                                )}
                            </text>
                        </g>
                    );
                })}

                <line
                    x1={padding.left}
                    x2={width - padding.right}
                    y1={padding.top + innerHeight}
                    y2={padding.top + innerHeight}
                    stroke="currentColor"
                    className="text-border"
                />

                <path
                    d={path}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={
                        mode === 'sales'
                            ? 'text-foreground'
                            : 'text-muted-foreground'
                    }
                />

                {hoveredPosition && (
                    <line
                        x1={hoveredPosition.x}
                        x2={hoveredPosition.x}
                        y1={padding.top}
                        y2={padding.top + innerHeight}
                        stroke="currentColor"
                        strokeDasharray="4 4"
                        strokeOpacity="0.25"
                    />
                )}

                {points.map((point, index) => {
                    const { x, y } =
                        pointPosition(index);

                    const isHovered =
                        hoveredIndex === index;

                    return (
                        <g
                            key={`${point.date}-${mode}`}
                        >
                            <circle
                                cx={x}
                                cy={y}
                                r={isHovered ? 6 : 3.5}
                                fill="currentColor"
                                className={
                                    mode === 'sales'
                                        ? 'text-foreground'
                                        : 'text-muted-foreground'
                                }
                            />

                            {(index === 0 ||
                                index === points.length - 1 ||
                                index % 5 === 0) && (
                                <text
                                    x={x}
                                    y={height - 16}
                                    textAnchor="middle"
                                    className="fill-muted-foreground text-[11px]"
                                >
                                    {point.label}
                                </text>
                            )}
                        </g>
                    );
                })}
            </svg>

            {hoveredPoint && hoveredPosition && (
                <div
                    className="pointer-events-none absolute z-20 -translate-x-1/2 rounded-xl border px-3 py-2 shadow-lg"
                    style={{
                        left: `${tooltipLeft}%`,
                        top: `${tooltipTop}%`,
                        backgroundColor: '#ffffff',
                        borderColor: '#d1d5db',
                        color: '#111827',
                        minWidth: 170,
                    }}
                >
                    <div
                        style={{
                            color: '#6b7280',
                            fontSize: 11,
                            lineHeight: '16px',
                        }}
                    >
                        {hoveredPoint.label}
                    </div>

                    <div
                        style={{
                            color: '#111827',
                            fontSize: 13,
                            lineHeight: '19px',
                            fontWeight: 600,
                        }}
                    >
                        {mode === 'sales'
                            ? 'Sales'
                            : 'Profit'}
                        :{' '}
                        {formatMoney(
                            Number(
                                hoveredPoint[mode] || 0,
                            ),
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function QuickActionIcon({
    type,
}: {
    type: QuickAction['icon'];
}) {
    const Icon =
        type === 'invoice'
            ? FileText
            : type === 'voucher'
              ? LayoutDashboard
              : type === 'receipt'
                ? ReceiptText
                : Wallet;

    return <Icon className="size-5" />;
}

export default function Dashboard() {
    const { props } = usePage<DashboardProps>();
    const [chartMode, setChartMode] = useState<'sales' | 'profit'>('sales');

    const maxCheckIns = 10;
    const maxTransfers = 6;

    return (
        <>
            <Head title="Dashboard" />

            <div className="min-h-full bg-muted/20">
                <div className="mx-auto w-full max-w-[1700px] p-4 md:p-6 lg:p-8">
                    <div className="flex flex-col gap-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                    <LayoutDashboard className="size-4" />
                                    <span>HBA Travel & Tours</span>
                                </div>

                                <h1 className="mt-2 text-3xl font-bold tracking-tight">
                                    Dashboard
                                </h1>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    Live business overview · Head Office ·
                                    Financial Year 2026–2027
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <div className="rounded-xl border bg-background px-4 py-2.5 text-sm shadow-sm">
                                    <span className="text-muted-foreground">
                                        Today
                                    </span>
                                    <span className="ml-2 font-semibold">
                                        {props.todayLabel}
                                    </span>
                                </div>

                                <Link
                                    href="/dashboard"
                                    className="inline-flex items-center gap-2 rounded-xl border bg-background px-3 py-2.5 text-sm font-medium shadow-sm transition hover:bg-muted/40"
                                >
                                    <RefreshCw className="size-4" />
                                    Refresh
                                </Link>
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            <StatCard
                                title="Today's Sales"
                                value={formatMoney(
                                    props.kpis.todaySales,
                                    true,
                                )}
                                subtitle={`${formatCount(props.kpis.todayTransactions)} transactions`}
                                icon={TrendingUp}
                                trend={props.kpis.salesTrend}
                            />

                            <StatCard
                                title="Receivables"
                                value={formatMoney(
                                    props.kpis.receivables,
                                    true,
                                )}
                                subtitle={`${formatCount(props.kpis.receivableAccounts)} customer accounts with balance`}
                                icon={Users}
                            />

                            <StatCard
                                title="Payables"
                                value={formatMoney(
                                    props.kpis.payables,
                                    true,
                                )}
                                subtitle={`${formatCount(props.kpis.payableAccounts)} vendor accounts with balance`}
                                icon={Building2}
                            />

                            <StatCard
                                title="Today's Profit"
                                value={formatMoney(
                                    props.kpis.todayProfit,
                                    true,
                                )}
                                subtitle="Posted invoice-line profit"
                                icon={TrendingUp}
                                trend={props.kpis.profitTrend}
                            />
                        </div>

                        <section className="rounded-2xl border bg-background shadow-sm">
                            <div className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h2 className="font-semibold">
                                        Daily Sales & Profit
                                    </h2>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {props.chartLabel} · Current month
                                    </p>
                                </div>

                                <div className="inline-flex w-fit rounded-xl border bg-muted/30 p-1">
                                    <button
                                        type="button"
                                        onClick={() => setChartMode('sales')}
                                        className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                                            chartMode === 'sales'
                                                ? 'bg-foreground text-background shadow-sm'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        Sales
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setChartMode('profit')
                                        }
                                        className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                                            chartMode === 'profit'
                                                ? 'bg-foreground text-background shadow-sm'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        Profit
                                    </button>
                                </div>
                            </div>

                            <div className="grid gap-4 px-5 pt-4 sm:grid-cols-3">
                                <div className="rounded-xl bg-muted/30 p-4">
                                    <p className="text-xs text-muted-foreground">
                                        MTD Sales
                                    </p>
                                    <p className="mt-1 text-xl font-bold">
                                        {formatMoney(
                                            props.kpis.monthSales,
                                            true,
                                        )}
                                    </p>
                                </div>

                                <div className="rounded-xl bg-muted/30 p-4">
                                    <p className="text-xs text-muted-foreground">
                                        MTD Profit
                                    </p>
                                    <p className="mt-1 text-xl font-bold">
                                        {formatMoney(
                                            props.kpis.monthProfit,
                                            true,
                                        )}
                                    </p>
                                </div>

                                <div className="rounded-xl bg-muted/30 p-4">
                                    <p className="text-xs text-muted-foreground">
                                        Showing
                                    </p>
                                    <p className="mt-1 text-xl font-bold">
                                        {chartMode === 'sales'
                                            ? 'Sales'
                                            : 'Profit'}
                                    </p>
                                </div>
                            </div>

                            <div className="overflow-x-auto px-2 pb-4 pt-2 sm:px-4">
                                <MiniChart
                                    points={props.chart}
                                    mode={chartMode}
                                />
                            </div>
                        </section>

                        <section>
                            <div className="mb-4 flex items-end justify-between gap-4">
                                <div>
                                    <h2 className="text-lg font-semibold">
                                        Quick Actions
                                    </h2>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Direct links to the live ERP modules
                                    </p>
                                </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                {props.quickActions.map((action) => (
                                    <Link
                                        key={action.title}
                                        href={action.href}
                                        className="group flex items-center gap-4 rounded-2xl border bg-background p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                                    >
                                        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted transition group-hover:bg-foreground group-hover:text-background">
                                            <QuickActionIcon
                                                type={action.icon}
                                            />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <p className="font-semibold">
                                                {action.title}
                                            </p>
                                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                                {action.description}
                                            </p>
                                        </div>

                                        <ChevronRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
                                    </Link>
                                ))}
                            </div>
                        </section>

                        <div className="grid gap-6 xl:grid-cols-2">
                            <section className="overflow-hidden rounded-2xl border bg-background shadow-sm">
                                <SectionTitle
                                    title="TOMORROW CHECK IN"
                                    subtitle={`${props.tomorrowLabel} · ${formatCount(props.tomorrow.checkInsCount)} total`}
                                    action={
                                        <Link
                                            href="/reports/other"
                                            className="text-sm font-medium underline-offset-4 hover:underline"
                                        >
                                            View report
                                        </Link>
                                    }
                                />

                                <div className="overflow-x-auto">
                                    {props.tomorrow.checkIns.length === 0 ? (
                                        <EmptyTableState message="No hotel check-ins found for tomorrow." />
                                    ) : (
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b bg-muted/30 text-left text-xs text-muted-foreground">
                                                    <th className="px-5 py-3 font-medium">
                                                        Invoice
                                                    </th>
                                                    <th className="px-5 py-3 font-medium">
                                                        Passenger
                                                    </th>
                                                    <th className="px-5 py-3 font-medium">
                                                        Hotel
                                                    </th>
                                                    <th className="px-5 py-3 font-medium">
                                                        Stay
                                                    </th>
                                                    <th className="px-5 py-3 font-medium">
                                                        Room
                                                    </th>
                                                    <th className="px-5 py-3 font-medium">
                                                        Client
                                                    </th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {props.tomorrow.checkIns
                                                    .slice(0, maxCheckIns)
                                                    .map((row, index) => (
                                                        <tr
                                                            key={`${row.invoice}-${row.passenger}-${index}`}
                                                            className="border-b last:border-0"
                                                        >
                                                            <td className="px-5 py-4 font-medium">
                                                                {row.invoice
                                                                    ? `#${row.invoice}`
                                                                    : '—'}
                                                            </td>
                                                            <td className="max-w-[190px] px-5 py-4">
                                                                <div className="truncate font-medium">
                                                                    {row.passenger ||
                                                                        '—'}
                                                                </div>
                                                            </td>
                                                            <td className="max-w-[220px] px-5 py-4">
                                                                <div className="truncate">
                                                                    {row.hotel ||
                                                                        '—'}
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-4 whitespace-nowrap text-muted-foreground">
                                                                {row.check_in}
                                                                {row.check_out
                                                                    ? ` → ${row.check_out}`
                                                                    : ''}
                                                            </td>
                                                            <td className="px-5 py-4 whitespace-nowrap">
                                                                {row.room_type ||
                                                                    '—'}
                                                                <span className="ml-1 text-xs text-muted-foreground">
                                                                    ×
                                                                    {row.rooms}
                                                                </span>
                                                            </td>
                                                            <td className="max-w-[160px] px-5 py-4">
                                                                <div className="truncate">
                                                                    {row.client ||
                                                                        '—'}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>

                                {props.tomorrow.checkInsCount >
                                    maxCheckIns && (
                                    <div className="border-t px-5 py-3 text-xs text-muted-foreground">
                                        Showing {Math.min(
                                            maxCheckIns,
                                            props.tomorrow.checkInsCount,
                                        )}{' '}
                                        of {props.tomorrow.checkInsCount} check-ins.
                                    </div>
                                )}
                            </section>

                            <section className="overflow-hidden rounded-2xl border bg-background shadow-sm">
                                <SectionTitle
                                    title="TOMORROW TRANSFERS"
                                    subtitle={`${props.tomorrowLabel} · ${formatCount(props.tomorrow.transfersCount)} total`}
                                    action={
                                        <Link
                                            href="/reports/other"
                                            className="text-sm font-medium underline-offset-4 hover:underline"
                                        >
                                            View report
                                        </Link>
                                    }
                                />

                                <div className="overflow-x-auto">
                                    {props.tomorrow.transfers.length === 0 ? (
                                        <EmptyTableState message="No transfers found for tomorrow." />
                                    ) : (
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b bg-muted/30 text-left text-xs text-muted-foreground">
                                                    <th className="px-5 py-3 font-medium">
                                                        Invoice
                                                    </th>
                                                    <th className="px-5 py-3 font-medium">
                                                        Passenger
                                                    </th>
                                                    <th className="px-5 py-3 font-medium">
                                                        Route / Service
                                                    </th>
                                                    <th className="px-5 py-3 font-medium">
                                                        Ticket
                                                    </th>
                                                    <th className="px-5 py-3 font-medium">
                                                        Client
                                                    </th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {props.tomorrow.transfers
                                                    .slice(0, maxTransfers)
                                                    .map((row, index) => (
                                                        <tr
                                                            key={`${row.invoice}-${row.passenger}-${index}`}
                                                            className="border-b last:border-0"
                                                        >
                                                            <td className="px-5 py-4 font-medium">
                                                                {row.invoice
                                                                    ? `#${row.invoice}`
                                                                    : '—'}
                                                            </td>
                                                            <td className="max-w-[180px] px-5 py-4">
                                                                <div className="truncate font-medium">
                                                                    {row.passenger ||
                                                                        '—'}
                                                                </div>
                                                            </td>
                                                            <td className="max-w-[260px] px-5 py-4">
                                                                <div className="truncate">
                                                                    {row.route ||
                                                                        '—'}
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-4 text-muted-foreground">
                                                                {row.ticket_no ||
                                                                    '—'}
                                                            </td>
                                                            <td className="max-w-[160px] px-5 py-4">
                                                                <div className="truncate">
                                                                    {row.client ||
                                                                        '—'}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>

                                {props.tomorrow.transfersCount >
                                    maxTransfers && (
                                    <div className="border-t px-5 py-3 text-xs text-muted-foreground">
                                        Showing {maxTransfers} of{' '}
                                        {props.tomorrow.transfersCount} transfers.
                                    </div>
                                )}
                            </section>
                        </div>

                        <div className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
                            <section className="overflow-hidden rounded-2xl border bg-background shadow-sm">
                                <SectionTitle
                                    title="Recent Sales"
                                    subtitle="Latest customer transactions"
                                    action={
                                        <Link
                                            href="/invoices"
                                            className="text-sm font-medium underline-offset-4 hover:underline"
                                        >
                                            View all
                                        </Link>
                                    }
                                />

                                <div className="overflow-x-auto">
                                    {props.recentSales.length === 0 ? (
                                        <EmptyTableState message="No sales found." />
                                    ) : (
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b bg-muted/30 text-left text-xs text-muted-foreground">
                                                    <th className="px-5 py-3 font-medium">
                                                        Invoice
                                                    </th>
                                                    <th className="px-5 py-3 font-medium">
                                                        Customer
                                                    </th>
                                                    <th className="px-5 py-3 font-medium">
                                                        Service
                                                    </th>
                                                    <th className="px-5 py-3 text-right font-medium">
                                                        Sales
                                                    </th>
                                                    <th className="px-5 py-3 text-right font-medium">
                                                        Profit
                                                    </th>
                                                    <th className="px-5 py-3 text-right font-medium">
                                                        Date
                                                    </th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {props.recentSales.map(
                                                    (sale, index) => (
                                                        <tr
                                                            key={`${sale.invoice}-${index}`}
                                                            className="border-b last:border-0"
                                                        >
                                                            <td className="px-5 py-4 font-medium">
                                                                {sale.invoice
                                                                    ? `#${sale.invoice}`
                                                                    : '—'}
                                                            </td>
                                                            <td className="max-w-[220px] px-5 py-4">
                                                                <div className="truncate font-medium">
                                                                    {sale.customer ||
                                                                        '—'}
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-4 text-muted-foreground">
                                                                {sale.service ||
                                                                    '—'}
                                                            </td>
                                                            <td className="px-5 py-4 text-right font-semibold">
                                                                {formatMoney(
                                                                    sale.amount,
                                                                    true,
                                                                )}
                                                            </td>
                                                            <td className="px-5 py-4 text-right font-semibold">
                                                                {formatMoney(
                                                                    sale.profit,
                                                                    true,
                                                                )}
                                                            </td>
                                                            <td className="px-5 py-4 text-right text-muted-foreground">
                                                                {sale.date ||
                                                                    '—'}
                                                            </td>
                                                        </tr>
                                                    ),
                                                )}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </section>

                            <section className="rounded-2xl border bg-background shadow-sm">
                                <SectionTitle
                                    title="Operations Snapshot"
                                    subtitle="Current-month activity"
                                />

                                <div className="grid gap-4 p-5 sm:grid-cols-2">
                                    <div className="rounded-xl bg-muted/35 p-4">
                                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                            <Users className="size-4" />
                                            Active Customers
                                        </div>
                                        <p className="mt-2 text-2xl font-bold">
                                            {formatCount(
                                                props.overview.activeCustomers,
                                            )}
                                        </p>
                                        <Link
                                            href="/accounting/balances/customers"
                                            className="mt-2 inline-flex items-center gap-1 text-xs font-medium underline-offset-4 hover:underline"
                                        >
                                            Customer balances
                                            <ChevronRight className="size-3.5" />
                                        </Link>
                                    </div>

                                    <div className="rounded-xl bg-muted/35 p-4">
                                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                            <Building2 className="size-4" />
                                            Active Vendors
                                        </div>
                                        <p className="mt-2 text-2xl font-bold">
                                            {formatCount(
                                                props.overview.activeVendors,
                                            )}
                                        </p>
                                        <Link
                                            href="/accounting/balances/payables"
                                            className="mt-2 inline-flex items-center gap-1 text-xs font-medium underline-offset-4 hover:underline"
                                        >
                                            Vendor balances
                                            <ChevronRight className="size-3.5" />
                                        </Link>
                                    </div>

                                    <div className="rounded-xl bg-muted/35 p-4">
                                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                            <Hotel className="size-4" />
                                            MTD Hotel Bookings
                                        </div>
                                        <p className="mt-2 text-2xl font-bold">
                                            {formatCount(
                                                props.overview.hotelBookings,
                                            )}
                                        </p>
                                        <Link
                                            href="/reports/other"
                                            className="mt-2 inline-flex items-center gap-1 text-xs font-medium underline-offset-4 hover:underline"
                                        >
                                            Operational reports
                                            <ChevronRight className="size-3.5" />
                                        </Link>
                                    </div>

                                    <div className="rounded-xl bg-muted/35 p-4">
                                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                            <Ticket className="size-4" />
                                            MTD Ticket Transactions
                                        </div>
                                        <p className="mt-2 text-2xl font-bold">
                                            {formatCount(
                                                props.overview.ticketTransactions,
                                            )}
                                        </p>
                                        <Link
                                            href="/reports/sales"
                                            className="mt-2 inline-flex items-center gap-1 text-xs font-medium underline-offset-4 hover:underline"
                                        >
                                            Sales reports
                                            <ChevronRight className="size-3.5" />
                                        </Link>
                                    </div>
                                </div>
                            </section>
                        </div>

                        <section className="rounded-2xl border bg-background shadow-sm">
                            <SectionTitle
                                title="Attention Required"
                                subtitle="Live operational checks"
                                action={
                                    <Link
                                        href="/reports/other"
                                        className="text-sm font-medium underline-offset-4 hover:underline"
                                    >
                                        Open reports
                                    </Link>
                                }
                            />

                            <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
                                <Link
                                    href="/reports/other"
                                    className="group rounded-xl border p-4 transition hover:bg-muted/30"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
                                            <Hotel className="size-4" />
                                        </div>
                                        <ChevronRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
                                    </div>
                                    <p className="mt-4 text-xs text-muted-foreground">
                                        Tomorrow Check-ins
                                    </p>
                                    <p className="mt-1 text-2xl font-bold">
                                        {formatCount(
                                            props.tomorrow.checkInsCount,
                                        )}
                                    </p>
                                </Link>

                                <Link
                                    href="/reports/other"
                                    className="group rounded-xl border p-4 transition hover:bg-muted/30"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
                                            <Plane className="size-4" />
                                        </div>
                                        <ChevronRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
                                    </div>
                                    <p className="mt-4 text-xs text-muted-foreground">
                                        Tomorrow Transfers
                                    </p>
                                    <p className="mt-1 text-2xl font-bold">
                                        {formatCount(
                                            props.tomorrow.transfersCount,
                                        )}
                                    </p>
                                </Link>

                                <Link
                                    href="/accounting/receipts/all"
                                    className="group rounded-xl border p-4 transition hover:bg-muted/30"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
                                            <ReceiptText className="size-4" />
                                        </div>
                                        <ChevronRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
                                    </div>
                                    <p className="mt-4 text-xs text-muted-foreground">
                                        Receipts Today
                                    </p>
                                    <p className="mt-1 text-2xl font-bold">
                                        —
                                    </p>
                                </Link>

                                <Link
                                    href="/accounting/payments/today"
                                    className="group rounded-xl border p-4 transition hover:bg-muted/30"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
                                            <Wallet className="size-4" />
                                        </div>
                                        <ChevronRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
                                    </div>
                                    <p className="mt-4 text-xs text-muted-foreground">
                                        Payments Today
                                    </p>
                                    <p className="mt-1 text-2xl font-bold">
                                        —
                                    </p>
                                </Link>
                            </div>
                        </section>

                        <div className="pb-2 text-xs text-muted-foreground">
                            Dashboard data is read from the ERP journal and
                            account tables at page load.
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
