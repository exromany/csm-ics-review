import { useCreate, useNavigation } from "@refinedev/core";
import { useState } from "react";
import { ArrowLeft, UserPlus, AlertCircle, CheckCircle } from "lucide-react";
import type { AdminUserCreateDto } from "../../types/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const AdminUserCreate = () => {
  const { list } = useNavigation();
  const { mutate: createUser, isLoading: isCreating } = useCreate();
  const [formData, setFormData] = useState<AdminUserCreateDto>({
    address: "",
    role: "REVIEWER",
    active: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const isValidEthereumAddress = (address: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

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
      values: formData,
    }, {
      onSuccess: () => {
        setSuccess(true);
        setTimeout(() => {
          list("admin-users");
        }, 2000);
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

  const handleRoleChange = (value: 'VIEWER' | 'REVIEWER' | 'SUPERVISOR') => {
    setFormData(prev => ({ ...prev, role: value }));
  };

  const handleActiveChange = (value: string) => {
    setFormData(prev => ({ ...prev, active: value === "true" }));
  };

  if (success) {
    return (
      <div className="space-y-6">
        <Card className="max-w-md mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-medium mb-2 text-green-700">User Created Successfully</h3>
            <p className="text-green-600 text-center mb-4">
              The new admin user has been added to the system.
            </p>
            <Button
              onClick={() => list("admin-users")}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              View Users List
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          onClick={() => list("admin-users")}
          disabled={isCreating}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Users
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New User</h1>
          <p className="text-muted-foreground">
            Create a new admin user account
          </p>
        </div>
      </div>

      {/* Create User Form */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserPlus className="w-5 h-5 mr-2" />
            User Information
          </CardTitle>
          <CardDescription>
            Enter the details for the new admin user account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Address Field */}
            <div className="space-y-2">
              <label htmlFor="address" className="text-sm font-medium">
                Ethereum Address <span className="text-red-500">*</span>
              </label>
              <Input
                id="address"
                type="text"
                placeholder="0x742d35cc6634c0532925a3b8d39c4c17f03434cc"
                value={formData.address}
                onChange={(e) => handleAddressChange(e.target.value)}
                className={`font-mono ${!isValidEthereumAddress(formData.address) && formData.address ? 'border-red-300 focus:border-red-500' : ''}`}
                disabled={isCreating}
                required
              />
              {formData.address && !isValidEthereumAddress(formData.address) && (
                <p className="text-sm text-red-600">Please enter a valid Ethereum address</p>
              )}
              <p className="text-xs text-muted-foreground">
                The Ethereum wallet address that will be used to sign in
              </p>
            </div>

            {/* Role Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Role <span className="text-red-500">*</span>
              </label>
              <Select value={formData.role} onValueChange={handleRoleChange} disabled={isCreating}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VIEWER">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs text-purple-700 bg-purple-50 border-purple-200">
                        VIEWER
                      </Badge>
                      <span>- Read-only access to ICS forms</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="REVIEWER">
                    <div className="flex items-center space-x-2">
                      <Badge variant="default" className="text-xs text-blue-700 bg-blue-50 border-blue-200">
                        REVIEWER
                      </Badge>
                      <span>- Can review and edit ICS forms</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="SUPERVISOR">
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="text-xs text-emerald-700 bg-emerald-50 border-emerald-200">
                        SUPERVISOR
                      </Badge>
                      <span>- Full access including user management</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <div className="text-xs text-muted-foreground space-y-1">
                <p><strong>VIEWER:</strong> Read-only access to ICS form reviews</p>
                <p><strong>REVIEWER:</strong> Can review and edit forms without issued ICS Proof</p>
                <p><strong>SUPERVISOR:</strong> Read-only ICS forms access + user management</p>
              </div>
            </div>

            {/* Active Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={formData.active.toString()} onValueChange={handleActiveChange} disabled={isCreating}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">
                    <div className="flex items-center space-x-2">
                      <Badge variant="default" className="text-xs">Active</Badge>
                      <span>- User can sign in and access the system</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="false">
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="text-xs">Inactive</Badge>
                      <span>- User cannot sign in</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Inactive users cannot sign in to the system
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
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
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {isCreating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating User...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create User
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};