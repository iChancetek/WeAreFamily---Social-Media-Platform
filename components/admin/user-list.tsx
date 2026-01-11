
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
import { approveUser, rejectUser, makeAdmin, toggleUserStatus } from "@/app/actions/admin"
import { toast } from "sonner"
import { MoreHorizontal, Check, X, Shield } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type User = {
    id: string
    email: string
    role: "admin" | "member" | "pending" | "rejected"
    isActive: boolean
    displayName: string | null
    imageUrl: string | null
    profileData: unknown
    createdAt: Date
}

export function UserList({ users }: { users: User[] }) {
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

    const handleMakeAdmin = async (id: string) => {
        try {
            await makeAdmin(id)
            toast.success("User promoted to Admin")
        } catch {
            toast.error("Failed to promote")
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

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {users.map((user) => {
                    // Type assertion for profileData since it's jsonb
                    const profile = user.profileData as { firstName?: string, lastName?: string, imageUrl?: string } | null;
                    const displayName = (user.displayName && user.displayName !== 'Family Member') ? user.displayName : null;
                    const name = displayName || (profile?.firstName ? `${profile.firstName} ${profile.lastName}`.trim() : "Unnamed User");
                    const initials = name.slice(0, 2).toUpperCase();

                    return (
                        <TableRow key={user.id} className={!user.isActive ? "opacity-50" : ""}>
                            <TableCell className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage src={user.imageUrl || profile?.imageUrl} />
                                    <AvatarFallback>{initials}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                    <Link href={`/u/${user.id}`} className="font-medium hover:underline cursor-pointer text-blue-600 dark:text-blue-400">
                                        {name}
                                    </Link>
                                    {user.role === 'admin' && (
                                        <Badge variant="default" className="w-fit text-[10px] h-5 px-1.5 mt-1">
                                            Admin
                                        </Badge>
                                    )}
                                    <span className="text-xs text-muted-foreground select-all font-mono opacity-50 hover:opacity-100 mt-1">{user.id}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <span className="text-sm text-gray-500">{user.email}</span>
                            </TableCell>
                            <TableCell>
                                <Badge variant={user.isActive ? 'outline' : 'destructive'}>
                                    {user.isActive ? 'Active' : 'Disabled'}
                                </Badge>
                            </TableCell>
                            <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
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
                                        {(user.role === 'pending' || user.role === 'rejected') && (
                                            <DropdownMenuItem onClick={() => handleApprove(user.id)}>
                                                <Check className="mr-2 h-4 w-4 text-green-600" /> Approve
                                            </DropdownMenuItem>
                                        )}
                                        {user.role !== 'rejected' && user.role !== 'admin' && (
                                            <DropdownMenuItem onClick={() => handleReject(user.id)}>
                                                <X className="mr-2 h-4 w-4 text-red-600" /> {user.role === 'pending' ? 'Reject' : 'Revoke Access'}
                                            </DropdownMenuItem>
                                        )}
                                        {user.role !== 'admin' && (
                                            <DropdownMenuItem onClick={() => handleMakeAdmin(user.id)}>
                                                <Shield className="mr-2 h-4 w-4 text-blue-600" /> Make Admin
                                            </DropdownMenuItem>
                                        )}
                                        {user.role !== 'admin' && (
                                            <DropdownMenuItem onClick={() => handleToggleStatus(user.id, user.isActive)}>
                                                <X className={`mr-2 h-4 w-4 ${user.isActive ? 'text-red-600' : 'text-green-600'}`} />
                                                {user.isActive ? 'Disable Member' : 'Enable Member'}
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
    )
}
