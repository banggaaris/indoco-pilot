"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
    PlusCircle, 
    Search, 
    FileText, 
    Mail, 
    MoreHorizontal,
    Download,
    Eye,
    CreditCard,
    CheckCircle,
    Clock,
    AlertCircle,
    XCircle
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency, generateInvoiceNumber } from "@/lib/financial-utils";

interface Invoice {
    id: string;
    invoiceNumber: string;
    status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
    subtotal: string;
    tax: string;
    total: string;
    dueDate: string;
    createdAt: string;
    updatedAt: string;
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
    draft: "bg-gray-100 text-gray-800",
    sent: "bg-blue-100 text-blue-800",
    paid: "bg-green-100 text-green-800",
    overdue: "bg-red-100 text-red-800",
    cancelled: "bg-gray-100 text-gray-800",
};

const statusIcons = {
    draft: FileText,
    sent: Mail,
    paid: CheckCircle,
    overdue: AlertCircle,
    cancelled: XCircle,
};

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
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
        customerId: "",
    });

    useEffect(() => {
        fetchInvoices();
    }, [pagination.page, filters]);

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
                ...(filters.search && { search: filters.search }),
                ...(filters.status && { status: filters.status }),
                ...(filters.customerId && { customerId: filters.customerId }),
            });

            const response = await fetch(`/api/dashboard/invoices?${params}`);
            if (!response.ok) throw new Error('Failed to fetch invoices');

            const data = await response.json();
            setInvoices(data.data);
            setPagination(data.pagination);
        } catch (error) {
            console.error('Error fetching invoices:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendInvoice = async (invoiceId: string) => {
        try {
            const response = await fetch(`/api/dashboard/invoices/${invoiceId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'sent' }),
            });

            if (!response.ok) throw new Error('Failed to send invoice');
            
            await fetchInvoices(); // Refresh the list
        } catch (error) {
            console.error('Error sending invoice:', error);
        }
    };

    const handleCreatePayment = async (invoiceId: string) => {
        try {
            const response = await fetch('/api/dashboard/payments/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    invoiceId,
                    paymentMethod: 'qris',
                }),
            });

            if (!response.ok) throw new Error('Failed to create payment');
            
            const data = await response.json();
            // You could open the payment URL in a new window or show a modal
            if (data.transaction?.paymentUrl) {
                window.open(data.transaction.paymentUrl, '_blank');
            }
        } catch (error) {
            console.error('Error creating payment:', error);
        }
    };

    return (
        <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <div className="px-4 lg:px-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
                            <p className="text-muted-foreground">
                                Manage your invoices and track payments
                            </p>
                        </div>
                        <Link href="/dashboard/invoicing/new">
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                New Invoice
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="px-4 lg:px-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Filters</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col gap-4 md:flex-row">
                                <div className="flex-1">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search invoices..."
                                            value={filters.search}
                                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                                <Select
                                    value={filters.status}
                                    onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                                >
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="All Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All Status</SelectItem>
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="sent">Sent</SelectItem>
                                        <SelectItem value="paid">Paid</SelectItem>
                                        <SelectItem value="overdue">Overdue</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
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
                                        <TableHead>Invoice Number</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Due Date</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8">
                                                Loading...
                                            </TableCell>
                                        </TableRow>
                                    ) : invoices.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8">
                                                <div className="flex flex-col items-center gap-2">
                                                    <FileText className="h-8 w-8 text-muted-foreground" />
                                                    <p className="text-muted-foreground">No invoices found</p>
                                                    <Link href="/dashboard/invoicing/new">
                                                        <Button variant="outline" size="sm">
                                                            Create your first invoice
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        invoices.map((invoice) => {
                                            const StatusIcon = statusIcons[invoice.status];
                                            return (
                                                <TableRow key={invoice.id}>
                                                    <TableCell className="font-medium">
                                                        {invoice.invoiceNumber}
                                                    </TableCell>
                                                    <TableCell>
                                                        {invoice.customer?.name || 'No customer'}
                                                    </TableCell>
                                                    <TableCell>
                                                        {formatCurrency(parseFloat(invoice.total))}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className={statusColors[invoice.status]}>
                                                            <StatusIcon className="mr-1 h-3 w-3" />
                                                            {invoice.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {new Date(invoice.dueDate).toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell>
                                                        {new Date(invoice.createdAt).toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                                <DropdownMenuItem asChild>
                                                                    <Link href={`/dashboard/invoicing/${invoice.id}`}>
                                                                        <Eye className="mr-2 h-4 w-4" />
                                                                        View Details
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem asChild>
                                                                    <Link href={`/dashboard/invoicing/${invoice.id}/edit`}>
                                                                        <FileText className="mr-2 h-4 w-4" />
                                                                        Edit
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                {invoice.status === 'draft' && (
                                                                    <DropdownMenuItem onClick={() => handleSendInvoice(invoice.id)}>
                                                                        <Mail className="mr-2 h-4 w-4" />
                                                                        Send Invoice
                                                                    </DropdownMenuItem>
                                                                )}
                                                                {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                                                                    <DropdownMenuItem onClick={() => handleCreatePayment(invoice.id)}>
                                                                        <CreditCard className="mr-2 h-4 w-4" />
                                                                        Create Payment
                                                                    </DropdownMenuItem>
                                                                )}
                                                                <DropdownMenuItem asChild>
                                                                    <Link href={`/dashboard/invoicing/${invoice.id}/pdf`} target="_blank">
                                                                        <Download className="mr-2 h-4 w-4" />
                                                                        Download PDF
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
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
                                Showing {invoices.length} of {pagination.total} invoices
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