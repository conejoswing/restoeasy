
import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
// Removed Checkbox and Percent icon as tip is handled externally
import { Banknote, CreditCard, Landmark } from 'lucide-react'; 
import type { PaymentMethod } from '@/app/tables/[tableId]/page'; 
import { Separator } from '@/components/ui/separator'; 

// Helper to format currency
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
};

const paymentMethods: { name: PaymentMethod; icon: React.ReactNode }[] = [
    { name: 'Efectivo', icon: <Banknote className="h-4 w-4 mr-2 text-green-600" /> },
    { name: 'Tarjeta Débito', icon: <CreditCard className="h-4 w-4 mr-2 text-blue-600" /> },
    { name: 'Tarjeta Crédito', icon: <CreditCard className="h-4 w-4 mr-2 text-purple-600" /> },
    { name: 'Transferencia', icon: <Landmark className="h-4 w-4 mr-2 text-indigo-600" /> },
];

interface PaymentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  totalAmount: number; // This is now the FINAL amount to be paid (subtotal + any tip)
  onConfirm: (method: PaymentMethod, paidAmount: number) => void; // Callback simplified
}

const PaymentDialog: React.FC<PaymentDialogProps> = ({
  isOpen,
  onOpenChange,
  totalAmount, // This is the final amount including any tip
  onConfirm,
}) => {
  const [selectedMethod, setSelectedMethod] = React.useState<PaymentMethod | null>(null);

  // Reset selection when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      setSelectedMethod(null);
    }
  }, [isOpen]);

  const handleConfirmClick = () => {
    if (selectedMethod) {
      // Pass the selected method and the totalAmount (which is the final amount)
      onConfirm(selectedMethod, totalAmount);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Seleccionar Método de Pago</DialogTitle>
          <DialogDescription>
            Revise el total y elija cómo se pagará.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          {/* Total Display */}
          <div className="space-y-1 text-sm">
            {/* Removed subtotal and tip display here, as totalAmount is the final amount */}
             <Separator className="my-2" />
            <div className="flex justify-between text-lg font-semibold">
              <span>Total a Pagar:</span>
              <span>{formatCurrency(totalAmount)}</span>
            </div>
          </div>

          {/* Tip Checkbox REMOVED */}

          {/* Payment Method Selection */}
          <RadioGroup
            value={selectedMethod ?? ''}
            onValueChange={(value: PaymentMethod) => setSelectedMethod(value)}
            className="grid gap-3 pt-2"
          >
            {paymentMethods.map((method) => (
              <div key={method.name} className="flex items-center space-x-2">
                <RadioGroupItem value={method.name} id={`payment-${method.name.replace(/\s+/g, '-')}`} />
                <Label htmlFor={`payment-${method.name.replace(/\s+/g, '-')}`} className="flex items-center cursor-pointer">
                  {method.icon}
                  {method.name}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
        <DialogFooter>
          <DialogClose asChild>
             <Button type="button" variant="secondary">
              Cancelar
            </Button>
          </DialogClose>
          <Button
            type="button"
            onClick={handleConfirmClick}
            disabled={!selectedMethod}
          >
            Confirmar Pago
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDialog;
