
'use client';

import { format } from 'date-fns';
import { Skeleton } from '../ui/skeleton';
import { Badge } from '../ui/badge';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { getViolations, deleteViolation } from '@/app/actions/violations';
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
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';


type Violation = {
    id: string;
    slotNumber: string;
    violationType: string;
    licensePlate: string;
    createdAt: string;
    imageUrl?: string;
};

// Formats license plates like 'TN72FB9999' to 'TN 72 FB 9999'
const formatLicensePlate = (plate: string | null) => {
    if (!plate) return null;
    const cleaned = plate.replace(/\s/g, '').toUpperCase();
    const match = cleaned.match(/^([A-Z]{2})(\d{1,2})([A-Z]{1,2})(\d{1,4})$/);
    if (match) {
        const [_, state, district, series, number] = match;
        return `${state} ${district} ${series} ${number}`;
    }
    return plate;
}

const formatSlotId = (slotId: string | null) => {
    if (!slotId) return null;
    const match = slotId.match(/^([A-Z])(\d+)$/);
    if (match) {
        return `${match[1]} ${match[2]}`;
    }
    return slotId;
}


export function ReportsTable() {
    const [violations, setViolations] = useState<Violation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [violationToDelete, setViolationToDelete] = useState<Violation | null>(null);
    const { toast } = useToast();

    const fetchViolations = async () => {
        try {
            const data = await getViolations();
            setViolations(data);
        } catch (error) {
            console.error("Failed to fetch violations:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchViolations();
    }, []);

    const handleDelete = async () => {
        if (!violationToDelete) return;
        
        const result = await deleteViolation(violationToDelete.id);

        if (result.success) {
            setViolations(prev => prev.filter(v => v.id !== violationToDelete.id));
            toast({
                title: 'Report Deleted',
                description: `The violation report for slot ${violationToDelete.slotNumber} has been deleted.`,
            });
        } else {
             toast({
                variant: 'destructive',
                title: 'Deletion Failed',
                description: 'Could not delete the report. Please try again.',
            });
        }
        setViolationToDelete(null);
    };

    const sortedViolations = violations?.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const renderSkeletons = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
        <Card key={`skel-${i}`}>
            <CardContent className="p-4 space-y-4">
                 <Skeleton className="h-40 w-full rounded-lg" />
                 <div className="space-y-2">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-6 w-24" />
                 </div>
            </CardContent>
            <CardFooter className="p-4 pt-0">
                <Skeleton className="h-4 w-40" />
            </CardFooter>
        </Card>
        ))}
    </div>
    );

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading && renderSkeletons()}
          {!isLoading && sortedViolations?.map((violation) => (
              <Card key={violation.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setViolationToDelete(violation)}>
                  <CardContent className="p-4 space-y-4">
                      {violation.imageUrl && (
                          <div className="overflow-hidden rounded-lg">
                              <Image
                                  src={violation.imageUrl}
                                  alt={`Violation at ${violation.slotNumber}`}
                                  width={400}
                                  height={225}
                                  className="object-cover aspect-video"
                              />
                          </div>
                      )}
                      <div className="space-y-2">
                          <Badge variant={violation.violationType === 'overstaying' ? 'destructive' : 'secondary'}>
                              {violation.violationType.replace('_', ' ')}
                          </Badge>
                          <CardTitle className="text-xl">{formatLicensePlate(violation.licensePlate)}</CardTitle>
                          <p className="text-muted-foreground">
                              Slot: <span className="font-semibold text-foreground">{formatSlotId(violation.slotNumber)}</span>
                          </p>
                      </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                      <p className="text-xs text-muted-foreground">
                        Reported on {violation.createdAt ? format(new Date(violation.createdAt), 'PPP p') : 'N/A'}
                      </p>
                  </CardFooter>
              </Card>
          ))}
          {!isLoading && (!violations || violations.length === 0) && (
              <div className="col-span-full text-center p-8 text-muted-foreground bg-card rounded-lg">
                  No violation reports found.
              </div>
          )}
      </div>

       <AlertDialog open={!!violationToDelete} onOpenChange={(open) => !open && setViolationToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Violation Report?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete the report for slot{' '}
              <span className="font-bold text-foreground">{formatSlotId(violationToDelete?.slotNumber || '')}</span>
              {' '}with license plate{' '}
              <span className="font-bold text-foreground">{formatLicensePlate(violationToDelete?.licensePlate || '')}</span>? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              asChild
            >
              <Button variant="destructive">Delete this Report</Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
