'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Gift, ArrowLeft, CheckCircle2, PlusCircle, Trash2 } from 'lucide-react';
import { mockPrizeWinners, mockUsers } from '@/lib/data';
import type { PrizeWinner, User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AdminPrizesPage() {
    const [winners, setWinners] = useState<PrizeWinner[]>(mockPrizeWinners);
    const { toast } = useToast();
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [newWinnerUserId, setNewWinnerUserId] = useState<string | null>(null);
    const [newWinnerPrize, setNewWinnerPrize] = useState('');
    const [winnerToRemove, setWinnerToRemove] = useState<string | null>(null);

    const handleMarkAsAwarded = (winnerId: string) => {
        setWinners(prevWinners => 
            prevWinners.map(winner => 
                winner.id === winnerId ? { ...winner, status: 'Awarded', dateAwarded: new Date().toISOString() } : winner
            )
        );
        toast({ title: "Prize status updated to 'Awarded'" });
    };

    const handleAddWinner = () => {
        if (!newWinnerUserId || !newWinnerPrize) {
            toast({ title: "Please select a user and enter a prize.", variant: "destructive" });
            return;
        }
        const user = mockUsers.find(u => u.id === newWinnerUserId);
        if (!user) {
            toast({ title: "Selected user not found.", variant: "destructive" });
            return;
        }

        const newWinner: PrizeWinner = {
            id: `prize-${Date.now()}`,
            userId: user.id,
            userName: user.name,
            userAvatarUrl: user.avatarUrl,
            level: user.level.toString(),
            prize: newWinnerPrize,
            status: 'Pending',
        };

        setWinners(prev => [newWinner, ...prev]);
        toast({ title: "New prize winner added." });
        
        // Reset form and close dialog
        setNewWinnerUserId(null);
        setNewWinnerPrize('');
        setIsAddDialogOpen(false);
    };

    const handleRemoveWinner = (winnerId: string) => {
        setWinners(prev => prev.filter(winner => winner.id !== winnerId));
        toast({ title: "Winner removed.", variant: "destructive" });
        setWinnerToRemove(null);
    };

    return (
        <div className="p-4 md:p-6 lg:p-8">
            <div className="mb-4">
                <Button asChild variant="ghost">
                  <Link href="/dashboard/admin">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Admin Panel
                  </Link>
                </Button>
            </div>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-3 text-3xl font-headline">
                            <Gift className="w-8 h-8 text-primary" />
                            Prizes & Gifts
                        </CardTitle>
                        <CardDescription>
                            Manage and track prize distribution to winning users.
                        </CardDescription>
                    </div>
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add Winner
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Prize Winner</DialogTitle>
                                <DialogDescription>
                                    Select a user and specify the prize they've won.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="user-select">User</Label>
                                    <Select onValueChange={setNewWinnerUserId}>
                                        <SelectTrigger id="user-select">
                                            <SelectValue placeholder="Select a user" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {mockUsers.map(user => (
                                                <SelectItem key={user.id} value={user.id}>
                                                    {user.name} (Level: {user.level})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="prize-input">Prize</Label>
                                    <Input 
                                        id="prize-input" 
                                        placeholder="e.g., BDT 500 Book Coupon"
                                        value={newWinnerPrize}
                                        onChange={(e) => setNewWinnerPrize(e.target.value)}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                                <Button onClick={handleAddWinner}>Add Winner</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    {!winners || winners.length === 0 ? (
                        <p className="text-muted-foreground text-center py-10">No prize winners found.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Prize</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {winners.map(winner => (
                                    <TableRow key={winner.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage src={winner.userAvatarUrl} alt={winner.userName} />
                                                    <AvatarFallback>{winner.userName.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <Link href={`/dashboard/user/${winner.userId}`} className="font-semibold hover:underline">
                                                        {winner.userName}
                                                    </Link>
                                                    <p className="text-sm text-muted-foreground">Level: {winner.level}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{winner.prize}</TableCell>
                                        <TableCell>
                                            <Badge
                                                className={cn(winner.status === 'Awarded' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800')}
                                            >
                                                {winner.status}
                                            </Badge>
                                            {winner.dateAwarded && (
                                                <p className="text-xs text-muted-foreground mt-1">{format(new Date(winner.dateAwarded), 'dd/MM/yyyy')}</p>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end items-center gap-2">
                                            {winner.status === 'Pending' && (
                                                <Button size="sm" onClick={() => handleMarkAsAwarded(winner.id)}>
                                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                                    Mark as Awarded
                                                </Button>
                                            )}
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button size="icon" variant="destructive" onClick={() => setWinnerToRemove(winner.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This action cannot be undone. This will permanently remove the prize entry.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel onClick={() => setWinnerToRemove(null)}>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => winnerToRemove && handleRemoveWinner(winnerToRemove)}>
                                                            Remove
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
