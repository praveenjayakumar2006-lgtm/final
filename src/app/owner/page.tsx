
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense, useTransition } from "react";
import { ReportsTable } from "@/components/owner/reports-table";
import { BookingsTable } from "@/components/owner/bookings-table";
import { Loader2, FileText, MessageSquare, CalendarCheck, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useUser } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { signOut } from "firebase/auth";
import { UsersTable } from "@/components/owner/users-table";
import { Separator } from "@/components/ui/separator";

function OwnerDashboard() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isOwner, setIsOwner] = useState(false);
    const { user, auth } = useUser();
    const { toast } = useToast();
    const [isTransitioning, startTransition] = useTransition();

    const view = searchParams.get('view') || 'home';

    useEffect(() => {
        const role = localStorage.getItem('role');
        if (role !== 'owner') {
            router.replace('/login');
        } else {
            setIsOwner(true);
        }
    }, [router]);

    const handleSignOut = async () => {
        if (!auth) return;
        await signOut(auth);
        localStorage.removeItem('role');
        router.replace('/login');
    }

    const renderHome = () => (
        <Card>
            <CardHeader>
                <div className="text-left">
                    <CardTitle className="text-2xl">Welcome, Owner!</CardTitle>
                    <CardDescription>
                        This is your central dashboard for managing ParkEasy.
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                     <Card className="hover:bg-accent/50 transition-colors">
                        <CardHeader className="pb-4">
                           <div className="flex items-center gap-4">
                             <CalendarCheck className="h-8 w-8 text-green-500" />
                             <CardTitle className="text-xl">Bookings</CardTitle>
                           </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">
                                View all reservations made by users.
                            </p>
                             <Link href="/owner?view=bookings">
                                <Button variant="outline" size="sm">View Bookings</Button>
                            </Link>
                        </CardContent>
                    </Card>
                    <Card className="hover:bg-accent/50 transition-colors">
                        <CardHeader className="pb-4">
                           <div className="flex items-center gap-4">
                             <FileText className="h-8 w-8 text-destructive" />
                             <CardTitle className="text-xl">Reports</CardTitle>
                           </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">
                                Review user-submitted parking violation reports.
                            </p>
                             <Link href="/owner?view=reports">
                                <Button variant="outline" size="sm">View Reports</Button>
                            </Link>
                        </CardContent>
                    </Card>
                     <Card className="hover:bg-accent/50 transition-colors">
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-4">
                                <MessageSquare className="h-8 w-8 text-blue-500" />
                                <CardTitle className="text-xl">Feedback</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                             <p className="text-sm text-muted-foreground mb-4">
                                Read valuable feedback to improve your service.
                            </p>
                             <Link href="/owner/feedback">
                                <Button variant="outline" size="sm">View Feedback</Button>
                             </Link>
                        </CardContent>
                    </Card>
                     <Card className="hover:bg-accent/50 transition-colors">
                        <CardHeader className="pb-4">
                           <div className="flex items-center gap-4">
                             <Users className="h-8 w-8 text-purple-500" />
                             <CardTitle className="text-xl">Manage Users</CardTitle>
                           </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">
                                View and manage registered user accounts.
                            </p>
                             <Link href="/owner/users">
                                <Button variant="outline" size="sm">View Users</Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </CardContent>
        </Card>
    );

    const renderReports = () => (
        <Card className="bg-background">
            <CardHeader className="text-center">
                <div className="inline-flex items-center gap-2 justify-center">
                    <FileText className="h-8 w-8 text-primary" />
                    <CardTitle className="text-3xl">Violation Reports</CardTitle>
                </div>
                <CardDescription>
                    All violation reports submitted by users.
                </CardDescription>
            </CardHeader>
             <Separator className="my-4" />
            <CardContent className="p-4 md:p-6">
                <ReportsTable />
            </CardContent>
        </Card>
    );

     const renderBookings = () => (
        <Card>
            <BookingsTable />
        </Card>
    );
    
    const renderContent = () => {
        if (!isOwner) {
            return (
                 <div className="flex items-center justify-center gap-2 text-muted-foreground p-8">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Loading...</span>
                </div>
            );
        }
        
        switch (view) {
            case 'bookings':
                return renderBookings();
            case 'reports':
                return renderReports();
            case 'home':
            default:
                return renderHome();
        }
    }


    return (
        <div className="flex flex-1 flex-col bg-muted p-4 md:p-6">
            <div className="w-full max-w-7xl mx-auto">
                {renderContent()}
            </div>
        </div>
    );
}

export default function OwnerPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center flex-1"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <OwnerDashboard />
        </Suspense>
    )
}
