
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { saveViolation } from '@/app/actions/violations';
import { User } from '@/lib/types';


function ViolationResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const slotNumber = searchParams.get('slotNumber');
  const violationType = searchParams.get('violationType');
  const licensePlate = searchParams.get('licensePlate');

  const [submissionStatus, setSubmissionStatus] = useState<'pending' | 'confirmed' | 'rejected'>('pending');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const storedImage = sessionStorage.getItem('violationImage');
    if (storedImage) {
      setImageUrl(storedImage);
    }
    const storedUser = localStorage.getItem('user');
    if(storedUser) {
        setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleConfirm = async () => {
    if (!user || !slotNumber || !violationType || !licensePlate) {
       toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Missing required information to submit the report.',
      });
      return;
    }
    
    try {
        await saveViolation({
            slotNumber,
            violationType,
            licensePlate,
            imageUrl: imageUrl || null,
            userId: user.id,
        });
        setSubmissionStatus('confirmed');
    } catch (error) {
      console.error("Error submitting violation: ", error);
      toast({
        variant: 'destructive',
        title: 'Submission Error',
        description: 'There was a problem submitting your report. Please try again.',
      });
    }
  };

  // Formats license plates like 'HR26DQ05551' to 'HR 26 DQ 05551'
  const formatLicensePlate = (plate: string | null) => {
    if (!plate || plate === 'NO_LICENSE_PLATE_DETECTED') return null;
    const cleaned = plate.replace(/\s/g, '').toUpperCase();
    const match = cleaned.match(/^([A-Z]{2})(\d{1,2})([A-Z]{1,2})(\d{1,4})$/);
    if (match) {
        const [_, state, district, series, number] = match;
        return `${state} ${district} ${series} ${number}`;
    }
    return plate;
  }

  const formattedLicensePlate = formatLicensePlate(licensePlate);

  const renderInitialState = () => (
    <>
      <CardHeader className="p-4">
          <CardTitle className="mt-4 text-xl">Confirm Submission</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-6">
        <p className="text-muted-foreground text-sm">
          Please review the details below before submitting the violation report.
        </p>
        <div className="flex flex-col items-center gap-4">
          {imageUrl && (
            <div className="rounded-lg overflow-hidden border">
                <Image
                    src={imageUrl}
                    alt="Violation evidence"
                    width={200}
                    height={150}
                    className="object-cover"
                />
            </div>
          )}
          {formattedLicensePlate && (
            <p className="text-sm text-foreground">
                Reported License Plate: <span className="font-semibold bg-primary/10 text-primary px-2 py-1 rounded-md">{formattedLicensePlate}</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-4 justify-center">
            <Button 
                variant="outline"
                className="border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700"
                onClick={handleConfirm}
            >
                Confirm
            </Button>
            <Button
                variant="destructive"
                className="bg-red-500/10 text-red-600 hover:bg-red-500/20 border border-red-500/20"
                onClick={() => setSubmissionStatus('rejected')}
            >
                Reject
            </Button>
        </div>
      </CardContent>
    </>
  );

  const renderConfirmedState = () => (
    <>
      <CardHeader className="p-4">
        <div className="flex justify-center">
          <CheckCircle2 className="h-12 w-12 text-green-500" />
        </div>
        <CardTitle className="mt-4 text-xl">Report Submitted!</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-6">
        <p className="text-muted-foreground text-sm">
          Your violation report has been submitted successfully. We appreciate you taking the time to help us improve safety.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/home">
            <Button size="sm">Home</Button>
          </Link>
          <Button variant="outline" size="sm" onClick={() => router.replace('/violations')}>Report Another Violation</Button>
        </div>
      </CardContent>
    </>
  );
  
  const renderRejectedState = () => (
     <>
      <CardHeader className="p-4">
        <div className="flex justify-center">
          <AlertCircle className="h-12 w-12 text-red-500" />
        </div>
        <CardTitle className="mt-4 text-xl">Report Cancelled</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-6">
        <p className="text-muted-foreground text-sm">
          The violation report has been cancelled and was not submitted.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/home">
            <Button size="sm">Home</Button>
          </Link>
          <Button variant="outline" size="sm" onClick={() => router.replace('/violations')}>Report Another Violation</Button>
        </div>
      </CardContent>
    </>
  );

  return (
    <div className="w-full flex-1 flex flex-col items-center">
      <div className="w-full max-w-lg">
        <Card className="w-full text-center p-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={submissionStatus}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {submissionStatus === 'pending' && renderInitialState()}
              {submissionStatus === 'confirmed' && renderConfirmedState()}
              {submissionStatus === 'rejected' && renderRejectedState()}
            </motion.div>
          </AnimatePresence>
        </Card>
      </div>
    </div>
  );
}


export default function ViolationResultPage() {
    return (
        <Suspense fallback={<div className="flex flex-1 items-center justify-center">
             <Card className="max-w-lg w-full p-4">
                 <CardHeader className="items-center">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <Skeleton className="h-7 w-40 mt-4" />
                </CardHeader>
                <CardContent className="items-center flex flex-col gap-4">
                    <Skeleton className="h-5 w-full" />
                     <Skeleton className="h-5 w-full" />
                     <Skeleton className="h-32 w-48" />
                    <Skeleton className="h-8 w-3/4" />
                     <div className="flex justify-center gap-4 w-full">
                        <Skeleton className="h-9 w-1/2" />
                        <Skeleton className="h-9 w-1/2" />
                    </div>
                </CardContent>
            </Card>
        </div>}>
            <ViolationResultContent />
        </Suspense>
    );
}
