
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { getUsers } from '@/app/actions/users';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
  role: z.enum(['user', 'owner'], {
    required_error: 'You need to select a role.',
  }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      role: 'user',
    },
  });

  async function onSubmit(values: LoginFormValues) {
    if (values.role === 'owner') {
      if (values.email === 'owner@gmail.com' && values.password === '123456') {
        localStorage.setItem('role', 'owner');
        router.replace('/owner');
        toast({
          title: 'Owner Login Successful',
          description: 'Welcome back, Owner!',
          duration: 2000,
        });
        return; 
      } else {
         toast({
          variant: 'destructive',
          title: 'Owner Login Failed',
          description: 'Invalid credentials for owner.',
        });
        return; 
      }
    }

    try {
      const appUsers = await getUsers();
      const existingUser = appUsers.find(
        (appUser) => appUser.email === values.email && appUser.password === values.password
      );

      if (existingUser) {
        localStorage.setItem('user', JSON.stringify(existingUser));
        localStorage.setItem('role', 'user');

        toast({
          title: 'Login Successful',
          description: 'Welcome back!',
          duration: 2000,
        });
        router.replace('/home');
      } else {
        toast({
          variant: 'destructive',
          title: 'Login Incorrect',
          description: 'Please try to sign up.',
        });
      }

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'An unexpected error occurred. Please try again.',
      });
    }
  }

  return (
    <Card className="mx-auto max-w-xs w-full">
      <Form {...form}>
      <CardHeader>
        <CardTitle className="text-2xl">Login</CardTitle>
        <CardDescription>
          Enter your information to Login to your account
        </CardDescription>
        <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem className="pt-4 space-y-4">
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex items-center space-x-4"
                  >
                    <FormLabel className="font-bold">Login as:</FormLabel>
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="user" id="user" />
                      </FormControl>
                      <FormLabel htmlFor="user" className="font-normal cursor-pointer text-base">User</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="owner" id="owner"/>
                      </FormControl>
                      <FormLabel htmlFor="owner" className="font-normal cursor-pointer text-base">Owner</FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
      </CardHeader>
      <CardContent>
        
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="grid gap-2">
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="grid gap-2">
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input id="password" type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              Login
            </Button>
          </form>
        
        <div className="mt-4 text-center text-sm">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="underline">
            Sign up
          </Link>
        </div>
      </CardContent>
      </Form>
    </Card>
  );
}
