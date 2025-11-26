
'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRouter, useSearchParams } from 'next/navigation';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Paperclip, X } from 'lucide-react';

const violationSchemaBase = z.object({
  slotNumber: z
    .string()
    .min(1, 'Slot number is required.')
    .regex(
      /^[A-Z]([1-9][0-9]?|100)$/,
      'Slot must be a letter followed by a number from 1-100 (e.g., C5).'
    ),
  violationType: z.enum(['overstaying', 'unauthorized_parking'], {
    required_error: 'You need to select a violation type.',
  }),
  numberPlate: z
    .string()
    .min(1, 'Number plate is required.')
    .regex(/^[A-Z]{2}[0-9]{1,2}[A-Z]{1,2}[0-9]{1,4}$/, 'Invalid number plate format.'),
});

const violationSchemaUpload = violationSchemaBase.extend({
  imageSource: z.literal('upload'),
  image: z.any().refine(val => val, { message: "Image is required." }),
});

const violationSchemaCamera = violationSchemaBase.extend({
  imageSource: z.literal('camera'),
  image: z.any().optional(),
});

const violationSchema = z.discriminatedUnion('imageSource', [
  violationSchemaUpload,
  violationSchemaCamera,
]);

type ViolationFormValues = z.infer<typeof violationSchema>;

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ViolationChecker() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const defaultSlotNumber = searchParams.get('slotNumber') || '';
  const defaultViolationType = searchParams.get('violationType');
  const defaultImageSource = searchParams.get('imageSource');
  const defaultNumberPlate = searchParams.get('numberPlate') || '';

  const violationForm = useForm<ViolationFormValues>({
    resolver: zodResolver(violationSchema),
    defaultValues: {
      slotNumber: defaultSlotNumber,
      violationType: defaultViolationType === 'overstaying' || defaultViolationType === 'unauthorized_parking' ? defaultViolationType : undefined,
      imageSource: defaultImageSource === 'camera' ? 'camera' : 'upload',
      numberPlate: defaultNumberPlate,
      image: null,
    },
  });
  
  const imageSource = violationForm.watch('imageSource');
  const { setValue, clearErrors, trigger } = violationForm;

  useEffect(() => {
    const slot = searchParams.get('slotNumber');
    const type = searchParams.get('violationType');
    const numberPlate = searchParams.get('numberPlate');
    if (slot) setValue('slotNumber', slot);
    if (type === 'overstaying' || type === 'unauthorized_parking') setValue('violationType', type);
    if (numberPlate) setValue('numberPlate', numberPlate);
  }, [searchParams, setValue]);

  useEffect(() => {
    if (imageSource === 'camera') {
      setSelectedFileName(null);
      if(fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [imageSource]);


  const handleSubmit = (values: ViolationFormValues) => {
    const params = new URLSearchParams({
      slotNumber: values.slotNumber,
      violationType: values.violationType!,
      licensePlate: values.numberPlate,
    });

    if (values.imageSource === 'camera') {
      router.push(`/violations/camera?${params.toString()}`);
    } else if (values.imageSource === 'upload' && values.image) {
      router.push(`/violations/result?${params.toString()}`);
    }
  };
  
  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const imageSourceValue = violationForm.getValues('imageSource');
    const imageFile = violationForm.getValues('image');

    if (imageSourceValue === 'upload' && !imageFile) {
        fileInputRef.current?.click();
    } else {
        violationForm.handleSubmit(handleSubmit)();
    }
  };

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFileName(file.name);
      violationForm.setValue('image', file);
      trigger('image'); // Manually trigger validation
      const imageDataUrl = await fileToDataUrl(file);
      sessionStorage.setItem('violationImage', imageDataUrl);
    } else {
        setSelectedFileName(null);
        violationForm.setValue('image', null);
    }
  }

  const handleRemoveImage = () => {
    setSelectedFileName(null);
    violationForm.setValue('image', null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    sessionStorage.removeItem('violationImage');
  };

  return (
    <div className="w-full flex flex-col items-center justify-center max-w-md mx-auto flex-1">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold">Report a Violation</h1>
        <p className="text-base text-muted-foreground mt-2">
          Report a parking violation using our <span className="font-semibold text-primary">AI system</span>.
        </p>
      </div>
      <Card className="w-full">
        <Form {...violationForm}>
          <form onSubmit={violationForm.handleSubmit(handleSubmit)}>
            <CardContent className="space-y-4 pt-6">
              <FormField
                control={violationForm.control}
                name="slotNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slot Number <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., C5" 
                        {...field} 
                        onChange={(e) => {
                            const value = e.target.value;
                            if (value.length > 0) {
                                e.target.value = value.charAt(0).toUpperCase() + value.slice(1);
                            }
                            field.onChange(e);
                            if (e.target.value && violationForm.formState.errors.slotNumber) {
                                violationForm.clearErrors('slotNumber');
                            }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={violationForm.control}
                name="violationType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Violation Type <span className="text-destructive">*</span></FormLabel>
                    <Select 
                        onValueChange={(value) => {
                            field.onChange(value);
                            if (value && violationForm.formState.errors.violationType) {
                                violationForm.clearErrors('violationType');
                            }
                        }}
                        defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a violation type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="overstaying">Overstaying</SelectItem>
                        <SelectItem value="unauthorized_parking">Unauthorized Parking</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={violationForm.control}
                name="numberPlate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number Plate <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter vehicle plate"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e.target.value.toUpperCase().replace(/\s/g, ''));
                          if (e.target.value) {
                            violationForm.clearErrors('numberPlate');
                          }
                        }}
                        className="hover:bg-accent"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={violationForm.control}
                name="imageSource"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Evidence <span className="text-destructive">*</span></FormLabel>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-4 pt-2"
                    >
                      <FormItem className="flex items-center space-x-2">
                        <RadioGroupItem value="upload" id="upload" />
                        <FormLabel htmlFor="upload" className="font-normal cursor-pointer">Upload Image</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2">
                        <RadioGroupItem value="camera" id="camera" />
                        <FormLabel htmlFor="camera" className="font-normal cursor-pointer">Take Photo</FormLabel>
                      </FormItem>
                    </RadioGroup>
                    {selectedFileName && imageSource === 'upload' && (
                        <div className="text-sm text-muted-foreground flex items-center justify-between pt-2">
                            <div className="flex items-center gap-2">
                                <Paperclip className="h-4 w-4" />
                                <span className="truncate">{selectedFileName}</span>
                            </div>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleRemoveImage}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
              
              <div className="pt-2">
                <Button 
                  onClick={handleButtonClick} 
                  className="w-full"
                  type="button" 
                >
                  {imageSource === 'camera' ? 'Proceed to Camera' : (selectedFileName ? 'Submit Report' : 'Select Image from Gallery')}
                </Button>
              </div>
            </CardContent>
          </form>
        </Form>
      </Card>
    </div>
  );
}
