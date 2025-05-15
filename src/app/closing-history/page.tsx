
'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button, buttonVariants } from '@/components/ui/button';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Printer, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import type { ClosingRecord, CashMovement } from '@/app/expenses/page'; // Import ClosingRecord
import { formatCashClosingReceipt, printHtml, formatCurrency } from '@/lib/printUtils';
import { format as formatDateFns } from 'date-fns'; // For consistent date formatting
import { cn } from '@/lib/utils';

const CLOSING_HISTORY_STORAGE_KEY = 'cashClosingHistory';

export default function ClosingHistoryPage() {
  const [closingRecords, setClosingRecords] = useState<ClosingRecord[]>([]);
  const [isHistoryInitialized, setIsHistoryInitialized] = useState(false);
  const { toast } = useToast();
  const { isLoading, userRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return; // Wait for auth state to load

    if (userRole !== 'admin') {
      toast({ title: "Acceso Denegado", description: "No tiene permisos para ver el historial de cierres.", variant: "destructive" });
      router.push('/tables'); // Redirect non-admins
      return;
    }

    console.log("Initializing closing history from localStorage...");
    const storedHistory = localStorage.getItem(CLOSING_HISTORY_STORAGE_KEY);
    let loadedHistory: ClosingRecord[] = [];

    if (storedHistory) {
      try {
        const parsed = JSON.parse(storedHistory);
        if (Array.isArray(parsed)) {
          // Basic validation for each record might be needed here if structure is critical
          loadedHistory = parsed.sort((a,b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()); // Sort by date descending
        } else {
          console.warn("Invalid closing history data found in localStorage.");
        }
      } catch (error) {
        console.error("Failed to parse stored closing history:", error);
      }
    }
    setClosingRecords(loadedHistory);
    setIsHistoryInitialized(true);
    console.log("Closing history initialization complete.");
  }, [isLoading, userRole, router, toast]);

  const handleReprintClosing = (record: ClosingRecord) => {
    try {
        // Ensure dateTime is a Date object for formatCashClosingReceipt
        const closingDateTimeObject = new Date(record.dateTime);

        // Ensure movements have Date objects if they were stored as ISO strings
        const movementsWithDateObjects: CashMovement[] = record.movements.map(m => ({
            ...m,
            date: new Date(m.date) // Convert ISO string back to Date
        }));

        const receiptHtml = formatCashClosingReceipt(
            closingDateTimeObject,
            record.totals,
            movementsWithDateObjects,
            record.inventory
        );
        printHtml(receiptHtml);
        toast({ title: "Recibo Reimpreso", description: `Se ha reimpreso el cierre del ${formatDateFns(closingDateTimeObject, 'dd/MM/yyyy HH:mm')}.` });
    } catch (error) {
        console.error("Error al reimprimir cierre:", error);
        toast({ title: "Error", description: "No se pudo reimprimir el cierre.", variant: "destructive" });
    }
  };

  const handleDeleteClosingRecord = (recordId: string) => {
    const updatedRecords = closingRecords.filter(record => record.id !== recordId);
    setClosingRecords(updatedRecords);
    localStorage.setItem(CLOSING_HISTORY_STORAGE_KEY, JSON.stringify(updatedRecords));
    toast({ title: "Registro Eliminado", description: "El cierre de caja ha sido eliminado del historial.", variant: "destructive" });
  };

  if (isLoading || !isHistoryInitialized) {
    return <div className="flex items-center justify-center min-h-screen">Cargando Historial de Cierres...</div>;
  }

  if (userRole !== 'admin') {
    // This should ideally be caught by the useEffect redirect, but as a fallback:
    return (
        <div className="container mx-auto p-4 text-center">
            <h1 className="text-2xl font-bold text-destructive">Acceso Denegado</h1>
            <p className="text-muted-foreground">No tiene permisos para ver esta página.</p>
        </div>
    );
  }


  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
         <Button variant="outline" onClick={() => router.push('/tables')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
        </Button>
        <h1 className="text-3xl font-bold">Registro de Cierres de Caja</h1>
        <div></div> {/* Placeholder for alignment */}
      </div>

      <Card>
        <CardContent className="p-0">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Fecha y Hora del Cierre</TableHead>
                <TableHead className="text-right">Total Neto</TableHead>
                <TableHead className="text-right">Total Bruto</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {closingRecords.length === 0 && (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    No hay cierres de caja registrados.
                    </TableCell>
                </TableRow>
                )}
                {closingRecords.map((record) => (
                <TableRow key={record.id}>
                    <TableCell className="font-medium">
                        {formatDateFns(new Date(record.dateTime), 'dd/MM/yyyy HH:mm:ss')}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                        {formatCurrency(record.totals.dailyNetTotal)}
                    </TableCell>
                     <TableCell className="text-right font-mono">
                        {formatCurrency(record.totals.dailyGrossTotal ?? record.totals.dailyTotalIncome)}
                    </TableCell>
                    <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleReprintClosing(record)}
                            >
                                <Printer className="mr-2 h-4 w-4" />
                                Reimprimir
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Eliminar
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Esta acción no se puede deshacer. Esto eliminará permanentemente el registro del cierre del <strong className="font-semibold">{formatDateFns(new Date(record.dateTime), 'dd/MM/yyyy HH:mm')}</strong>.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => handleDeleteClosingRecord(record.id)}
                                            className={cn(buttonVariants({ variant: "destructive" }))}
                                        >
                                            Confirmar Eliminación
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
        </CardContent>
      </Card>
    </div>
  );
}

