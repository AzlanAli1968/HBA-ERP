import { Head, Link, router } from '@inertiajs/react';
import { Check, KeyRound, Pencil, Plus, ShieldCheck, Trash2, Users, X } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';

type Permission = { id: number; name: string };
type Role = { id: number; name: string; description: string; permission_ids: number[] };

type Props = {
    roles: Role[];
    permissions: Permission[];
};

type RoleForm = { name: string; description: string; permission_ids: number[] };
const emptyForm: RoleForm = { name: '', description: '', permission_ids: [] };

export default function Index({ roles, permissions }: Props) {
    const [selectedId, setSelectedId] = useState<number | null>(roles[0]?.id ?? null);
    const [creating, setCreating] = useState(roles.length === 0);
    const [form, setForm] = useState<RoleForm>(() => {
        const first = roles[0];
        return first ? { name: first.name, description: first.description, permission_ids: first.permission_ids } : emptyForm;
    });
    const [busy, setBusy] = useState(false);

    const groupedPermissions = useMemo(() => {
        const groups: Record<string, Permission[]> = {};
        for (const permission of permissions) {
            const group = permission.name.includes('.') ? permission.name.split('.')[0] : 'General';
            groups[group] ??= [];
            groups[group].push(permission);
        }
        return groups;
    }, [permissions]);

    function createRole(): void {
        setCreating(true);
        setSelectedId(null);
        setForm(emptyForm);
    }

    function editRole(role: Role): void {
        setCreating(false);
        setSelectedId(role.id);
        setForm({ name: role.name, description: role.description, permission_ids: role.permission_ids });
    }

    function togglePermission(permissionId: number): void {
        setForm((current) => ({
            ...current,
            permission_ids: current.permission_ids.includes(permissionId)
                ? current.permission_ids.filter((id) => id !== permissionId)
                : [...current.permission_ids, permissionId],
        }));
    }

    function submit(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        setBusy(true);
        const options = {
            preserveScroll: true,
            onFinish: () => setBusy(false),
            onSuccess: () => setCreating(false),
        };
        if (creating || selectedId === null) {
            router.post('/admin/roles', form, options);
        } else {
            router.put(`/admin/roles/${selectedId}`, form, options);
        }
    }

    function removeRole(role: Role): void {
        if (!window.confirm(`Delete role "${role.name}"? Users will lose this role assignment.`)) return;
        router.delete(`/admin/roles/${role.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                if (selectedId === role.id) {
                    setSelectedId(roles.find((item) => item.id !== role.id)?.id ?? null);
                }
            },
        });
    }

    return (
        <>
            <Head title="Administration - Roles & Permissions" />
            <div className="min-h-screen space-y-5 p-4 md:p-6">
                <div className="rounded-2xl border bg-card p-5 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <div className="text-sm text-muted-foreground">Administration</div>
                            <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold tracking-tight"><ShieldCheck className="h-6 w-6" /> Roles & Permissions</h1>
                            <p className="mt-1 text-sm text-muted-foreground">Create roles and control which permissions each role receives.</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Link href="/admin/users" className="inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-medium hover:bg-muted"><Users className="h-4 w-4" /> Users</Link>
                            <button type="button" onClick={createRole} className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"><Plus className="h-4 w-4" /> New Role</button>
                        </div>
                    </div>
                </div>

                <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
                    <div className="rounded-2xl border bg-card shadow-sm">
                        <div className="border-b p-4">
                            <div className="text-sm font-medium">Roles</div>
                            <div className="mt-1 text-xs text-muted-foreground">{roles.length} configured</div>
                        </div>
                        <div className="space-y-1 p-2">
                            {roles.length === 0 ? (
                                <div className="p-6 text-center text-sm text-muted-foreground">No roles yet.</div>
                            ) : roles.map((role) => (
                                <button key={role.id} type="button" onClick={() => editRole(role)} className={`w-full rounded-xl p-3 text-left transition ${!creating && selectedId === role.id ? 'bg-muted' : 'hover:bg-muted/60'}`}>
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="font-medium">{role.name}</div>
                                        <span className="rounded-full border px-2 py-0.5 text-xs">{role.permission_ids.length}</span>
                                    </div>
                                    {role.description && <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{role.description}</div>}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-2xl border bg-card shadow-sm">
                        <div className="flex items-start justify-between border-b p-5">
                            <div>
                                <h2 className="text-lg font-semibold">{creating ? 'Create Role' : `Edit Role #${selectedId}`}</h2>
                                <p className="mt-1 text-sm text-muted-foreground">Permissions are assigned through the existing role-permission tables.</p>
                            </div>
                            {!creating && <button type="button" onClick={createRole} className="rounded-lg p-2 hover:bg-muted"><Plus className="h-4 w-4" /></button>}
                        </div>

                        <form onSubmit={submit} className="space-y-5 p-5">
                            <div className="grid gap-4 md:grid-cols-2">
                                <label className="block space-y-2">
                                    <span className="text-sm font-medium">Role Name</span>
                                    <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="e.g. Accounts Manager" />
                                </label>
                                <label className="block space-y-2">
                                    <span className="text-sm font-medium">Description</span>
                                    <input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="What this role is allowed to do" />
                                </label>
                            </div>

                            <div className="rounded-xl border">
                                <div className="flex items-center gap-2 border-b p-4">
                                    <KeyRound className="h-4 w-4" />
                                    <div>
                                        <div className="text-sm font-medium">Permissions</div>
                                        <div className="text-xs text-muted-foreground">Selected: {form.permission_ids.length}</div>
                                    </div>
                                </div>
                                <div className="grid gap-5 p-4 md:grid-cols-2 xl:grid-cols-3">
                                    {Object.keys(groupedPermissions).map((group) => {
                        const items = groupedPermissions[group];
                        return (
                                        <div key={group} className="space-y-2">
                                            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group}</div>
                                            <div className="space-y-1">
                                                {items.map((permission) => {
                                                    const checked = form.permission_ids.includes(permission.id);
                                                    return (
                                                        <label key={permission.id} className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm ${checked ? 'border-primary/40 bg-primary/5' : 'hover:bg-muted/50'}`}>
                                                            <input type="checkbox" checked={checked} onChange={() => togglePermission(permission.id)} className="h-4 w-4 rounded border" />
                                                            <span className="min-w-0 flex-1 break-words">{permission.name}</span>
                                                            {checked && <Check className="h-4 w-4 shrink-0 text-primary" />}
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                        );
                    })}
                                </div>
                                {permissions.length === 0 && <div className="p-6 text-sm text-muted-foreground">The permissions table is currently empty. You can still create roles now and attach permissions later.</div>}
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-3">
                                {!creating && selectedId !== null ? (
                                    <button type="button" onClick={() => {
                                        const role = roles.find((item) => item.id === selectedId);
                                        if (role) removeRole(role);
                                    }} className="inline-flex h-10 items-center gap-2 rounded-lg border border-destructive/30 px-4 text-sm font-medium text-destructive hover:bg-destructive/10">
                                        <Trash2 className="h-4 w-4" /> Delete Role
                                    </button>
                                ) : <span />}
                                <button type="submit" disabled={busy} className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground disabled:opacity-60">
                                    {busy ? 'Saving...' : creating ? 'Create Role' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
