
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Globe, FileText, CheckCircle, Clock, Star } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { AppFooter } from '@/components/footer';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const englishProgramData = [
    {
        title: "1. Correct Seating Position",
        content: [{
            points: [
                "Adjust the interior rearview mirror to see the entire rear window.",
                "Imagine the steering wheel is a clock: place your hands at the 9:15 position.",
                "Adjust the headrest until it is level with your ears or eyes.",
                "Remember that the interior mirror is complemented by the exterior mirrors for a wider view.",
                "There should be a fist's distance between your knee and the steering wheel.",
                "Sit all the way back, so your hips touch the back of the seat.",
                "Move the seat forward so your foot can reach the accelerator.",
                "Press your back against the backrest and extend your arms; your wrists should touch the top of the steering wheel."
            ]
        }]
    },
    {
        title: "2. Adjusting Mirrors to Eliminate Blind Spots",
        content: [{
            points: [
                "The rearview mirror allows you to see the area behind the vehicle.",
                "The left mirror should slightly reflect the right edge of the car and the lane on that side.",
                "The right mirror shows the rear of the car and a large part of the adjacent lane.",
                "To eliminate the blind spot, adjust the mirror so that you do not see your own vehicle.",
                "The three mirrors work together: when a vehicle leaves the central mirror, it should immediately appear in the side mirror. A traditional adjustment where the side and central mirrors show the same area indicates they are poorly set."
            ]
        }]
    },
    {
        title: "3. Gear Shifting (Manual and Automatic)",
        content: [
            {
                heading: "Manual Transmission:",
                points: [
                    "1st gear: To start the car or park on a slope.",
                    "2nd gear: To shift at 20 km/h or to reduce speed.",
                    "3rd gear: To shift at 40 km/h.",
                    "4th gear: To shift at 60 km/h.",
                    "5th gear: To shift at 80 km/h.",
                    "Neutral: For parking or stopping at a red light.",
                    "Reverse: To drive the car backward."
                ]
            },
            {
                heading: "Automatic Transmission:",
                points: [
                    "P: Park.",
                    "R: Reverse.",
                    "N: Neutral.",
                    "D: Drive."
                ]
            }
        ]
    },
    {
        title: "4. Braking Distance",
        content: [{
            points: [
                "Braking Distance [C] = Reaction Distance [A] + Stopping Distance [B].",
                "At 50 km/h, reaction distance is 14m, stopping distance is 14m, and total braking distance is 28m.",
                "At 90 km/h, reaction distance is 25m, stopping distance is 45m, and total braking distance is 70m.",
                "At 120 km/h, reaction distance is 33m, stopping distance is 65m, and total braking distance is 98m."
            ]
        }]
    },
    {
        title: "5. How to Parallel Park",
        content: [{
            points: [
                "Find a space where the car fits.",
                "Position yourself as close to car A as possible, and make your car parallel to it. Align the rear of your car with the rear of car A.",
                "Stop and turn the steering wheel completely to the left, do not move the car while doing this.",
                "Turn around and look back, and start reversing towards car B. Do not turn the steering wheel from its fully left position.",
                "Stop reversing when the front right corner of car B is right in the middle of your interior rearview mirror.",
                "While stationary, return the steering wheel to the neutral position.",
                "Continue reversing until your car has literally passed car A.",
                "Stop and turn the steering wheel completely to the right, do not move the car while doing this.",
                "Continue reversing slowly towards car B, do not turn the steering wheel from its fully left position.",
                "When your car is parallel, stop and turn the steering wheel back to the center position."
            ]
        }]
    },
    {
        title: "6. Speed Limits in CDMX",
        content: [{
            points: [
                "Central lanes of controlled access roads: 80 km/h.",
                "Primary roads: 50 km/h.",
                "Secondary roads, including side lanes of controlled access roads: 40 km/h.",
                "In slow traffic zones: 30 km/h.",
                "In school zones, hospital areas, nursing homes, and shelters: 20 km/h.",
                "In parking lots and on pedestrian roads where vehicle access is permitted: 10 km/h."
            ]
        }]
    },
    {
        title: "7. Types of Traffic Signs",
        content: [{
            points: [
                "Warning Signs: Yellow signs that warn of potential hazards.",
                "Regulatory Signs: Red or white signs that enforce laws.",
                "Informational Signs: Green or blue signs that provide guidance."
            ]
        }]
    },
    {
        title: "8. Tips for Driving in the Rain",
        content: [{
            points: [
                "Reduce your speed.",
                "Turn on your lights to increase your visibility.",
                "Increase your following distance from the vehicle in front.",
                "Drive calmly."
            ]
        }]
    },
    {
        title: "9. Tips for Driving in Traffic",
        content: [{
            points: [
                "Stay calm: Relax your arms, shoulders, and body while driving. Listen to calming music.",
                "Maintain 5 km/h: Even on the highway, stay at this speed to allow impatient drivers to pass.",
                "Keep your distance: You should be between 3 and 5 meters away from other vehicles.",
                "Use your mirrors: Make optimal use of your mirrors, identifying any risks or other cars trying to merge into your lane.",
                "Use GPS: If you are in an unfamiliar part of the city, use GPS and stay alert.",
                "Respect traffic lights and signs: Always respect traffic signs and lights, don't get impatient, and avoid a tragedy."
            ]
        }]
    },
    {
        title: "10. 8 Tips for Highway Driving",
        content: [{
            points: [
                "Plan your trip: Check the road conditions with apps like Waze.",
                "Get necessary rest: It is not advisable to drive for more than four hours straight. Relax your muscles continuously, change position, stay hydrated, and avoid extreme fatigue.",
                "Respect distances and speed: Always maintain a safe distance from other cars and respect the signs.",
                "Eat light: Light eating before or during the trip is important.",
                "Always keep your lights on: It is vital to be visible to other vehicles to avoid accidents, so the lights should always be on.",
                "What to do in case of a breakdown: Turn on the emergency lights and park on the shoulder. To get out of the vehicle, you must wear a reflective vest and, if necessary, contact the road's emergency personnel.",
                "Mind the luggage: Take the precaution that the weight of the luggage is distributed correctly and evenly and that no object is left loose.",
                "Pay attention to driving and safety: Avoid using your cell phone or other distractors. Also, always have your seatbelts fastened."
            ]
        }]
    },
    {
        title: "11. 7 Tips for Efficient Driving and Saving Gas",
        content: [{
            points: [
                "Check tire pressure: Driving with lower than correct pressure increases gasoline consumption.",
                "Use the right fuel: Check if the car accepts lower octane gasoline, which will be cheaper. Higher octane does not always provide better performance.",
                "Avoid sudden acceleration and braking: Sudden acceleration strains the engine. It's better to drive smoothly and anticipate possible stops. This can save up to 20% of fuel.",
                "Use the air conditioning correctly: The more you have to cool the car, the more energy and fuel you will use.",
                "Check the weight and roll up the windows: The weight of a heavily loaded vehicle and driving over 80 km/h with the windows down negatively affect fuel consumption.",
                "Turn off the engine during long stops: Cars use between 0.5 and 1 liter of fuel per hour when idle, so it's better to turn off the engine during long stops.",
                "Eco-friendly cars: An option to consider is a more ecological car that pollutes less and consumes less."
            ]
        }]
    },
    {
        title: "12. Dashboard Lights and Indicators",
        content: [{
            points: [
                "The manual provides an exhaustive list of 65 warning lights and indicators. Some examples include:",
                "Front fog lights on",
                "Power steering warning",
                "Brake pad warning",
                "Cruise control on",
                "High beams on",
                "Low tire pressure",
                "Seatbelt not fastened",
                "Parking brake engaged",
                "Battery problem",
                "Parking assist activated",
                "Airbag warning",
                "Engine failure",
                "Low fuel level",
                "Automatic transmission problems",
                "Low oil pressure"
            ]
        }]
    },
    {
        title: "13. Always Remember",
        content: [{
            points: [
                "Respect traffic signs.",
                "Never use your cell phone while driving.",
                "Always anticipate your maneuvers.",
                "Do not exceed the maximum speed limits.",
                "Remember that pedestrians always have the right of way. Respect them.",
                "Always use your seatbelt.",
                "Perform regular maintenance on your vehicle.",
                "Do not drink alcohol if you are going to drive."
            ]
        }]
    },
    {
        title: "14. Paperwork, Verification, and Maintenance",
        content: [
            {
                heading: "Type 'A' License Process (CDMX)",
                points: [
                    "Step 1: Generate your payment form for the rights fee on the CDMX Finance Secretariat's website.",
                    "Step 2: Make the payment at authorized centers and keep the receipt.",
                    "Step 3: Schedule an appointment at a SEMOVI Vehicle Control and Licensing Module.",
                    "Step 4: Attend your appointment with complete documentation: official ID, proof of address, and the payment receipt.",
                    "For official details and to generate your payment, visit: finanzas.cdmx.gob.mx."
                ]
            },
            {
                heading: "Vehicle Verification (CDMX)",
                points: [
                    "Verification is a mandatory program to control polluting emissions.",
                    "It is performed twice a year according to the sticker color and the last digit of the license plate.",
                    "Calendar: Yellow (5-6) Jan-Feb/Jul-Aug; Pink (7-8) Feb-Mar/Aug-Sep; Red (3-4) Mar-Apr/Sep-Oct; Green (1-2) Apr-May/Oct-Nov; Blue (9-0) May-Jun/Nov-Dic.",
                    "It is an essential requirement to be able to circulate in CDMX and the metropolitan area."
                ]
            },
            {
                heading: "Car Insurance",
                points: [
                    "It is mandatory to have at least Liability Insurance to drive in CDMX and on federal highways.",
                    "Comprehensive Coverage: Covers damage to your car, total theft, and damages to third parties (people and property).",
                    "Limited Coverage: Covers total theft and damages to third parties. It does not cover damages to your own vehicle.",
                    "Liability (Basic): Only covers damages you cause to other people or their property.",
                    "Always carry your insurance policy (physical or digital) in the vehicle."
                ]
            },
            {
                heading: "Basic Mechanics and Key Checks",
                points: [
                    "Oil level: Check it monthly with the engine cold. A low level can seriously damage the engine.",
                    "Tire pressure: Check the pressure once a month. The correct pressure (indicated in the manual or on the driver's door) improves safety and saves fuel.",
                    "Brake fluid: It should be checked at every service. A low level may indicate leaks or worn pads.",
                    "Antifreeze/Coolant: Keeps the engine temperature stable. Check the level regularly.",
                    "Lights: Ask someone to help you verify that all lights (high, low, turn signals, brake, reverse) are working correctly.",
                    "Battery: Check that the terminals are free of corrosion (white or greenish powder). Most modern batteries are maintenance-free but last between 3 and 5 years."
                ]
            },
            {
                heading: "Essential Vehicle Functions",
                points: [
                    "Hazard/Emergency Lights: Used to warn other drivers of a danger or if your vehicle is stopped in a risky place.",
                    "Windshield Wipers: Familiarize yourself with the different speeds and the washer fluid function.",
                    "Defroster: The front defroster uses air (hot or cold) directed at the windshield. The rear one is an electric heater in the glass. They are crucial for visibility in rain or cold.",
                    "Parking Brake: Secures the vehicle when parked, especially on slopes. It can be a lever, a pedal, or an electronic button."
                ]
            }
        ]
    }
];

