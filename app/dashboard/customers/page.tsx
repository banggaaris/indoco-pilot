"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
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
    Plus,
    Search,
    Edit,
    Trash2,
    Mail,
    Phone,
    MapPin,
    CreditCard,
    UserPlus,
} from "lucide-react";
import { customerSchema } from "@/lib/validations/financial";
import { z } from "zod";

interface Customer {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    taxId: string;
    createdAt: string;
    updatedAt: string;
}

interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState<PaginationInfo>({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
    });
    const [search, setSearch] = useState("");
    const [showDialog, setShowDialog] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        address: "",
        taxId: "",
    });

    useEffect(() => {
        fetchCustomers();
    }, [pagination.page, search]);

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
                ...(search && { search }),
            });

            const response = await fetch(`/api/dashboard/customers?${params}`);
            if (!response.ok) throw new Error('Failed to fetch customers');

            const data = await response.json();
            setCustomers(data.data);
            setPagination(data.pagination);
        } catch (error) {
            console.error('Error fetching customers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCustomer = async () => {
        try {
            const validatedData = customerSchema.parse(formData);
            const response = await fetch('/api/dashboard/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(validatedData),
            });

            if (!response.ok) throw new Error('Failed to create customer');

            setFormData({ name: "", email: "", phone: "", address: "", taxId: "" });
            setShowDialog(false);
            await fetchCustomers();
        } catch (error) {
            console.error('Error creating customer:', error);
        }
    };

    const handleUpdateCustomer = async () => {
        if (!editingCustomer) return;

        try {
            const validatedData = customerSchema.parse(formData);
            const response = await fetch(`/api/dashboard/customers/${editingCustomer.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(validatedData),
            });

            if (!response.ok) throw new Error('Failed to update customer');

            setEditingCustomer(null);
            setFormData({ name: "", email: "", phone: "", address: "", taxId: "" });
            setShowDialog(false);
            await fetchCustomers();
        } catch (error) {
            console.error('Error updating customer:', error);
        }
    };

    const handleDeleteCustomer = async (customerId: string) => {
        try {
            const response = await fetch(`/api/dashboard/customers/${customerId}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Failed to delete customer');
            
            await fetchCustomers();
        } catch (error) {
            console.error('Error deleting customer:', error);
        }
    };

    const openEditDialog = (customer: Customer) => {
        setEditingCustomer(customer);
        setFormData({
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            address: customer.address,
            taxId: customer.taxId,
        });
        setShowDialog(true);
    };

    const openCreateDialog = () => {
        setEditingCustomer(null);
        setFormData({ name: "", email: "", phone: "", address: "", taxId: "" });
        setShowDialog(true);
    };

    return (
        <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <div className="px-4 lg:px-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
                            <p className="text-muted-foreground">
                                Manage your customer database and relationships
                            </p>
                        </div>
                        <Button onClick={openCreateDialog}>
                            <UserPlus className="mr-2 h-4 w-4" />
                            New Customer
                        </Button>
                    </div>
                </div>

                <div className="px-4 lg:px-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Search Customers</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by name, email, or phone..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10"
                                />
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
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Phone</TableHead>
                                        <TableHead>Address</TableHead>
                                        <TableHead>Tax ID</TableHead>
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
                                    ) : customers.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8">
                                                <div className="flex flex-col items-center gap-2">
                                                    <UserPlus className="h-8 w-8 text-muted-foreground" />
                                                    <p className="text-muted-foreground">No customers found</p>
                                                    <Button variant="outline" size="sm" onClick={openCreateDialog}>
                                                        Add your first customer
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        customers.map((customer) => (
                                            <TableRow key={customer.id}>
                                                <TableCell className="font-medium">
                                                    {customer.name}
                                                </TableCell>
                                                <TableCell>
                                                    {customer.email && (
                                                        <div className="flex items-center gap-2">
                                                            <Mail className="h-3 w-3 text-muted-foreground" />
                                                            <span>{customer.email}</span>
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {customer.phone && (
                                                        <div className="flex items-center gap-2">
                                                            <Phone className="h-3 w-3 text-muted-foreground" />
                                                            <span>{customer.phone}</span>
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {customer.address && (
                                                        <div className="flex items-start gap-2">
                                                            <MapPin className="h-3 w-3 text-muted-foreground mt-0.5" />
                                                            <span className="text-sm truncate max-w-[200px]">
                                                                {customer.address}
                                                            </span>
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {customer.taxId ? (
                                                        <Badge variant="outline">NPWP</Badge>
                                                    ) : (
                                                        <span className="text-muted-foreground text-sm">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(customer.createdAt).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center gap-2 justify-end">
                                                        <Button variant="ghost" size="sm" asChild>
                                                            <Link href={`/dashboard/invoicing?customerId=${customer.id}`}>
                                                                <CreditCard className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => openEditDialog(customer)}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button variant="ghost" size="sm">
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Delete Customer</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        Are you sure you want to delete "{customer.name}"? This action cannot be undone.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction onClick={() => handleDeleteCustomer(customer.id)}>
                                                                        Delete
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
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
                                Showing {customers.length} of {pagination.total} customers
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

            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>
                            {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingCustomer 
                                ? 'Update customer information' 
                                : 'Create a new customer for your business'
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="name" className="text-sm font-medium">
                                Name *
                            </label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Customer name"
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="text-sm font-medium">
                                Email
                            </label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                placeholder="customer@example.com"
                            />
                        </div>
                        <div>
                            <label htmlFor="phone" className="text-sm font-medium">
                                Phone
                            </label>
                            <Input
                                id="phone"
                                value={formData.phone}
                                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                placeholder="+62 812-3456-7890"
                            />
                        </div>
                        <div>
                            <label htmlFor="address" className="text-sm font-medium">
                                Address
                            </label>
                            <textarea
                                id="address"
                                className="w-full min-h-[80px] px-3 py-2 border border-input bg-background rounded-md text-sm"
                                value={formData.address}
                                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                placeholder="Customer address"
                            />
                        </div>
                        <div>
                            <label htmlFor="taxId" className="text-sm font-medium">
                                Tax ID (NPWP)
                            </label>
                            <Input
                                id="taxId"
                                value={formData.taxId}
                                onChange={(e) => setFormData(prev => ({ ...prev, taxId: e.target.value }))}
                                placeholder="12.345.678.9-012.345"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={editingCustomer ? handleUpdateCustomer : handleCreateCustomer}>
                            {editingCustomer ? 'Update' : 'Create'} Customer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}