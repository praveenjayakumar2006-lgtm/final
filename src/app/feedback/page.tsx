
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Card,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { saveFeedback } from '@/app/feedback/actions';
import { User } from '@/lib/types';


const feedbackSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Please enter a valid email address.'),
  rating: z.number().min(1, 'Please select a rating.'),
  feedback: z.string().min(10, 'Feedback must be at least 10 characters.'),
});

type FeedbackFormValues = z.infer<typeof feedbackSchema>;

export default function FeedbackPage() {
  const router = useRouter();
  const [hoverRating, setHoverRating] = useState(0);
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);

  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      name: '',
      email: '',
      rating: 0,
      feedback: '',
    },
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        form.reset({
            name: parsedUser.username,
            email: parsedUser.email,
            rating: 0,
            feedback: '',
        });
    }
  }, [form]);

  async function onSubmit(values: FeedbackFormValues) {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to submit feedback.',
      });
      return;
    }
    
    try {
      await saveFeedback({
        ...values,
        name: user.username,
        email: user.email,
      });
      router.push('/feedback/success');

    } catch (error) {
      console.error('Error submitting feedback: ', error);
      toast({
        variant: 'destructive',
        title: 'Submission Error',
        description: 'There was a problem submitting your feedback. Please try again.',
      });
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto flex-1 flex flex-col justify-center py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-semibold">Submit Feedback</h1>
        <p className="text-muted-foreground">We'd love to hear what you think.</p>
      </div>
      <Card>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} readOnly className="cursor-not-allowed" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="you@gmail.com"
                          {...field}
                          readOnly
                          className="cursor-not-allowed"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rating</FormLabel>
                    <FormControl>
                      <div
                        className="flex gap-1"
                        onMouseLeave={() => setHoverRating(0)}
                      >
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={cn(
                              'h-8 w-8 cursor-pointer transition-colors',
                              (hoverRating || field.value) >= star
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-300'
                            )}
                            onMouseEnter={() => setHoverRating(star)}
                            onClick={() => field.onChange(star)}
                          />
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="feedback"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Feedback</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us about your experience..."
                        {...field}
                        rows={5}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
