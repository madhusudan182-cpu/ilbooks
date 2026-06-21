'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, BarChart2, TrendingUp, DollarSign, UserCheck } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { mockSignUpData, mockTopUsers, mockTopPatrons } from '@/lib/data';
import type { SignUpData, TopUser, TopPatron } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

type Period = 'day' | 'week' | 'month' | 'lifetime';

export default function AnalyticsPage() {
    const [period, setPeriod] = useState<Period>('week');
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);
    
    const totalSignUps = {
        day: 15,
        week: 92,
        month: 275,
        lifetime: 1470,
    };
    
    const onlineUsers = 128;

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
                <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-3xl font-headline">
                        <BarChart2 className="w-8 h-8 text-primary" />
                        Analytics
                    </CardTitle>
                    <CardDescription>
                        An overview of your application's performance and user engagement.
                    </CardDescription>
                </CardHeader>
            </Card>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Sign Ups</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalSignUps[period]}</div>
                        <p className="text-xs text-muted-foreground">
                            {period.charAt(0).toUpperCase() + period.slice(1)}
                        </p>
                        {isClient ? (
                            <Select value={period} onValueChange={(value: Period) => setPeriod(value)}>
                                <SelectTrigger className="text-xs mt-2 h-8">
                                    <SelectValue placeholder="Select period" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="day">Day</SelectItem>
                                    <SelectItem value="week">Week</SelectItem>
                                    <SelectItem value="month">Month</SelectItem>
                                    <SelectItem value="lifetime">Lifetime</SelectItem>
                                </SelectContent>
                            </Select>
                        ) : (
                            <Skeleton className="h-8 w-full mt-2" />
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Users Online</CardTitle>
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{onlineUsers}</div>
                        <p className="text-xs text-muted-foreground">
                            Currently active users
                        </p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Level Progression</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+25%</div>
                        <p className="text-xs text-muted-foreground">
                            users leveled up this week
                        </p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Donations</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">BDT 1,500</div>
                        <p className="text-xs text-muted-foreground">
                            in total donations this month
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6 mt-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Sign Up Trends</CardTitle>
                        <CardDescription>A visual representation of user sign-ups over the selected period.</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                         <ResponsiveContainer width="100%" height={350}>
                            <AreaChart data={mockSignUpData[period]}
                                margin={{
                                    top: 10,
                                    right: 30,
                                    left: 0,
                                    bottom: 0,
                                }}>
                                <defs>
                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--background))',
                                        border: '1px solid hsl(var(--border))'
                                    }}
                                />
                                <Legend />
                                <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={2} name="Sign Ups" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                     <CardHeader>
                        <CardTitle>Top Users</CardTitle>
                        <CardDescription>Users who are progressing the fastest.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead className="text-center">Level</TableHead>
                                    <TableHead className="text-right">Levels Gained</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {mockTopUsers.map(user => (
                                     <TableRow key={user.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9">
                                                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                                                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <Link href={`/dashboard/user/${user.id}`} className="font-medium hover:underline">{user.name}</Link>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center font-mono">{user.level.toFixed(1)}</TableCell>
                                        <TableCell className="text-right font-bold text-primary">+{user.progress}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                
                 <Card>
                     <CardHeader>
                        <CardTitle>Top Patrons</CardTitle>
                        <CardDescription>Users who have donated the most frequently or generously.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead className="text-center">Donations</TableHead>
                                    <TableHead className="text-right">Total Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {mockTopPatrons.map(patron => (
                                     <TableRow key={patron.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9">
                                                    <AvatarImage src={patron.avatarUrl} alt={patron.name} />
                                                    <AvatarFallback>{patron.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <Link href={`/dashboard/user/${patron.id}`} className="font-medium hover:underline">{patron.name}</Link>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">{patron.donationCount}</TableCell>
                                        <TableCell className="text-right font-medium">BDT {patron.totalDonation.toLocaleString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
