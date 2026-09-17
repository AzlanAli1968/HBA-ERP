import { Head, Link, router } from '@inertiajs/react';
import { Pencil, Plus, Search, ShieldCheck, Trash2, Users, X } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';

type UserRow = {
    id: number;
    name: string;
    email: string;
    username: string;
    active: boolean;
    created_at: string;
    roles: string[];
};

type Role = {
    id: number;
    name: string;
    description: string;
    permission_ids: number[];
};

type Props = {
    users: UserRow[];
    roles: Role[];
    filters: { search: string };
};

type FormState = {
    name: string;
    email: string;
    password: string;
    role_ids: number[];
};

const emptyForm: FormState = { name: '', email: '', password: '', role_ids: [] };

export default function Index({ users, roles, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState<FormState>(emptyForm);
    const [busy, setBusy] = useState(false);

    const visibleUsers = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return users;
        return users.filter((user) =>
            [user.name, user.email, user.username, ...user.roles].some((value) =>
                value.toLowerCase().includes(q),
            ),
        );
    }, [users, search]);

    function startCreate(): void {
        setEditingId(null);
        setForm(emptyForm);
    }

    function startEdit(user: UserRow): void {
        setEditingId(user.id);
        const roleIds = roles
            .filter((role) => user.roles.includes(role.name))
            .map((role) => role.id);
        setForm({ name: user.name, email: user.email, password: '', role_ids: roleIds });
    }

    function toggleRole(roleId: number): void {
        setForm((current) => ({
            ...current,
            role_ids: current.role_ids.includes(roleId)
                ? current.role_ids.filter((id) => id !== roleId)
                : [...current.role_ids, roleId],
        }));
    }

    function submit(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        setBusy(true);
        const options = {
            preserveScroll: true,
            onFinish: () => setBusy(false),
            onSuccess: () => {
                setEditingId(null);
                setForm(emptyForm);
            },
        };

        if (editingId === null) {
            router.post('/admin/users', form, options);
            return;
        }

        router.put(`/admin/users/${editingId}`, form, options);
    }

    function removeUser(user: UserRow): void {
        if (!window.confirm(`Delete user "${user.name}"? This cannot be undone.`)) return;
        router.delete(`/admin/users/${user.id}`, { preserveScroll: true });
    }

    return (
        <>
            <Head title="Administration - Users" />
            <div className="min-h-screen space-y-5 p-4 md:p-6">
                <div className="rounded-2xl border bg-card p-5 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <div className="text-sm text-muted-foreground">Administration</div>
                            <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold tracking-tight">
                                <Users className="h-6 w-6" /> Users
                            </h1>
                            <p className="mt-1 text-sm text-muted-foreground">Manage ERP users and their roles.</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Link href="/admin/roles" className="inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-medium hover:bg-muted">
                                <ShieldCheck className="h-4 w-4" /> Roles & Permissions
                            </Link>
                            <button type="button" onClick={startCreate} className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground">
                                <Plus className="h-4 w-4" /> New User
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
                    <div className="rounded-2xl border bg-card shadow-sm">
                        <div className="flex items-center gap-3 border-b p-4">
                            <div className="relative min-w-0 flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Search name, email or role..."
                                    className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                                />
                            </div>
                            <div className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                                {visibleUsers.length} users
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b bg-muted/40 text-left">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">User</th>
                                        <th className="px-4 py-3 font-medium">Email</th>
                                        <th className="px-4 py-3 font-medium">Roles</th>
                                        <th className="px-4 py-3 font-medium">Status</th>
                                        <th className="px-4 py-3 text-right font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visibleUsers.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-14 text-center text-muted-foreground">
                                                No users found.
                                            </td>
                                        </tr>
                                    ) : (
                                        visibleUsers.map((user) => (
                                            <tr key={user.id} className="border-b last:border-b-0 hover:bg-muted/20">
                                                <td className="px-4 py-3">
                                                    <div className="font-medium">{user.name}</div>
                                                    <div className="text-xs text-muted-foreground">#{user.id}{user.username ? ` · ${user.username}` : ''}</div>
                                                </td>
                                                <td className="px-4 py-3">{user.email}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-wrap gap-1">
                                                        {user.roles.length ? user.roles.map((role) => (
                                                            <span key={role} className="rounded-full border px-2 py-1 text-xs">{role}</span>
                                                        )) : <span className="text-muted-foreground">No role</span>}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${user.active ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-red-500/10 text-red-700 dark:text-red-400'}`}>
                                                        {user.active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex justify-end gap-1">
                                                        <button type="button" onClick={() => startEdit(user)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted" title="Edit">
                                                            <Pencil className="h-4 w-4" />
                                                        </button>
                                                        <button type="button" onClick={() => removeUser(user)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-destructive hover:bg-destructive/10" title="Delete">
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="rounded-2xl border bg-card shadow-sm">
                        <div className="flex items-start justify-between border-b p-5">
                            <div>
                                <h2 className="text-lg font-semibold">{editingId === null ? 'Create User' : `Edit User #${editingId}`}</h2>
                                <p className="mt-1 text-sm text-muted-foreground">Set login details and assign roles.</p>
                            </div>
                            {editingId !== null && (
                                <button type="button" onClick={startCreate} className="rounded-lg p-2 hover:bg-muted"><X className="h-4 w-4" /></button>
                            )}
                        </div>

                        <form onSubmit={submit} className="space-y-5 p-5">
                            <label className="block space-y-2">
                                <span className="text-sm font-medium">Name</span>
                                <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
                            </label>

                            <label className="block space-y-2">
                                <span className="text-sm font-medium">Email</span>
                                <input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
                            </label>

                            <label className="block space-y-2">
                                <span className="text-sm font-medium">{editingId === null ? 'Password' : 'New Password'}</span>
                                <input required={editingId === null} type="password" minLength={8} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder={editingId === null ? 'Minimum 8 characters' : 'Leave blank to keep current password'} />
                            </label>

                            <div className="space-y-2">
                                <div className="text-sm font-medium">Roles</div>
                                <div className="max-h-56 space-y-2 overflow-y-auto rounded-lg border p-3">
                                    {roles.length === 0 ? (
                                        <div className="text-sm text-muted-foreground">No roles exist yet. Create one from Roles & Permissions.</div>
                                    ) : roles.map((role) => (
                                        <label key={role.id} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/50">
                                            <input type="checkbox" checked={form.role_ids.includes(role.id)} onChange={() => toggleRole(role.id)} className="h-4 w-4 rounded border" />
                                            <span className="text-sm">{role.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <button type="submit" disabled={busy} className="h-11 w-full rounded-lg bg-primary text-sm font-medium text-primary-foreground disabled:opacity-60">
                                {busy ? 'Saving...' : editingId === null ? 'Create User' : 'Save Changes'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
