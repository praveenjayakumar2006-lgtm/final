
'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone } from 'lucide-react';

const faqs = [
  {
    question: 'How do I book a parking spot?',
    answer:
      'To book a parking spot, navigate to the "Booking" page, select your desired date, time, and duration. Then, choose an available spot from the map and confirm your reservation.',
  },
  {
    question: 'How do I cancel a reservation?',
    answer:
      'You can cancel your reservation from the "My Bookings" page. Find the reservation you wish to cancel and click the "Cancel" button. Please note the cancellation policy may apply depending on how close to the reservation time you are.',
  },
  {
    question: 'What happens if I overstay my reservation?',
    answer:
      'Overstaying your reserved time may result in a violation report and additional charges. Please ensure you vacate the spot by the end of your reserved time.',
  },
  {
    question: 'How do I report a parking violation?',
    answer:
      'You can report a violation through the "Report a Violation" page. You will need to provide the slot number, the type of violation, and an image of the vehicle in question.',
  },
];

export default function HelpPage() {
  return (
    <div className="w-full flex-1 flex flex-col items-center">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold">
          Help & Support
        </h1>
        <p className="text-muted-foreground">
          Have questions? We're here to help.
        </p>
      </div>
      
      <div className="w-full max-w-4xl flex flex-col gap-8">
        <Card>
          <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
              <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                  <AccordionItem value={`item-${index}`} key={index}>
                  <AccordionTrigger>{faq.question}</AccordionTrigger>
                  <AccordionContent>{faq.answer}</AccordionContent>
                  </AccordionItem>
              ))}
              </Accordion>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
