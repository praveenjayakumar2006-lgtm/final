
'use client';

import { Button } from '@/components/ui/button';
import { Car } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex flex-col flex-1">
      <section
        id="home"
        className="flex flex-1 flex-col items-center justify-center text-center bg-background p-4"
      >
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-8">
            <div className="space-y-4">
              <Car className="h-16 w-16 text-primary mx-auto" />
              <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                Welcome to ParkEasy
              </h1>
              <p className="max-w-[600px] text-muted-foreground md:text-xl mx-auto">
                Your one-stop solution for hassle-free parking. Find and reserve
                your perfect spot in seconds.
              </p>
            </div>
            <div className="flex flex-col items-center gap-2 min-[400px]:flex-row justify-center">
              <Link href="/booking">
                <Button size="lg" className="px-10 py-6 text-lg">
                  Book a Slot
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