export default function EnglishCoursePage() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-background p-4 sm:p-6 md:p-8">
      <div className="flex flex-col items-center text-center my-8 px-4">
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          <Button asChild variant="outline">
            <a href="/agenda">
              <Globe className="mr-2 h-4 w-4" />
              Agendar clase
            </a>
          </Button>
        </div>
        <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tight text-foreground">
          English Driving Course
        </h1>
        <p className="mt-2 max-w-xl text-lg text-muted-foreground">
          Learn to drive safely and confidently in Mexico City with our comprehensive course taught entirely in English.
        </p>
      </div>

      <div className="container px-4 sm:px-6 md:px-8 pb-8 flex flex-col items-center">
        <div className="w-full max-w-3xl mb-8 flex flex-wrap justify-center gap-2">
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Home
            </Link>
          </Button>
           <Button asChild>
            <Link href="/agenda">
                <CheckCircle className="mr-2 h-4 w-4" />
                Schedule Now
            </Link>
          </Button>
        </div>
        
        <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <Card className="shadow-lg rounded-xl">
                <CardHeader>
                    <CardTitle>Beginner's Course in English</CardTitle>
                    <CardDescription className="text-primary font-semibold text-2xl pt-2">$4800.00 MXN</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">This course is perfect if you have never driven before or want to learn the rules of driving in Mexico. We cover all the essentials to make you a confident driver.</p>
                </CardContent>
            </Card>
            <Card className="shadow-lg rounded-xl">
                <CardHeader>
                    <CardTitle>Available Starting Times</CardTitle>
                    <CardDescription>Select one of these times when scheduling.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-center gap-3"><Clock className="text-primary h-5 w-5" /><span>10:00 AM</span></div>
                    <div className="flex items-center gap-3"><Clock className="text-primary h-5 w-5" /><span>1:00 PM</span></div>
                    <div className="flex items-center gap-3"><Clock className="text-primary h-5 w-5" /><span>4:00 PM</span></div>
                    <div className="flex items-center gap-3"><Clock className="text-primary h-5 w-5" /><span>7:00 PM</span></div>
                </CardContent>
            </Card>
        </div>

        <Alert variant="default" className="w-full max-w-3xl mb-8 bg-primary/10 border-primary/50">
            <Star className="h-5 w-5 text-primary" />
            <AlertTitle className="font-bold text-primary">Trusted by Students Worldwide</AlertTitle>
            <AlertDescription className="text-foreground">
                We have extensive experience teaching students from all over the world. Our patient, certified instructors ensure you feel confident on the road. Check out our 5-star reviews on Google Maps! <Link href="/agenda" className="font-semibold underline">Go to the scheduling page</Link> to book your classes.
            </AlertDescription>
        </Alert>
        
        <Card className="w-full max-w-3xl shadow-lg rounded-xl mb-8">
            <CardHeader>
                <CardTitle>Payment Details</CardTitle>
                <CardDescription>
                You can pay for your course using the following methods.
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 text-sm text-muted-foreground">
                 <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="payment">
                        <AccordionTrigger className="text-lg font-semibold hover:no-underline">View Payment Information</AccordionTrigger>
                        <AccordionContent>
                             <div className="space-y-4 pt-4">
                                <div>
                                    <h3 className="font-semibold text-foreground">Bank Transfer</h3>
                                    <p>Beneficiary: <strong>Eduardo W. Czaplewski (BBVA SME Account)</strong></p>
                                    <p>Account: <strong>048 469 5739</strong></p>
                                    <p>CLABE: <strong>012 180 00484695739 9</strong></p>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground">Cash Deposit</h3>
                                    <p>Available at: <strong>Walmart, Sanborns, OXXO, 7-Eleven</strong></p>
                                    <p>BBVA Debit Card: <strong>4152 3144 0428 8527</strong></p>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground">Credit Card Payments</h3>
                                    <p>We accept credit card payments. Please request a payment link via WhatsApp to receive it by email. Ask about our 3-month interest-free installment plan with BBVA and American Express cards!</p>
                                </div>
                                <p className="font-bold text-primary">Important: When making your payment, please include the student's full name in the reference or concept line.</p>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                 </Accordion>
            </CardContent>
        </Card>

        <Card className="w-full max-w-3xl shadow-lg rounded-xl">
          <CardHeader>
            <CardTitle>Driving Program Guide</CardTitle>
            <CardDescription>
              Explore each section to learn about safe and efficient driving.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <Accordion type="single" collapsible className="w-full">
              {englishProgramData.map((section, index) => (
                <AccordionItem value={`item-${index}`} key={index}>
                  <AccordionTrigger className="text-lg font-semibold">{section.title}</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 text-muted-foreground">
                      {section.content.map((contentBlock, blockIndex) => (
                        <div key={blockIndex}>
                          {(contentBlock as any).heading && (
                            <h4 className="font-semibold text-foreground mb-2">{(contentBlock as any).heading}</h4>
                          )}
                          <ul className="list-disc space-y-2 pl-6">
                            {contentBlock.points.map((item, itemIndex) => (
                              <li key={itemIndex}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        <Card className="w-full max-w-3xl shadow-lg rounded-xl mt-8">
            <CardHeader>
                <CardTitle>Terms & Conditions</CardTitle>
                <CardDescription>
                Effective from July 1, 2024.
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="terms">
                        <AccordionTrigger className="text-lg font-semibold hover:no-underline">View Service Agreement</AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-4 text-muted-foreground text-sm pt-4">
                                <div className="space-y-1">
                                    <h3 className="font-semibold text-foreground">1. Course Reservation</h3>
                                    <p>To book the course, the student must make a minimum down payment of 20% of the total value. The course must be reserved at least 48 hours in advance to secure the slots in the schedule due to space among other courses.</p>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-semibold text-foreground">2. Full Payment</h3>
                                    <p>The total payment must be settled at the end of the first class. If this payment is not made, it will be considered that the student does not wish to continue the course, and the down payment will be forfeited.</p>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-semibold text-foreground">3. Changes to Schedule and Transmission</h3>
                                    <p>The schedule, transmission type, and address previously agreed upon with the School cannot be modified by the student, except in cases of duly justified force majeure. In case of a change without justification, a penalty of $700 MXN will be applied, or the class will be counted as taught.</p>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-semibold text-foreground">4. Additional Agreements with the Instructor</h3>
                                    <p>Autoescuela Americana is not responsible for agreements made between the instructor and the student regarding schedules, meeting points, routes, transfers, etc. The student accepts that only agreements communicated in writing to the instructor and confirmed by the School will be valid.</p>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-semibold text-foreground">5. Conduct During Classes</h3>
                                    <p>It is strictly forbidden to take the class under the influence of alcohol, drugs, or any substance that alters consciousness or reflexes. In case of suspicion, the instructor may suspend the class without the right to a refund.</p>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-semibold text-foreground">6. Home Service</h3>
                                    <p>The home service only applies in the School's coverage areas. Factors such as distance, teaching conditions, and safety of the area will be taken into account. The home service only covers what is described in the confirmation; any other route must be quoted separately. Transfers are not permitted. Classes must start and end at the same location.</p>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-semibold text-foreground">7. Modifications by the School</h3>
                                    <p>Autoescuela Americana may modify schedules due to routes, contingencies, traffic, and road closures, communicating this to the student. These changes do not generate a charge for the student, and the School commits to finding slots to make up for the lost time.</p>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-semibold text-foreground">8. Reporting Anomalies</h3>
                                    <p>The student must immediately report any anomaly with the schedule or the instructor to Autoescuela Americana. Otherwise, Autoescuela Americana is not responsible if notice is not given immediately.</p>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-semibold text-foreground">9. Instructor Assignment</h3>
                                    <p>Autoescuela Americana assigns its instructors according to their zone. The School reserves the right to change the instructor. This does not affect the work plan or the continuity of the classes.</p>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-semibold text-foreground">10. Punctuality</h3>
                                    <p>The instructor can wait a maximum of fifteen (15) minutes for the student; this time will be deducted from the class time. If the student does not show up within this time, the class will be considered as taught.</p>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-semibold text-foreground">11. Cancellation and Refund Policy</h3>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>The student may request a refund of payments only if at least 30 calendar days have passed since the payment date.</li>
                                        <li>To do so, they must fill out a cancellation form, state the reasons, and send it by email.</li>
                                        <li>The request will be evaluated within a maximum period of 10 business days and, if applicable, the corresponding refund will be made, minus the non-refundable down payment.</li>
                                        <li>No refunds will be made if the student has already taken more than 30% of the course or fails to comply with any of the terms established in this document.</li>
                                    </ul>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </CardContent>
        </Card>
      </div>
      
      <AppFooter />
    </main>
  );
}
