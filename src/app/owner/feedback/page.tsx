
'use client';

import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Star, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { getFeedback, deleteFeedback } from "@/app/feedback/actions";
import { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";


type Feedback = {
  id: string;
  name: string;
  email: string;
  rating: number;
  feedback: string;
  createdAt: string;
};

function FeedbackList() {
    const [feedbackData, setFeedbackData] = useState<Feedback[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [feedbackToDelete, setFeedbackToDelete] = useState<Feedback | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        const fetchFeedback = async () => {
            setIsLoading(true);
            try {
                const data = await getFeedback();
                setFeedbackData(data);
            } catch (err) {
                console.error(err);
                setError('Could not load feedback data.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchFeedback();
    }, []);

    const handleDelete = async () => {
        if (!feedbackToDelete) return;
        
        const result = await deleteFeedback(feedbackToDelete.id);

        if (result.success) {
            setFeedbackData(prev => prev.filter(f => f.id !== feedbackToDelete.id));
            toast({
                title: 'Feedback Deleted',
                description: `The feedback from ${feedbackToDelete.name} has been deleted.`,
            });
        } else {
             toast({
                variant: 'destructive',
                title: 'Deletion Failed',
                description: 'Could not delete the feedback. Please try again.',
            });
        }
        setFeedbackToDelete(null);
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="flex-row items-start gap-4 space-y-0">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-48" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4 mt-2" />
                        </CardContent>
                        <CardFooter>
                            <Skeleton className="h-3 w-40" />
                        </CardFooter>
                    </Card>
                ))}
            </div>
        )
    }

    if (error) {
        return (
             <Card>
                <CardContent className="pt-6">
                    <p className="text-center text-destructive">
                        {error}
                    </p>
                </CardContent>
            </Card>
        )
    }
    
    const sortedFeedback = [...feedbackData].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return (
        <>
            {sortedFeedback.length > 0 ? (
                <div className="space-y-4">
                    {sortedFeedback.map((feedback) => (
                        <Card key={feedback.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFeedbackToDelete(feedback)}>
                            <CardHeader className="flex-row items-start gap-4 space-y-0">
                                <Avatar className="h-12 w-12 border">
                                    <AvatarFallback>{feedback.name.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <p className="font-semibold">{feedback.name}</p>
                                        <div className="flex items-center gap-1">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star
                                                    key={star}
                                                    className={cn(
                                                        'h-4 w-4',
                                                        feedback.rating >= star
                                                            ? 'text-yellow-400 fill-yellow-400'
                                                            : 'text-gray-300'
                                                    )}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{feedback.email}</p>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-foreground whitespace-pre-wrap">{feedback.feedback}</p>
                            </CardContent>
                            <CardFooter>
                                <p className="text-xs text-muted-foreground">
                                    Submitted on {feedback.createdAt ? format(new Date(feedback.createdAt), 'PPP p') : 'N/A'}
                                </p>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center p-8 text-muted-foreground">
                            No feedback has been submitted yet.
                        </div>
                    </CardContent>
                </Card>
            )}

            <AlertDialog open={!!feedbackToDelete} onOpenChange={(open) => !open && setFeedbackToDelete(null)}>
                <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Feedback?</AlertDialogTitle>
                    <AlertDialogDescription>
                    Are you sure you want to permanently delete the feedback from{' '}
                    <span className="font-bold text-foreground">{feedbackToDelete?.name}</span>? 
                    This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                    onClick={handleDelete}
                    asChild
                    >
                    <Button variant="destructive">Delete Feedback</Button>
                    </AlertDialogAction>
                </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}


export default function OwnerFeedbackPage() {
    return (
        <div className="flex flex-1 flex-col bg-muted p-4 md:p-6">
            <div className="w-full max-w-7xl mx-auto">
                 <Card>
                    <CardHeader className="text-center">
                        <div className="inline-flex items-center gap-2 justify-center">
                            <MessageSquare className="h-8 w-8 text-primary" />
                            <CardTitle className="text-3xl">User Feedback</CardTitle>
                        </div>
                        <CardDescription>
                            All feedback submitted by users.
                        </CardDescription>
                    </CardHeader>
                    <Separator />
                    <CardContent className="p-4 md:p-6">
                        <FeedbackList />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
