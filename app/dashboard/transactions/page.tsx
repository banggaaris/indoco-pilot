"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    Calendar,
    Search,
    Filter,
    Download,
    CreditCard,
    CheckCircle,
    Clock,
    AlertCircle,
    XCircle,
} from "lucide-react";
import { formatCurrency } from "@/lib/financial-utils";

interface Transaction {
    id: string;
    paymentMethod: string;
    amount: string;
    status: 'pending' | 'completed' | 'failed' | 'cancelled';
    fee: string;
    netAmount: string;
    notes: string;
    createdAt: string;
    updatedAt: string;
    paidAt: string;
    expiredAt: string;
    invoice: {
        id: string;
        invoiceNumber: string;
        status: string;
    } | null;
    customer: {
        id: string;
        name: string;
        email: string;
    } | null;
}

interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    completed: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    cancelled: "bg-gray-100 text-gray-800",
};

const statusIcons = {
    pending: Clock,
    completed: CheckCircle,
    failed: XCircle,
    cancelled: XCircle,
};

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState<PaginationInfo>({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
    });
    const [filters, setFilters] = useState({
        search: "",
        status: "",
        paymentMethod: "",
        startDate: "",
        endDate: "",
    });

    useEffect(() => {
        fetchTransactions();
    }, [pagination.page, filters]);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
                ...(filters.search && { search: filters.search }),
                ...(filters.status && { status: filters.status }),
                ...(filters.paymentMethod && { paymentMethod: filters.paymentMethod }),
                ...(filters.startDate && { startDate: filters.startDate }),
                ...(filters.endDate && { endDate: filters.endDate }),
            });

            const response = await fetch(`/api/dashboard/transactions?${params}`);
            if (!response.ok) throw new Error('Failed to fetch transactions');

            const data = await response.json();
            setTransactions(data.data);
            setPagination(data.pagination);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    const exportData = () => {
        // Create CSV content
        const headers = ['Date', 'Invoice', 'Customer', 'Payment Method', 'Amount', 'Fee', 'Net Amount', 'Status'];
        const csvContent = [
            headers.join(','),
            ...transactions.map(transaction => [
                new Date(transaction.createdAt).toLocaleDateString(),
                transaction.invoice?.invoiceNumber || 'N/A',
                transaction.customer?.name || 'N/A',
                transaction.paymentMethod,
                transaction.amount,
                transaction.fee,
                transaction.netAmount,
                transaction.status,
            ].join(','))
        ].join('\n');

        // Create blob and download
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const clearFilters = () => {
        setFilters({
            search: "",
            status: "",
            paymentMethod: "",
            startDate: "",
            endDate: "",
        });
    };

    const isExpired = (transaction: Transaction) => {
        return transaction.expiredAt && 
               new Date() > new Date(transaction.expiredAt) && 
               transaction.status === 'pending';
    };

    return (
        <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <div className="px-4 lg:px-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
                            <p className="text-muted-foreground">
                                Track all your payment transactions and their status
                            </p>
                        </div>
                        <Button variant="outline" onClick={exportData}>
                            <Download className="mr-2 h-4 w-4" />
                            Export CSV
                        </Button>
                    </div>
                </div>

                <div className="px-4 lg:px-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Filters</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search transactions..."
                                        value={filters.search}
                                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                        className="pl-10"
                                    />
                                </div>
                                <Select
                                    value={filters.status}
                                    onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All Status</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="failed">Failed</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select
                                    value={filters.paymentMethod}
                                    onValueChange={(value) => setFilters(prev => ({ ...prev, paymentMethod: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Methods" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All Methods</SelectItem>
                                        <SelectItem value="qris">QRIS</SelectItem>
                                        <SelectItem value="transfer">Bank Transfer</SelectItem>
                                        <SelectItem value="cash">Cash</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Input
                                    type="date"
                                    value={filters.startDate}
                                    onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                                    placeholder="Start Date"
                                />
                                <Input
                                    type="date"
                                    value={filters.endDate}
                                    onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                                    placeholder="End Date"
                                />
                                <Button variant="outline" onClick={clearFilters}>
                                    <Filter className="mr-2 h-4 w-4" />
                                    Clear Filters
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="px-4 lg:px-6">
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Invoice</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Payment Method</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Fee</TableHead>
                                        <TableHead>Net Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Paid Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={9} className="text-center py-8">
                                                Loading...
                                            </TableCell>
                                        </TableRow>
                                    ) : transactions.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={9} className="text-center py-8">
                                                <div className="flex flex-col items-center gap-2">
                                                    <CreditCard className="h-8 w-8 text-muted-foreground" />
                                                    <p className="text-muted-foreground">No transactions found</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Transactions will appear here when you create invoices and receive payments
                                                    </p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        transactions.map((transaction) => {
                                            const StatusIcon = statusIcons[transaction.status];
                                            const expired = isExpired(transaction);
                                            
                                            return (
                                                <TableRow key={transaction.id}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="h-3 w-3 text-muted-foreground" />
                                                            <span>{new Date(transaction.createdAt).toLocaleDateString()}</span>
                                                        </div>
                                                    </TableCell>
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
                                                        {formatCurrency(parseFloat(transaction.fee))}
                                                    </TableCell>
                                                    <TableCell>
                                                        {formatCurrency(parseFloat(transaction.netAmount))}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className={statusColors[transaction.status]}>
                                                            <StatusIcon className="mr-1 h-3 w-3" />
                                                            {expired ? 'expired' : transaction.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {transaction.paidAt ? (
                                                            new Date(transaction.paidAt).toLocaleDateString()
                                                        ) : (
                                                            <span className="text-muted-foreground">-</span>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                {pagination.totalPages > 1 && (
                    <div className="px-4 lg:px-6">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                Showing {transactions.length} of {pagination.total} transactions
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                                    disabled={pagination.page === 1}
                                >
                                    Previous
                                </Button>
                                <span className="text-sm">
                                    Page {pagination.page} of {pagination.totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                                    disabled={pagination.page === pagination.totalPages}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}