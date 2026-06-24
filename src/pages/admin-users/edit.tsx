import { useOne, useUpdate, useNavigation, useGetIdentity } from "@refinedev/core";
import { useParams } from "react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Save, AlertCircle, Loader2, Shield } from "lucide-react";
import type { AdminUserDetailDto, AdminUserUpdateDto, AdminIdentity } from "../../types/api";
import {
  Button,
  Panel,
  RoleBadge,
  Input,
  Field,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  EmptyState,
  LoadingState,
  notify,
} from "@/components/ui";

export const AdminUserEdit = () => {
  const { id } = useParams();
  const { list } = useNavigation();
  const { data: identity } = useGetIdentity<AdminIdentity>();
  const { mutate: updateUser, mutation: updateMutation } = useUpdate();
  const isUpdating = updateMutation.isPending;

  const {
    result: user,
    query: { isLoading },
  } = useOne<AdminUserDetailDto>({
    resource: "admin-users",
    id: id as string,
  });

  // Only `name` and `active` are editable — address is the immutable signing
  // key and `role` was dropped from the update DTO, so both stay read-only.
  const [name, setName] = useState("");
  const [active, setActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Hydrate the form once the record loads.
  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setActive(user.active);
    }
  }, [user]);

  const isSelf = user?.id === identity?.id;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!id) return;

    updateUser(
      {
        resource: "admin-users",
        id: Number(id),
        // `name` is optional — omit it entirely rather than sending an empty string.
        values: { name: name.trim() || undefined, active } satisfies AdminUserUpdateDto,
      },
      {
        onSuccess: () => {
          notify.success("User updated successfully");
          list("admin-users");
        },
        onError: (err) => {
          setError(err.message || "Failed to update user. Please try again.");
        },
      }
    );
  };

  // Only supervisors manage users (mirrors the list page guard).
  if (identity && identity.role !== "SUPERVISOR") {
    return (
      <div className="mx-auto max-w-md pt-10">
        <Panel className="p-8">
          <EmptyState
            icon={Shield}
            tone="destructive"
            size="md"
            title="Access restricted"
            description="Only supervisors can manage admin users."
          />
        </Panel>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingState label="Loading user…" />;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md pt-10">
        <Panel className="p-8">
          <EmptyState
            icon={AlertCircle}
            size="md"
            title="User not found"
            description="This admin user does not exist or could not be loaded."
            action={
              <Button variant="outline" size="sm" onClick={() => list("admin-users")}>
                <ArrowLeft className="size-4" />
                Back to users
              </Button>
            }
          />
        </Panel>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => list("admin-users")}
          disabled={isUpdating}
          className="-ml-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to users
        </Button>
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Edit user{" "}
            <span className="font-normal text-muted-foreground tabular-nums">#{user.id}</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Update the display name and status of this admin user.
          </p>
        </div>
      </div>

      {/* Edit User Form */}
      <Panel>
        <form onSubmit={handleSubmit} className="divide-y">
          <div className="space-y-6 p-6">
            {error && (
              <div className="flex items-start gap-2.5 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Address (read-only) */}
            <Field label="Ethereum address">
              <code className="block break-all rounded-md bg-muted px-3 py-2 font-mono text-sm text-muted-foreground">
                {user.address}
              </code>
            </Field>

            {/* Role (read-only) */}
            <Field label="Role">
              <div>
                <RoleBadge role={user.role} />
              </div>
            </Field>

            {/* Name Field */}
            <Field
              label="Display name"
              htmlFor="name"
              description="Optional friendly name shown across the admin panel."
            >
              <Input
                id="name"
                type="text"
                placeholder="Alice"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={255}
                disabled={isUpdating}
              />
            </Field>

            {/* Active Status */}
            <Field
              label="Status"
              htmlFor="active"
              description={
                isSelf
                  ? "You can't change your own status."
                  : "Inactive users cannot sign in to the system."
              }
            >
              <Select
                value={active.toString()}
                onValueChange={(value) => setActive(value === "true")}
                disabled={isUpdating || isSelf}
              >
                <SelectTrigger id="active">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          {/* Footer action row */}
          <div className="flex items-center justify-end gap-3 p-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => list("admin-users")}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  Save changes
                </>
              )}
            </Button>
          </div>
        </form>
      </Panel>
    </div>
  );
};
