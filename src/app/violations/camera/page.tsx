
'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Loader2, Camera, VideoOff, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function CameraPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const slotNumber = searchParams.get('slotNumber');
  const violationType = searchParams.get('violationType') as 'overstaying' | 'unauthorized_parking' | null;
  const licensePlate = searchParams.get('licensePlate');

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    async function setupCamera() {
      if (capturedImage) {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        return;
      };

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        streamRef.current = stream;
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
        }
        setHasCameraPermission(true);
      } catch (error) {
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings.',
        });
      }
    }

    setupCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [capturedImage, toast]);
  
  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
      }
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };
  
  const handleConfirm = async () => {
    if (!capturedImage || !slotNumber || !violationType || !licensePlate) {
        router.replace('/violations');
        return;
    }
    
    // Store image in session storage to pass to the uploading page
    sessionStorage.setItem('violationImage', capturedImage);

    const queryParams = new URLSearchParams({
        slotNumber,
        violationType,
        licensePlate,
    });
    
    router.replace(`/violations/result?${queryParams.toString()}`);
  }

  const handleBack = () => {
    const params = new URLSearchParams();
    if (slotNumber) params.set('slotNumber', slotNumber);
    if (violationType) params.set('violationType', violationType);
    if (licensePlate) params.set('numberPlate', licensePlate);
    router.replace(`/violations?${params.toString()}`);
  }


  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-white">
        <AnimatePresence>
            {capturedImage ? (
                 <motion.div
                    key="preview"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative w-full h-full flex flex-col"
                >
                    <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent flex justify-start items-center z-20">
                        <Button onClick={handleBack} variant="secondary" className="h-auto p-2 gap-2">
                            <ArrowLeft />
                            <span>Back</span>
                        </Button>
                    </div>
                    <img src={capturedImage} alt="Captured preview" className="w-full h-full object-contain" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent flex justify-around z-20">
                        <Button onClick={handleRetake} variant="outline" size="lg" className="bg-white/10 text-white hover:bg-white/20 border-white/20">Retake</Button>
                        <Button onClick={handleConfirm} size="lg">Confirm & Submit</Button>
                    </div>
                </motion.div>
            ) : (
                <motion.div
                    key="camera"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="relative w-full h-full flex flex-col items-center justify-center"
                >
                    <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent flex justify-start items-center z-20">
                        <Button onClick={handleBack} variant="secondary" className="h-auto p-2 gap-2">
                            <ArrowLeft />
                            <span>Back</span>
                        </Button>
                    </div>
                     <video ref={videoRef} className="absolute top-0 left-0 w-full h-full object-cover" autoPlay muted playsInline />
                    
                    {hasCameraPermission === false && (
                        <div className="absolute z-10 p-4">
                            <Alert variant="destructive" className="bg-destructive/80 border-destructive-foreground text-destructive-foreground">
                                <VideoOff className="h-4 w-4" />
                                <AlertTitle>Camera Access Required</AlertTitle>
                                <AlertDescription>
                                Please allow camera access to use this feature.
                                </AlertDescription>
                            </Alert>
                        </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 p-6 flex justify-center z-20">
                        <Button onClick={handleCapture} disabled={hasCameraPermission !== true} size="lg" className="rounded-full w-20 h-20 border-4 border-white bg-white/30 hover:bg-white/40">
                             <Camera className="h-8 w-8 text-white" />
                        </Button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}

export default function CameraPage() {
    return (
        <Suspense fallback={
            <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-white">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-xl mt-4">Loading Camera...</p>
            </div>
        }>
            <CameraPageContent />
        </Suspense>
    )
}
