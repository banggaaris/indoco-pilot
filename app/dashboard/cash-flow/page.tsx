"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
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
    Calendar,
} from "lucide-react";
import { formatCurrency } from "@/lib/financial-utils";
import Link from "next/link";

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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    completed: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    cancelled: "bg-gray-100 text-gray-800",
};

export default function CashFlowPage() {
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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-muted-foreground">Failed to load dashboard data</p>
                    <Button onClick={fetchDashboardData} className="mt-2">
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    const chartData = data.monthlyRevenue.map(item => ({
        month: new Date(item.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue: item.revenue,
        count: item.count,
    }));

    const pieData = data.invoiceStatusBreakdown.map(item => ({
        name: item.status,
        value: item.count,
        total: item.total,
    }));

    return (
        <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <div className="px-4 lg:px-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Cash Flow Dashboard</h1>
                            <p className="text-muted-foreground">
                                Monitor your business finances and payment trends
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Select value={timeRange} onValueChange={setTimeRange}>
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="7">Last 7 days</SelectItem>
                                    <SelectItem value="30">Last 30 days</SelectItem>
                                    <SelectItem value="90">Last 90 days</SelectItem>
                                    <SelectItem value="365">Last year</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button asChild>
                                <Link href="/dashboard/invoicing/new">
                                    <FileText className="mr-2 h-4 w-4" />
                                    New Invoice
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Overview Cards */}
                <div className="px-4 lg:px-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatCurrency(data.overview.totalRevenue)}</div>
                                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                    {data.overview.recentRevenue > 0 && (
                                        <>
                                            <ArrowUpRight className="h-3 w-3 text-green-500" />
                                            <span className="text-green-500">
                                                +{formatCurrency(data.overview.recentRevenue)} recent
                                            </span>
                                        </>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
                                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatCurrency(data.overview.outstandingAmount)}</div>
                                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                    <span>{data.overview.overdueInvoices} overdue</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{data.overview.totalCustomers}</div>
                                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                    <span>{data.overview.paidInvoices} paid invoices</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {data.overview.totalInvoices > 0 
                                        ? Math.round((data.overview.paidInvoices / data.overview.totalInvoices) * 100)
                                        : 0}%
                                </div>
                                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                    <span>of {data.overview.totalInvoices} invoices</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Charts */}
                <div className="px-4 lg:px-6 grid gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Revenue Trend</CardTitle>
                        </CardHeader>
                        <CardContent>
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
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Invoice Status Distribution</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, value }) => `${name}: ${value}`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => [value, 'Invoices']} />
                                </PieChart>
                            </ResponsiveContainer>
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
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Invoice</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Payment Method</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.recentTransactions.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8">
                                                <div className="flex flex-col items-center gap-2">
                                                    <CreditCard className="h-8 w-8 text-muted-foreground" />
                                                    <p className="text-muted-foreground">No transactions yet</p>
                                                    <Link href="/dashboard/invoicing/new">
                                                        <Button variant="outline" size="sm">
                                                            Create first invoice
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        data.recentTransactions.map((transaction) => (
                                            <TableRow key={transaction.id}>
                                                <TableCell className="font-medium">
                                                    {transaction.invoice?.invoiceNumber || 'N/A'}
                                                </TableCell>
                                                <TableCell>
                                                    {transaction.customer?.name || 'N/A'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {transaction.paymentMethod}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {formatCurrency(parseFloat(transaction.amount))}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={statusColors[transaction.status as keyof typeof statusColors]}>
                                                        {transaction.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(transaction.createdAt).toLocaleDateString()}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
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
                                        <Calendar className="h-6 w-6 mb-2" />
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
                                    <Link href="/dashboard/transactions">
                                        <CreditCard className="h-6 w-6 mb-2" />
                                        Transactions
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