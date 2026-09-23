import React from 'react';
import { Head, Link } from '@inertiajs/react';

type Quotation = {
    id: number;
    quote_no: string;
    quotation_date: string;
    title: string;
    package_name?: string | null;
    main_guest_name?: string | null;
    adults: number;
    children: number;
    infants: number;
    flight_enabled: boolean;
    package_per_adult: string;
    package_per_child: string;
    package_per_infant: string;
    status: string;
};

type Pagination = {
    data: Quotation[];
    current_page?: number;
    last_page?: number;
    total?: number;
};

export default function Index({
    quotations,
}: {
    quotations: Pagination;
}) {
    return (
        <>
            <Head title="Quotations" />

            <div className="min-h-screen bg-background p-4 text-foreground md:p-6">
                <div className="mx-auto max-w-7xl">

                    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">
                                HBA Travel & Tours
                            </p>

                            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                                Umrah Quotations
                            </h1>

                            <p className="mt-1 text-sm text-muted-foreground">
                                Create, review and print quotation documents.
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <Link
                                href="/quotation-templates"
                                className="rounded-lg border bg-card px-4 py-2 text-sm font-medium hover:bg-muted"
                            >
                                Pricing Templates
                            </Link>

                            <Link
                                href="/quotations/create"
                                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                            >
                                New Quotation
                            </Link>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[920px] text-left text-sm">

                                <thead className="border-b bg-muted/60 text-muted-foreground">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold">
                                            Quote
                                        </th>

                                        <th className="px-4 py-3 font-semibold">
                                            Main Guest
                                        </th>

                                        <th className="px-4 py-3 font-semibold">
                                            Date
                                        </th>

                                        <th className="px-4 py-3 font-semibold">
                                            Package
                                        </th>

                                        <th className="px-4 py-3 font-semibold">
                                            Passengers
                                        </th>

                                        <th className="px-4 py-3 font-semibold">
                                            Per Adult
                                        </th>

                                        <th className="px-4 py-3 font-semibold">
                                            Airfare
                                        </th>

                                        <th className="px-4 py-3 font-semibold">
                                            Status
                                        </th>

                                        <th className="px-4 py-3" />
                                    </tr>
                                </thead>

                                <tbody>
                                    {
                                        quotations.data.length ===
                                            0 ? (
                                            <tr>
                                                <td
                                                    colSpan={
                                                        9
                                                    }
                                                    className="px-4 py-12 text-center text-muted-foreground"
                                                >
                                                    No quotations have been created yet.
                                                </td>
                                            </tr>
                                        ) : (
                                            quotations.data.map(
                                                (
                                                    q,
                                                ) => (
                                                    <tr
                                                        key={
                                                            q.id
                                                        }
                                                        className="border-b last:border-0 hover:bg-muted/30"
                                                    >
                                                        <td className="px-4 py-3 font-semibold">
                                                            {
                                                                q.quote_no
                                                            }
                                                        </td>

                                                        <td className="px-4 py-3">
                                                            {
                                                                q.main_guest_name ||
                                                                '—'
                                                            }
                                                        </td>

                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                            {
                                                                q.quotation_date
                                                            }
                                                        </td>

                                                        <td className="px-4 py-3">
                                                            {
                                                                q.package_name ||
                                                                q.title
                                                            }
                                                        </td>

                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                            A:
                                                            {
                                                                q.adults
                                                            }{' '}
                                                            C:
                                                            {
                                                                q.children
                                                            }{' '}
                                                            I:
                                                            {
                                                                q.infants
                                                            }
                                                        </td>

                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                            PKR{' '}
                                                            {
                                                                q.package_per_adult
                                                            }
                                                        </td>

                                                        <td className="px-4 py-3">
                                                            {
                                                                q.flight_enabled
                                                                    ? 'Included separately'
                                                                    : 'Not added'
                                                            }
                                                        </td>

                                                        <td className="px-4 py-3 capitalize">
                                                            {
                                                                q.status
                                                            }
                                                        </td>

                                                        <td className="px-4 py-3 text-right">
                                                            <Link
                                                                className="font-medium text-primary hover:underline"
                                                                href={`/quotations/${q.id}`}
                                                            >
                                                                Open
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                ),
                                            )
                                        )
                                    }
                                </tbody>

                            </table>
                        </div>
                    </div>

                    {
                        (
                            quotations.current_page ||
                            quotations.total
                        ) && (
                            <div className="mt-4 text-sm text-muted-foreground">
                                {
                                    quotations.total ??
                                    quotations.data.length
                                }{' '}
                                quotation
                                {
                                    (
                                        quotations.total ??
                                        quotations.data.length
                                    ) ===
                                    1
                                        ? ''
                                        : 's'
                                }
                            </div>
                        )
                    }

                </div>
            </div>
        </>
    );
}