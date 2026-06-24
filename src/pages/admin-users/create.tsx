import { useCreate, useNavigation } from "@refinedev/core";
import { useState } from "react";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import type { AdminUserCreateDto } from "../../types/api";
import { cn } from "@/lib/utils";
import {
  Button,
  Panel,
  Input,
  Field,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  notify,
} from "@/components/ui";

export const AdminUserCreate = () => {
  const { list } = useNavigation();
  const { mutate: createUser, mutation: createMutation } = useCreate();
  const isCreating = createMutation.isPending;
  const [formData, setFormData] = useState<AdminUserCreateDto>({
    address: "",
    name: "",
    role: "REVIEWER",
    active: true,
  });
  const [error, setError] = useState<string | null>(null);

  const isValidEthereumAddress = (address: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.address) {
      setError("Address is required");
      return;
    }

    if (!isValidEthereumAddress(formData.address)) {
      setError("Please enter a valid Ethereum address (0x...)");
      return;
    }

    createUser({
      resource: "admin-users",
      // `name` is optional — omit it entirely rather than sending an empty string.
      values: { ...formData, name: formData.name?.trim() || undefined },
    }, {
      onSuccess: () => {
        notify.success("User created successfully");
        list("admin-users");
      },
      onError: (error: any) => {
        if (error?.status === 409) {
          setError("A user with this address already exists");
        } else if (error?.message) {
          setError(error.message);
        } else {
          setError("Failed to create user. Please try again.");
        }
      }
    });
  };

  const handleAddressChange = (value: string) => {
    setFormData(prev => ({ ...prev, address: value }));
    setError(null);
  };

  const handleNameChange = (value: string) => {
    setFormData(prev => ({ ...prev, name: value }));
  };

  const handleRoleChange = (value: 'VIEWER' | 'REVIEWER' | 'SUPERVISOR') => {
    setFormData(prev => ({ ...prev, role: value }));
  };

  const handleActiveChange = (value: string) => {
    setFormData(prev => ({ ...prev, active: value === "true" }));
  };

  const addressInvalid = !!formData.address && !isValidEthereumAddress(formData.address);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => list("admin-users")}
          disabled={isCreating}
          className="-ml-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to users
        </Button>
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Add new user</h1>
          <p className="text-sm text-muted-foreground">
            Create a new admin user account for the CSM ICS system.
          </p>
        </div>
      </div>

      {/* Create User Form */}
      <Panel>
        <form onSubmit={handleSubmit} className="divide-y">
          <div className="space-y-6 p-6">
            {error && (
              <div className="flex items-start gap-2.5 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Address Field */}
            <Field
              label="Ethereum address"
              htmlFor="address"
              required
              error={addressInvalid ? "Please enter a valid Ethereum address." : undefined}
              description="The Ethereum wallet address used to sign in."
            >
              <Input
                id="address"
                type="text"
                placeholder="0x742d35cc6634c0532925a3b8d39c4c17f03434cc"
                value={formData.address}
                onChange={(e) => handleAddressChange(e.target.value)}
                className={cn(
                  "font-mono text-sm placeholder:font-sans",
                  addressInvalid && "border-destructive focus-visible:ring-destructive"
                )}
                disabled={isCreating}
                required
              />
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
                value={formData.name ?? ""}
                onChange={(e) => handleNameChange(e.target.value)}
                maxLength={255}
                disabled={isCreating}
              />
            </Field>

            {/* Role Field */}
            <Field label="Role" htmlFor="role" required>
              <Select value={formData.role} onValueChange={handleRoleChange} disabled={isCreating}>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VIEWER">Viewer</SelectItem>
                  <SelectItem value="REVIEWER">Reviewer</SelectItem>
                  <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                </SelectContent>
              </Select>
              <dl className="space-y-1 text-sm text-muted-foreground">
                <div>
                  <dt className="inline font-medium text-foreground">Viewer</dt>
                  <dd className="inline"> — read-only access to ICS form reviews.</dd>
                </div>
                <div>
                  <dt className="inline font-medium text-foreground">Reviewer</dt>
                  <dd className="inline"> — can review and edit forms without issued ICS Proof.</dd>
                </div>
                <div>
                  <dt className="inline font-medium text-foreground">Supervisor</dt>
                  <dd className="inline"> — read-only ICS forms access + user management.</dd>
                </div>
              </dl>
            </Field>

            {/* Active Status */}
            <Field
              label="Status"
              htmlFor="active"
              description="Inactive users cannot sign in to the system."
            >
              <Select value={formData.active.toString()} onValueChange={handleActiveChange} disabled={isCreating}>
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
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isCreating || !formData.address || !isValidEthereumAddress(formData.address)}
            >
              {isCreating ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Creating…
                </>
              ) : (
                "Create user"
              )}
            </Button>
          </div>
        </form>
      </Panel>
    </div>
  );
};
