"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Users,
    FileText,
    AlertCircle,
    ArrowUpRight,
    ArrowDownRight,
    CreditCard,
    Eye,
    Plus,
} from "lucide-react";
import { formatCurrency } from "@/lib/financial-utils";

interface DashboardData {
    overview: {
        totalCustomers: number;
        totalInvoices: number;
        paidInvoices: number;
        overdueInvoices: number;
        totalRevenue: number;
        recentRevenue: number;
        outstandingAmount: number;
    };
    recentTransactions: Array<{
        id: string;
        amount: string;
        status: string;
        paymentMethod: string;
        createdAt: string;
        invoice: {
            invoiceNumber: string;
        } | null;
        customer: {
            name: string;
        } | null;
    }>;
    invoiceStatusBreakdown: Array<{
        status: string;
        count: number;
        total: number;
    }>;
    monthlyRevenue: Array<{
        month: string;
        revenue: number;
        count: number;
    }>;
}

const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    completed: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    cancelled: "bg-gray-100 text-gray-800",
};

export default function Page() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('30');

    useEffect(() => {
        fetchDashboardData();
    }, [timeRange]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/dashboard/summary?days=${timeRange}`);
            if (!response.ok) throw new Error('Failed to fetch dashboard data');
            const dashboardData = await response.json();
            setData(dashboardData);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const chartData = data?.monthlyRevenue.map(item => ({
        month: new Date(item.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue: item.revenue,
        count: item.count,
    })) || [];

    return (
        <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <div className="px-4 lg:px-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Business Dashboard</h1>
                            <p className="text-muted-foreground">
                                Welcome back! Here's an overview of your business finances
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button asChild variant="outline">
                                <Link href="/dashboard/cash-flow">
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Cash Flow
                                </Link>
                            </Button>
                            <Button asChild>
                                <Link href="/dashboard/invoicing/new">
                                    <Plus className="mr-2 h-4 w-4" />
                                    New Invoice
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Financial Overview Cards */}
                <div className="px-4 lg:px-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="text-2xl font-bold">...</div>
                                ) : (
                                    <>
                                        <div className="text-2xl font-bold">
                                            {formatCurrency(data?.overview.totalRevenue || 0)}
                                        </div>
                                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                            {(data?.overview.recentRevenue || 0) > 0 && (
                                                <>
                                                    <ArrowUpRight className="h-3 w-3 text-green-500" />
                                                    <span className="text-green-500">
                                                        +{formatCurrency(data?.overview.recentRevenue || 0)} recent
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
                                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="text-2xl font-bold">...</div>
                                ) : (
                                    <>
                                        <div className="text-2xl font-bold">
                                            {formatCurrency(data?.overview.outstandingAmount || 0)}
                                        </div>
                                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                            <span>{data?.overview.overdueInvoices || 0} overdue</span>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Customers</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="text-2xl font-bold">...</div>
                                ) : (
                                    <>
                                        <div className="text-2xl font-bold">
                                            {data?.overview.totalCustomers || 0}
                                        </div>
                                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                            <span>{data?.overview.paidInvoices || 0} paid invoices</span>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="text-2xl font-bold">...</div>
                                ) : (
                                    <>
                                        <div className="text-2xl font-bold">
                                            {(data?.overview.totalInvoices || 0) > 0 
                                                ? Math.round((data?.overview.paidInvoices || 0) / (data?.overview.totalInvoices || 1) * 100)
                                                : 0}%
                                        </div>
                                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                            <span>of {data?.overview.totalInvoices || 0} invoices</span>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Revenue Chart */}
                <div className="px-4 lg:px-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Revenue Overview</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="h-[300px] flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="month" />
                                        <YAxis tickFormatter={(value) => `Rp${(value / 1000000).toFixed(0)}M`} />
                                        <Tooltip 
                                            formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                                            labelFormatter={(label) => `Month: ${label}`}
                                        />
                                        <Area type="monotone" dataKey="revenue" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Transactions */}
                <div className="px-4 lg:px-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Recent Transactions</CardTitle>
                                <Button variant="outline" size="sm" asChild>
                                    <Link href="/dashboard/transactions">View All</Link>
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                </div>
                            ) : (!data?.recentTransactions || data.recentTransactions.length === 0) ? (
                                <div className="flex flex-col items-center gap-2 py-8">
                                    <CreditCard className="h-8 w-8 text-muted-foreground" />
                                    <p className="text-muted-foreground">No transactions yet</p>
                                    <Link href="/dashboard/invoicing/new">
                                        <Button variant="outline" size="sm">
                                            Create first invoice
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {data.recentTransactions.slice(0, 5).map((transaction) => (
                                        <div key={transaction.id} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                                                    <CreditCard className="h-4 w-4 text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">
                                                        {transaction.invoice?.invoiceNumber || 'N/A'}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {transaction.customer?.name || 'N/A'} • {new Date(transaction.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium">{formatCurrency(parseFloat(transaction.amount))}</p>
                                                <Badge className={statusColors[transaction.status as keyof typeof statusColors]}>
                                                    {transaction.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <div className="px-4 lg:px-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                <Button asChild className="h-20 flex-col">
                                    <Link href="/dashboard/invoicing/new">
                                        <FileText className="h-6 w-6 mb-2" />
                                        New Invoice
                                    </Link>
                                </Button>
                                <Button variant="outline" asChild className="h-20 flex-col">
                                    <Link href="/dashboard/invoicing">
                                        <Eye className="h-6 w-6 mb-2" />
                                        All Invoices
                                    </Link>
                                </Button>
                                <Button variant="outline" asChild className="h-20 flex-col">
                                    <Link href="/dashboard/customers">
                                        <Users className="h-6 w-6 mb-2" />
                                        Customers
                                    </Link>
                                </Button>
                                <Button variant="outline" asChild className="h-20 flex-col">
                                    <Link href="/dashboard/cash-flow">
                                        <TrendingUp className="h-6 w-6 mb-2" />
                                        Cash Flow
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}