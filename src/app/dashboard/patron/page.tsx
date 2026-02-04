"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { HandHeart, Copy } from "lucide-react";

export default function PatronPage() {
    const { toast } = useToast();

    const bkashNumber = process.env.NEXT_PUBLIC_BKASH_NUMBER || '';
    const rocketNumber = process.env.NEXT_PUBLIC_ROCKET_NUMBER || '';

    const handleCopy = (text: string, type: string) => {
        if (!text) {
             toast({
                title: "Error",
                description: `${type} number is not configured.`,
                variant: "destructive",
            });
            return;
        }
        navigator.clipboard.writeText(text).then(() => {
            toast({
                title: "Copied to Clipboard",
                description: `Your ${type} number has been copied.`,
            });
        }).catch(err => {
            console.error('Failed to copy: ', err);
            toast({
                title: "Copy Failed",
                description: "Could not copy the number. Please try again.",
                variant: "destructive",
            });
        });
    };

    return (
        <div className="p-4 md:p-6 lg:p-8 flex justify-center items-center">
            <Card className="w-full max-w-lg">
                <CardHeader className="text-center">
                    <div className="mx-auto bg-primary text-primary-foreground rounded-full p-3 w-fit mb-4">
                        <HandHeart className="w-8 h-8"/>
                    </div>
                    <CardTitle className="text-3xl font-headline">Become a Patron</CardTitle>
                    <CardDescription className="max-w-md mx-auto">
                        Your support keeps our community thriving. To donate, please use one of the payment methods below.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="bKash" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="bKash">bKash</TabsTrigger>
                            <TabsTrigger value="rocket">Rocket</TabsTrigger>
                            <TabsTrigger value="dbbl">DBBL Nexus</TabsTrigger>
                        </TabsList>

                        <TabsContent value="bKash" className="pt-6">
                            <div className="space-y-4">
                                <p className="text-sm text-center text-muted-foreground">Click to copy the bKash 'Send Money' number:</p>
                                <div className="flex items-center justify-center gap-2 p-3 bg-muted rounded-lg">
                                    <p className="text-lg font-bold text-primary tracking-widest">•••••••••••</p>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCopy(bkashNumber, 'bKash')}>
                                        <Copy className="h-4 w-4" />
                                        <span className="sr-only">Copy bKash number</span>
                                    </Button>
                                </div>
                                <div className="space-y-2 text-center pt-4">
                                    <Label htmlFor="amount-bkash" className="font-semibold text-base">Amount Donated (BDT)</Label>
                                    <Input id="amount-bkash" type="number" placeholder="e.g., 500" className="max-w-xs mx-auto text-center text-lg h-12"/>
                                </div>
                                 <div className="space-y-2 text-center">
                                    <Label htmlFor="trx-bkash" className="font-semibold text-base">Transaction ID</Label>
                                    <Input id="trx-bkash" placeholder="Enter your TrxID" className="max-w-xs mx-auto text-center text-lg h-12"/>
                                </div>
                                <div className="text-center pt-4">
                                    <Button size="lg" className="w-full max-w-xs font-headline">
                                        Submit
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="rocket" className="pt-6">
                            <div className="space-y-4">
                                <p className="text-sm text-center text-muted-foreground">Click to copy the Rocket 'Send Money' number:</p>
                                <div className="flex items-center justify-center gap-2 p-3 bg-muted rounded-lg">
                                    <p className="text-lg font-bold text-primary tracking-widest">•••••••••••</p>
                                     <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCopy(rocketNumber, 'Rocket')}>
                                        <Copy className="h-4 w-4" />
                                        <span className="sr-only">Copy Rocket number</span>
                                    </Button>
                                </div>
                                <div className="space-y-2 text-center pt-4">
                                    <Label htmlFor="amount-rocket" className="font-semibold text-base">Amount Donated (BDT)</Label>
                                    <Input id="amount-rocket" type="number" placeholder="e.g., 500" className="max-w-xs mx-auto text-center text-lg h-12"/>
                                </div>
                                 <div className="space-y-2 text-center">
                                    <Label htmlFor="trx-rocket" className="font-semibold text-base">Transaction ID</Label>
                                    <Input id="trx-rocket" placeholder="Enter your TrxID" className="max-w-xs mx-auto text-center text-lg h-12"/>
                                </div>
                                <div className="text-center pt-4">
                                    <Button size="lg" className="w-full max-w-xs font-headline">
                                        Submit
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="dbbl" className="pt-6">
                            <div className="text-center text-muted-foreground p-8">
                                <p>DBBL Nexus payment option coming soon!</p>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
