
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useEffect, useState, useMemo } from 'react';
import type { User } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Mail, Phone, User as UserIcon } from 'lucide-react';
import { deleteUser, getUsers } from '@/app/actions/users';
import { Separator } from '../ui/separator';
import { Avatar, AvatarFallback } from '../ui/avatar';


function DetailItem({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: React.ReactNode }) {
    return (
        <div className="flex items-start gap-2.5">
            <Icon className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="flex-1">
                <div className="text-xs text-muted-foreground">{label}</div>
                <div className="font-medium text-sm">{value}</div>
            </div>
        </div>
    )
}

export function UsersTable() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        async function fetchUsers() {
            try {
                const fetchedUsers = await getUsers();
                setUsers(fetchedUsers);
            } catch (error) {
                console.error("Failed to fetch users:", error);
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Could not load user data.',
                });
            } finally {
                setIsLoading(false);
            }
        }
        fetchUsers();
    }, [toast]);
    
    const handleDeleteClick = (e: React.MouseEvent, user: User) => {
        e.stopPropagation();
        setUserToDelete(user);
    };

    const confirmDelete = async () => {
        if (!userToDelete) return;

        const result = await deleteUser(userToDelete.id);
        if (result.success) {
            setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
            toast({
                title: 'User Deleted',
                description: `${userToDelete.username}'s account has been deleted.`,
            });
        } else {
            toast({
                variant: 'destructive',
                title: 'Deletion Failed',
                description: 'Could not delete the user. Please try again.',
            });
        }
        setUserToDelete(null);
    };

    const sortedUsers = useMemo(() => 
        [...users].sort((a, b) => a.username.localeCompare(b.username)),
    [users]);

    const renderSkeletons = () => (
        Array.from({ length: 3 }).map((_, i) => (
             <Card key={`skel-${i}`}>
                <CardHeader className="flex-row items-center gap-4 space-y-0 pb-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-32" />
                    </div>
                     <Skeleton className="h-9 w-24 ml-auto" />
                </CardHeader>
                <Separator />
                <CardContent className="space-y-3 pt-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                </CardContent>
            </Card>
        ))
    );

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {isLoading ? (
                    renderSkeletons()
                 ) : sortedUsers.length > 0 ? (
                    sortedUsers.map((user) => (
                        <Card key={user.id} className="flex flex-col">
                            <CardHeader className="flex-row items-center gap-4 space-y-0 pb-4">
                                <Avatar className="h-12 w-12 border">
                                    <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <CardTitle className="text-base">{user.username}</CardTitle>
                                </div>
                                <Button
                                    variant="destructive"
                                    className="w-auto ml-auto px-2 py-1 h-auto text-sm"
                                    onClick={(e) => handleDeleteClick(e, user)}
                                >
                                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                                    Delete
                                </Button>
                            </CardHeader>
                            <Separator />
                            <CardContent className="space-y-3 flex-1 pt-4">
                               <DetailItem icon={Mail} label="Email" value={user.email} />
                               <DetailItem icon={Phone} label="Phone" value={user.phone || 'N/A'} />
                            </CardContent>
                        </Card>
                    ))
                ) : (
                     <div className="col-span-full text-center p-8 text-muted-foreground bg-card rounded-lg">
                        No registered users found.
                    </div>
                )}
            </div>

             <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
                <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete User Account?</AlertDialogTitle>
                    <AlertDialogDescription>
                    Are you sure you want to permanently delete the account for{' '}
                    <span className="font-bold text-foreground">{userToDelete?.username}</span>? 
                    This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={confirmDelete}
                        asChild
                    >
                    <Button variant="destructive">Delete Account</Button>
                    </AlertDialogAction>
                </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
