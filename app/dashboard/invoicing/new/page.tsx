"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Plus,
    Trash2,
    Save,
    Send,
    FileText,
    Calculator,
    Eye,
    UserPlus,
} from "lucide-react";
import { formatCurrency, calculateTax, calculateTotal, calculateLineItemTotal, addDays } from "@/lib/financial-utils";
import { invoiceItemSchema, customerSchema } from "@/lib/validations/financial";
import { z } from "zod";

interface Customer {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    taxId: string;
}

interface InvoiceItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

export default function NewInvoicePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [showCustomerDialog, setShowCustomerDialog] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    
    const [formData, setFormData] = useState({
        customerId: "",
        dueDate: addDays(new Date(), 30).toISOString().split('T')[0],
        notes: "",
        taxRate: 0.11,
    });

    const [items, setItems] = useState<InvoiceItem[]>([
        {
            id: crypto.randomUUID(),
            description: "",
            quantity: 1,
            unitPrice: 0,
            total: 0,
        },
    ]);

    const [newCustomer, setNewCustomer] = useState({
        name: "",
        email: "",
        phone: "",
        address: "",
        taxId: "",
    });

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const response = await fetch('/api/dashboard/customers?limit=100');
            if (!response.ok) throw new Error('Failed to fetch customers');
            const data = await response.json();
            setCustomers(data.data);
        } catch (error) {
            console.error('Error fetching customers:', error);
        }
    };

    const calculateSubtotal = () => {
        return items.reduce((sum, item) => sum + item.total, 0);
    };

    const calculateTotals = () => {
        const subtotal = calculateSubtotal();
        const tax = calculateTax(subtotal, formData.taxRate);
        const total = calculateTotal(subtotal, tax);
        return { subtotal, tax, total };
    };

    const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
        setItems(prev => prev.map(item => {
            if (item.id === id) {
                const updated = { ...item, [field]: value };
                if (field === 'quantity' || field === 'unitPrice') {
                    updated.total = calculateLineItemTotal(
                        updated.quantity,
                        updated.unitPrice
                    );
                }
                return updated;
            }
            return item;
        }));
    };

    const addItem = () => {
        setItems(prev => [...prev, {
            id: crypto.randomUUID(),
            description: "",
            quantity: 1,
            unitPrice: 0,
            total: 0,
        }]);
    };

    const removeItem = (id: string) => {
        setItems(prev => prev.length > 1 ? prev.filter(item => item.id !== id) : prev);
    };

    const handleCreateCustomer = async () => {
        try {
            const validatedData = customerSchema.parse(newCustomer);
            const response = await fetch('/api/dashboard/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(validatedData),
            });

            if (!response.ok) throw new Error('Failed to create customer');

            const createdCustomer = await response.json();
            setCustomers(prev => [...prev, createdCustomer]);
            setFormData(prev => ({ ...prev, customerId: createdCustomer.id }));
            setNewCustomer({ name: "", email: "", phone: "", address: "", taxId: "" });
            setShowCustomerDialog(false);
        } catch (error) {
            console.error('Error creating customer:', error);
        }
    };

    const handleSaveDraft = async () => {
        await handleSubmit('draft');
    };

    const handleSendInvoice = async () => {
        await handleSubmit('sent');
    };

    const handleSubmit = async (status: 'draft' | 'sent') => {
        try {
            setLoading(true);

            // Validate form
            if (!formData.customerId) {
                throw new Error('Please select a customer');
            }

            if (items.some(item => !item.description || item.quantity <= 0 || item.unitPrice <= 0)) {
                throw new Error('Please fill in all item details correctly');
            }

            const invoiceData = {
                customerId: formData.customerId,
                dueDate: formData.dueDate,
                notes: formData.notes,
                taxRate: formData.taxRate,
                items: items.map(item => ({
                    description: item.description,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                })),
            };

            const response = await fetch('/api/dashboard/invoices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(invoiceData),
            });

            if (!response.ok) throw new Error('Failed to create invoice');

            const createdInvoice = await response.json();

            if (status === 'sent') {
                await fetch(`/api/dashboard/invoices/${createdInvoice.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'sent' }),
                });
            }

            router.push(`/dashboard/invoicing/${createdInvoice.id}`);
        } catch (error) {
            console.error('Error creating invoice:', error);
            alert(error instanceof Error ? error.message : 'Failed to create invoice');
        } finally {
            setLoading(false);
        }
    };

    const { subtotal, tax, total } = calculateTotals();

    return (
        <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <div className="px-4 lg:px-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">New Invoice</h1>
                            <p className="text-muted-foreground">
                                Create and send professional invoices to your customers
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setShowPreview(true)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Preview
                            </Button>
                            <Button variant="outline" onClick={handleSaveDraft} disabled={loading}>
                                <Save className="mr-2 h-4 w-4" />
                                Save Draft
                            </Button>
                            <Button onClick={handleSendInvoice} disabled={loading}>
                                <Send className="mr-2 h-4 w-4" />
                                Create & Send
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="px-4 lg:px-6 grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Customer Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex gap-2">
                                    <Select
                                        value={formData.customerId}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, customerId: value }))}
                                    >
                                        <SelectTrigger className="flex-1">
                                            <SelectValue placeholder="Select a customer" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {customers.map((customer) => (
                                                <SelectItem key={customer.id} value={customer.id}>
                                                    {customer.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
                                        <DialogTrigger asChild>
                                            <Button variant="outline">
                                                <UserPlus className="h-4 w-4" />
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Add New Customer</DialogTitle>
                                                <DialogDescription>
                                                    Create a new customer for your business
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4">
                                                <div>
                                                    <Label htmlFor="name">Name *</Label>
                                                    <Input
                                                        id="name"
                                                        value={newCustomer.name}
                                                        onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                                                        placeholder="Customer name"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="email">Email</Label>
                                                    <Input
                                                        id="email"
                                                        type="email"
                                                        value={newCustomer.email}
                                                        onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
                                                        placeholder="customer@example.com"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="phone">Phone</Label>
                                                    <Input
                                                        id="phone"
                                                        value={newCustomer.phone}
                                                        onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                                                        placeholder="+62 812-3456-7890"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="address">Address</Label>
                                                    <Textarea
                                                        id="address"
                                                        value={newCustomer.address}
                                                        onChange={(e) => setNewCustomer(prev => ({ ...prev, address: e.target.value }))}
                                                        placeholder="Customer address"
                                                        rows={3}
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="taxId">Tax ID (NPWP)</Label>
                                                    <Input
                                                        id="taxId"
                                                        value={newCustomer.taxId}
                                                        onChange={(e) => setNewCustomer(prev => ({ ...prev, taxId: e.target.value }))}
                                                        placeholder="12.345.678.9-012.345"
                                                    />
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button variant="outline" onClick={() => setShowCustomerDialog(false)}>
                                                    Cancel
                                                </Button>
                                                <Button onClick={handleCreateCustomer}>
                                                    Create Customer
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Invoice Items</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {items.map((item, index) => (
                                        <div key={item.id} className="flex gap-2 items-end">
                                            <div className="flex-1">
                                                <Label htmlFor={`description-${index}`}>Description</Label>
                                                <Input
                                                    id={`description-${index}`}
                                                    value={item.description}
                                                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                                    placeholder="Item description"
                                                />
                                            </div>
                                            <div className="w-24">
                                                <Label htmlFor={`quantity-${index}`}>Qty</Label>
                                                <Input
                                                    id={`quantity-${index}`}
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                                                />
                                            </div>
                                            <div className="w-32">
                                                <Label htmlFor={`price-${index}`}>Price</Label>
                                                <Input
                                                    id={`price-${index}`}
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={item.unitPrice}
                                                    onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            <div className="w-24">
                                                <Label>Total</Label>
                                                <div className="text-sm font-medium py-2">
                                                    {formatCurrency(item.total)}
                                                </div>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                onClick={() => removeItem(item.id)}
                                                disabled={items.length === 1}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={addItem}
                                    className="mt-4"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Item
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Additional Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <Label htmlFor="dueDate">Due Date</Label>
                                        <Input
                                            id="dueDate"
                                            type="date"
                                            value={formData.dueDate}
                                            onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="taxRate">Tax Rate</Label>
                                        <Select
                                            value={formData.taxRate.toString()}
                                            onValueChange={(value) => setFormData(prev => ({ ...prev, taxRate: parseFloat(value) }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="0">0%</SelectItem>
                                                <SelectItem value="0.11">11% (Standard)</SelectItem>
                                                <SelectItem value="0.12">12%</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="notes">Notes</Label>
                                    <Textarea
                                        id="notes"
                                        value={formData.notes}
                                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                        placeholder="Additional notes for the customer"
                                        rows={3}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Calculator className="h-5 w-5" />
                                    Invoice Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex justify-between">
                                        <span>Subtotal:</span>
                                        <span className="font-medium">{formatCurrency(subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Tax ({(formData.taxRate * 100).toFixed(0)}%):</span>
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

                        <Card>
                            <CardHeader>
                                <CardTitle>Payment Methods</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <Badge variant="outline" className="w-full justify-center py-2">
                                        QRIS Payments
                                    </Badge>
                                    <p className="text-sm text-muted-foreground">
                                        Customers can pay instantly using QRIS, QR codes from various Indonesian e-wallets and banking apps.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Next Steps</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        <span>Create invoice draft</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        <span>Send to customer</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        <span>Generate QRIS payment</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        <span>Track payment status</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}