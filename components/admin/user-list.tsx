"use client"

import { useState } from "react"
import Link from "next/link"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { approveUser, rejectUser, toggleUserStatus, updateUserRole, softDeleteUser, restoreUser } from "@/app/actions/admin"
import { toast } from "sonner"
import { MoreHorizontal, Check, X, Shield, Pencil, Trash2, Undo2, Ban, PlayCircle } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { EditUserDialog } from "@/components/admin/edit-user-dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

type User = {
    id: string
    email: string
    role: "admin" | "member" | "pending" | "rejected"
    isActive: boolean
    displayName: string | null
    imageUrl: string | null
    profileData: unknown
    createdAt: Date
    lastSignInAt?: any // Timestamp
    lastSignOffAt?: any // Timestamp
    lastActiveAt?: any // Timestamp
    totalTimeSpent?: number // milliseconds
    isOnline?: boolean
    deletedAt?: string | null
}

function formatDuration(ms: number) {
    if (!ms) return "0m";
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
}

export function UserList({ users }: { users: User[] }) {
    const [showDeleted, setShowDeleted] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

    const filteredUsers = users.filter(user => {
        if (showDeleted) return true; // Show all (active + deleted)
        return !user.deletedAt; // Show only non-deleted
    }).sort((a, b) => {
        // Simple sort to keep deleted users at bottom if showing mixed, or standard sort
        if (a.deletedAt && !b.deletedAt) return 1;
        if (!a.deletedAt && b.deletedAt) return -1;
        return 0;
    });

    const handleApprove = async (id: string) => {
        try {
            await approveUser(id)
            toast.success("User approved")
        } catch {
            toast.error("Failed to approve")
        }
    }

    const handleReject = async (id: string) => {
        try {
            await rejectUser(id)
            toast.success("User rejected")
        } catch {
            toast.error("Failed to reject")
        }
    }

    const handleUpdateRole = async (id: string, newRole: 'admin' | 'member') => {
        try {
            await updateUserRole(id, newRole)
            toast.success(`Role updated to ${newRole}`)
        } catch (e: any) {
            toast.error(e.message || "Failed to update role")
        }
    }

    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            await toggleUserStatus(id, !currentStatus)
            toast.success(`User ${!currentStatus ? 'enabled' : 'disabled'}`)
        } catch {
            toast.error("Failed to update status")
        }
    }

    const handleSoftDelete = async (id: string) => {
        try {
            await softDeleteUser(id);
            toast.success("User deleted (recoverable for 60 days)");
            setDeletingUserId(null);
        } catch (e: any) {
            toast.error(e.message || "Failed to delete user");
        }
    }

    const handleRestore = async (id: string) => {
        try {
            await restoreUser(id);
            toast.success("User restored");
        } catch (e: any) {
            toast.error(e.message || "Failed to restore user");
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center px-2">
                <div className="flex items-center space-x-2">
                    <Switch
                        id="show-deleted"
                        checked={showDeleted}
                        onCheckedChange={setShowDeleted}
                    />
                    <Label htmlFor="show-deleted">Show Deleted Users</Label>
                </div>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Last Active</TableHead>
                        <TableHead>Total Time</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredUsers.map((user) => {
                        // Type assertion for profileData since it's jsonb
                        const profile = user.profileData as { firstName?: string, lastName?: string, imageUrl?: string } | null;
                        const lowerName = (user.displayName || "").toLowerCase();
                        const isGeneric = ["family member", "unnamed user", "unknown user", "user", "member"].includes(lowerName);

                        const displayName = (user.displayName && !isGeneric) ? user.displayName : null;
                        const profileName = (profile?.firstName && profile?.lastName) ? `${profile.firstName} ${profile.lastName}`.trim() : null;
                        const emailName = user.email.split('@')[0];

                        const name = displayName || profileName || emailName || "Famio Member";
                        const initials = name.slice(0, 2).toUpperCase();
                        const isDeleted = !!user.deletedAt;

                        return (
                            <TableRow key={user.id} className={!user.isActive || isDeleted ? "opacity-60 bg-muted/20" : ""}>
                                <TableCell className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={user.imageUrl || profile?.imageUrl} />
                                        <AvatarFallback>{initials}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <Link href={`/u/${user.id}`} className={`font-medium hover:underline cursor-pointer ${isDeleted ? "line-through text-muted-foreground" : "text-blue-600 dark:text-blue-400"}`}>
                                            {name}
                                        </Link>
                                        <div className="flex gap-2 items-center">
                                            {user.role === 'admin' && (
                                                <Badge variant="default" className="w-fit text-[10px] h-5 px-1.5 mt-1">
                                                    Admin
                                                </Badge>
                                            )}
                                            {isDeleted && (
                                                <Badge variant="destructive" className="w-fit text-[10px] h-5 px-1.5 mt-1">
                                                    Deleted
                                                </Badge>
                                            )}
                                        </div>
                                        <span className="text-xs text-muted-foreground select-all font-mono opacity-50 hover:opacity-100 mt-1">{user.id}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="text-sm text-gray-500">{user.email}</span>
                                </TableCell>
                                <TableCell>
                                    {!isDeleted ? (
                                        <Badge variant={user.isActive ? 'outline' : 'secondary'}>
                                            {user.isActive ? 'Active' : 'Disabled'}
                                        </Badge>
                                    ) : (
                                        <span className="text-xs text-destructive">Deleted on {new Date(user.deletedAt!).toLocaleDateString()}</span>
                                    )}
                                </TableCell>
                                <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className={user.isOnline ? "text-green-600 font-medium" : "text-muted-foreground"}>
                                            {(() => {
                                                const lastActive = user.lastActiveAt || user.lastSignInAt;
                                                if (user.isOnline) return "Online Now";
                                                if (!lastActive) return "Never";
                                                const date = lastActive.toDate ? lastActive.toDate() : new Date(lastActive);
                                                return date.toLocaleString();
                                            })()}
                                        </span>
                                        {/* Optional: Show last sign off if needed, but last active is key */}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="font-mono text-xs">{formatDuration(user.totalTimeSpent || 0)}</span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <span className="sr-only">Open menu</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>

                                            {/* Approvals */}
                                            {(user.role === 'pending' || user.role === 'rejected') && !isDeleted && (
                                                <DropdownMenuItem onClick={() => handleApprove(user.id)}>
                                                    <Check className="mr-2 h-4 w-4 text-green-600" /> Approve
                                                </DropdownMenuItem>
                                            )}

                                            {/* General Actions */}
                                            {!isDeleted && (
                                                <DropdownMenuItem onClick={() => setEditingUser(user)}>
                                                    <Pencil className="mr-2 h-4 w-4" /> Edit Profile
                                                </DropdownMenuItem>
                                            )}

                                            {/* Role Management */}
                                            {!isDeleted && user.role !== 'admin' && (
                                                <DropdownMenuItem onClick={() => handleUpdateRole(user.id, 'admin')}>
                                                    <Shield className="mr-2 h-4 w-4 text-blue-600" /> Make Admin
                                                </DropdownMenuItem>
                                            )}
                                            {!isDeleted && user.role === 'admin' && (
                                                <DropdownMenuItem onClick={() => handleUpdateRole(user.id, 'member')}>
                                                    <Shield className="mr-2 h-4 w-4 text-gray-600" /> Remove Admin
                                                </DropdownMenuItem>
                                            )}

                                            <DropdownMenuSeparator />

                                            {/* Status Management */}
                                            {!isDeleted && (
                                                <DropdownMenuItem onClick={() => handleToggleStatus(user.id, user.isActive)}>
                                                    {user.isActive ? (
                                                        <>
                                                            <Ban className="mr-2 h-4 w-4 text-orange-600" /> Disable Account
                                                        </>
                                                    ) : (
                                                        <>
                                                            <PlayCircle className="mr-2 h-4 w-4 text-green-600" /> Enable Account
                                                        </>
                                                    )}
                                                </DropdownMenuItem>
                                            )}

                                            {/* Soft Delete / Restore */}
                                            {isDeleted ? (
                                                <DropdownMenuItem onClick={() => handleRestore(user.id)}>
                                                    <Undo2 className="mr-2 h-4 w-4 text-green-600" /> Restore User
                                                </DropdownMenuItem>
                                            ) : (
                                                <DropdownMenuItem onClick={() => setDeletingUserId(user.id)} className="text-red-600">
                                                    <Trash2 className="mr-2 h-4 w-4" /> Delete User
                                                </DropdownMenuItem>
                                            )}

                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>

            {/* Edit Dialog */}
            {editingUser && (
                <EditUserDialog
                    user={editingUser}
                    open={!!editingUser}
                    onOpenChange={(open) => !open && setEditingUser(null)}
                />
            )}

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deletingUserId} onOpenChange={(open) => !open && setDeletingUserId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to delete this user?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action can be reversed within 60 days. The user will be disabled and hidden from the platform.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deletingUserId && handleSoftDelete(deletingUserId)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete User
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
