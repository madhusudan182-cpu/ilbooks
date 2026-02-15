'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { ArrowLeft, Server, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const mockDeployments = [
    {
        id: 'deploy-final',
        date: new Date().toISOString(),
        status: 'Success',
        commit: 'Latest successful deployment. The live URL is now available.',
        url: 'https://ilbooks-app-prev.web.app'
    }
];

export default function AdminDeploymentsPage() {

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'Success':
                return {
                    badgeClass: 'bg-green-100 text-green-800',
                    icon: <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                };
            case 'Failed':
                return {
                    badgeClass: 'bg-red-100 text-red-800',
                    icon: <XCircle className="mr-2 h-4 w-4 text-red-600" />
                };
            case 'In Progress':
                return {
                    badgeClass: 'bg-yellow-100 text-yellow-800',
                    icon: <Loader2 className="mr-2 h-4 w-4 text-yellow-600 animate-spin" />
                };
            default:
                 return {
                    badgeClass: 'bg-gray-100 text-gray-800',
                    icon: null
                };
        }
    }

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
                        <Server className="w-8 h-8 text-primary" />
                        Deployments
                    </CardTitle>
                    <CardDescription>
                        View the status and history of your application deployments.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Last Update</TableHead>
                                <TableHead className="text-right">Live URL</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mockDeployments.map(deployment => {
                                const statusInfo = getStatusInfo(deployment.status);
                                return (
                                <TableRow key={deployment.id}>
                                    <TableCell className="font-medium">{format(new Date(deployment.date), 'dd MMM yyyy, h:mm a')}</TableCell>
                                    <TableCell>
                                        <Badge className={cn(statusInfo.badgeClass, 'flex items-center w-fit')}>
                                            {statusInfo.icon}
                                            {deployment.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{deployment.commit}</TableCell>
                                    <TableCell className="text-right">
                                        {deployment.url ? (
                                            deployment.url.startsWith('http') ? (
                                                <Button asChild variant="link" size="sm">
                                                    <a href={deployment.url} target="_blank" rel="noopener noreferrer">
                                                        {deployment.url.replace('https://', '')}
                                                    </a>
                                                </Button>
                                            ) : (
                                                <span className="text-muted-foreground">{deployment.url}</span>
                                            )
                                        ) : (
                                            <span className="text-muted-foreground">--</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )})}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
