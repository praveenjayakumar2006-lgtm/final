
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function FeedbackSuccessPage() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <Card className="max-w-sm w-full text-center p-4">
        <CardHeader>
          <div className="flex justify-center">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
          </div>
          <CardTitle className="mt-4 text-xl">Thank You!</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm mb-6">
            Your feedback has been submitted successfully. We appreciate you taking the time to help us improve.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/home">
              <Button size="sm">Home</Button>
            </Link>
            <Link href="/reservations">
              <Button variant="outline" size="sm">View My Bookings</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
