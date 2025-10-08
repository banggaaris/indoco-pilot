"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
} from "@/components/ui/alert-dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    ArrowLeft,
    Edit,
    Send,
    Download,
    CreditCard,
    Trash2,
    FileText,
    Mail,
    CheckCircle,
    Clock,
    AlertCircle,
    XCircle,
    Copy,
    ExternalLink,
} from "lucide-react";
import { formatCurrency } from "@/lib/financial-utils";

interface InvoiceItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: string;
    total: string;
}

interface Invoice {
    id: string;
    invoiceNumber: string;
    status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
    subtotal: string;
    tax: string;
    total: string;
    dueDate: string;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
    sentAt: string | null;
    paidAt: string | null;
    customer: {
        id: string;
        name: string;
        email: string;
        phone: string;
        address: string;
        taxId: string;
    } | null;
    items: InvoiceItem[];
}

interface Transaction {
    id: string;
    paymentUrl: string;
    qrisCode: string;
    amount: string;
    fee: string;
    netAmount: string;
    status: string;
    expiresAt: string;
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

export default function InvoiceDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [transaction, setTransaction] = useState<Transaction | null>(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [creatingPayment, setCreatingPayment] = useState(false);

    useEffect(() => {
        fetchInvoice();
    }, [params.id]);

    const fetchInvoice = async () => {
        try {
            const response = await fetch(`/api/dashboard/invoices/${params.id}`);
            if (!response.ok) throw new Error('Invoice not found');
            const data = await response.json();
            setInvoice(data);
        } catch (error) {
            console.error('Error fetching invoice:', error);
            router.push('/dashboard/invoicing');
        } finally {
            setLoading(false);
        }
    };

    const handleSendInvoice = async () => {
        try {
            setSending(true);
            const response = await fetch(`/api/dashboard/invoices/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'sent' }),
            });

            if (!response.ok) throw new Error('Failed to send invoice');
            
            await fetchInvoice(); // Refresh the invoice data
        } catch (error) {
            console.error('Error sending invoice:', error);
            alert('Failed to send invoice');
        } finally {
            setSending(false);
        }
    };

    const handleCreatePayment = async () => {
        try {
            setCreatingPayment(true);
            const response = await fetch('/api/dashboard/payments/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    invoiceId: params.id,
                    paymentMethod: 'qris',
                }),
            });

            if (!response.ok) throw new Error('Failed to create payment');
            
            const data = await response.json();
            setTransaction(data.transaction);
            
            // Open payment URL in new window
            if (data.transaction?.paymentUrl) {
                window.open(data.transaction.paymentUrl, '_blank');
            }
        } catch (error) {
            console.error('Error creating payment:', error);
            alert('Failed to create payment');
        } finally {
            setCreatingPayment(false);
        }
    };

    const handleDeleteInvoice = async () => {
        try {
            const response = await fetch(`/api/dashboard/invoices/${params.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Failed to delete invoice');
            
            router.push('/dashboard/invoicing');
        } catch (error) {
            console.error('Error deleting invoice:', error);
            alert('Failed to delete invoice');
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // You could show a toast notification here
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Loading invoice...</p>
                </div>
            </div>
        );
    }

    if (!invoice) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h2 className="text-xl font-semibold mb-2">Invoice Not Found</h2>
                    <p className="text-muted-foreground mb-4">The invoice you're looking for doesn't exist.</p>
                    <Link href="/dashboard/invoicing">
                        <Button>Back to Invoices</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const StatusIcon = statusIcons[invoice.status];
    const subtotal = parseFloat(invoice.subtotal);
    const tax = parseFloat(invoice.tax);
    const total = parseFloat(invoice.total);

    return (
        <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <div className="px-4 lg:px-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard/invoicing">
                                <Button variant="ghost" size="sm">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to Invoices
                                </Button>
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">
                                    Invoice {invoice.invoiceNumber}
                                </h1>
                                <p className="text-muted-foreground">
                                    Created on {new Date(invoice.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {invoice.status === 'draft' && (
                                <>
                                    <Link href={`/dashboard/invoicing/${invoice.id}/edit`}>
                                        <Button variant="outline">
                                            <Edit className="mr-2 h-4 w-4" />
                                            Edit
                                        </Button>
                                    </Link>
                                    <Button onClick={handleSendInvoice} disabled={sending}>
                                        <Send className="mr-2 h-4 w-4" />
                                        {sending ? 'Sending...' : 'Send Invoice'}
                                    </Button>
                                </>
                            )}
                            
                            {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                                <>
                                    <Button onClick={handleCreatePayment} disabled={creatingPayment}>
                                        <CreditCard className="mr-2 h-4 w-4" />
                                        {creatingPayment ? 'Creating...' : 'Create QRIS Payment'}
                                    </Button>
                                    {transaction && (
                                        <Button variant="outline" asChild>
                                            <a href={transaction.paymentUrl} target="_blank" rel="noopener noreferrer">
                                                <ExternalLink className="mr-2 h-4 w-4" />
                                                View Payment
                                            </a>
                                        </Button>
                                    )}
                                </>
                            )}
                            
                            <Button variant="outline" asChild>
                                <Link href={`/dashboard/invoicing/${invoice.id}/pdf`} target="_blank">
                                    <Download className="mr-2 h-4 w-4" />
                                    Download PDF
                                </Link>
                            </Button>
                            
                            {invoice.status !== 'paid' && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="sm">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Are you sure you want to delete this invoice? This action cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleDeleteInvoice}>Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                        </div>
                    </div>
                </div>

                <div className="px-4 lg:px-6 grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Invoice Details</CardTitle>
                                    <Badge className={statusColors[invoice.status]}>
                                        <StatusIcon className="mr-1 h-3 w-3" />
                                        {invoice.status}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <h3 className="font-semibold mb-2">Bill To</h3>
                                        {invoice.customer ? (
                                            <div className="space-y-1 text-sm">
                                                <p className="font-medium">{invoice.customer.name}</p>
                                                {invoice.customer.email && <p>{invoice.customer.email}</p>}
                                                {invoice.customer.phone && <p>{invoice.customer.phone}</p>}
                                                {invoice.customer.address && <p>{invoice.customer.address}</p>}
                                                {invoice.customer.taxId && <p>Tax ID: {invoice.customer.taxId}</p>}
                                            </div>
                                        ) : (
                                            <p className="text-muted-foreground">No customer assigned</p>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-2">Invoice Summary</h3>
                                        <div className="space-y-1 text-sm">
                                            <p><strong>Invoice Number:</strong> {invoice.invoiceNumber}</p>
                                            <p><strong>Status:</strong> {invoice.status}</p>
                                            <p><strong>Due Date:</strong> {new Date(invoice.dueDate).toLocaleDateString()}</p>
                                            {invoice.sentAt && (
                                                <p><strong>Sent:</strong> {new Date(invoice.sentAt).toLocaleDateString()}</p>
                                            )}
                                            {invoice.paidAt && (
                                                <p><strong>Paid:</strong> {new Date(invoice.paidAt).toLocaleDateString()}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {invoice.notes && (
                                    <div className="mt-4">
                                        <h3 className="font-semibold mb-2">Notes</h3>
                                        <p className="text-sm text-muted-foreground">{invoice.notes}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Items</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Description</TableHead>
                                            <TableHead className="text-right">Quantity</TableHead>
                                            <TableHead className="text-right">Price</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {invoice.items.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell>{item.description}</TableCell>
                                                <TableCell className="text-right">{item.quantity}</TableCell>
                                                <TableCell className="text-right">
                                                    {formatCurrency(parseFloat(item.unitPrice))}
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {formatCurrency(parseFloat(item.total))}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <div className="mt-4 space-y-2">
                                    <Separator />
                                    <div className="flex justify-between">
                                        <span>Subtotal:</span>
                                        <span className="font-medium">{formatCurrency(subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Tax:</span>
                                        <span className="font-medium">{formatCurrency(tax)}</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between text-lg font-bold">
                                        <span>Total:</span>
                                        <span>{formatCurrency(total)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        {transaction && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Payment Information</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Payment Method</p>
                                            <p className="font-medium">QRIS</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Amount</p>
                                            <p className="font-medium">{formatCurrency(parseFloat(transaction.amount))}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Fee</p>
                                            <p className="font-medium">{formatCurrency(parseFloat(transaction.fee))}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Net Amount</p>
                                            <p className="font-medium">{formatCurrency(parseFloat(transaction.netAmount))}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Status</p>
                                            <Badge className={statusColors[transaction.status as keyof typeof statusColors]}>
                                                {transaction.status}
                                            </Badge>
                                        </div>
                                        {transaction.expiresAt && (
                                            <div>
                                                <p className="text-sm text-muted-foreground">Expires</p>
                                                <p className="font-medium">
                                                    {new Date(transaction.expiresAt).toLocaleString()}
                                                </p>
                                            </div>
                                        )}
                                        <div className="flex gap-2">
                                            <Button asChild className="flex-1">
                                                <a href={transaction.paymentUrl} target="_blank" rel="noopener noreferrer">
                                                    <ExternalLink className="mr-2 h-4 w-4" />
                                                    Pay Now
                                                </a>
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => copyToClipboard(transaction.paymentUrl)}
                                            >
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <Card>
                            <CardHeader>
                                <CardTitle>Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {invoice.status === 'draft' && (
                                        <Button onClick={handleSendInvoice} className="w-full" disabled={sending}>
                                            <Send className="mr-2 h-4 w-4" />
                                            {sending ? 'Sending...' : 'Send Invoice'}
                                        </Button>
                                    )}
                                    
                                    {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                                        <Button onClick={handleCreatePayment} className="w-full" disabled={creatingPayment}>
                                            <CreditCard className="mr-2 h-4 w-4" />
                                            {creatingPayment ? 'Creating...' : 'Create QRIS Payment'}
                                        </Button>
                                    )}
                                    
                                    <Button variant="outline" className="w-full" asChild>
                                        <Link href={`/dashboard/invoicing/${invoice.id}/pdf`} target="_blank">
                                            <Download className="mr-2 h-4 w-4" />
                                            Download PDF
                                        </Link>
                                    </Button>
                                    
                                    {invoice.status === 'draft' && (
                                        <Button variant="outline" className="w-full" asChild>
                                            <Link href={`/dashboard/invoicing/${invoice.id}/edit`}>
                                                <Edit className="mr-2 h-4 w-4" />
                                                Edit Invoice
                                            </Link>
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Payment Methods</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                                            <CreditCard className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium">QRIS</p>
                                            <p className="text-sm text-muted-foreground">
                                                Quick Response Code Indonesia Standard
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Customers can pay using various Indonesian e-wallets and banking apps that support QRIS.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}