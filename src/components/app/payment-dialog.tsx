
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
import type { PaymentMethod } from '@/app/tables/[tableId]/page'; // Import PaymentMethod type

interface PaymentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  totalAmount: number;
  onConfirm: (method: PaymentMethod) => void; // Callback with selected payment method
}

// Helper to format currency
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
};

const paymentMethods: PaymentMethod[] = ['Efectivo', 'Tarjeta Débito', 'Tarjeta Crédito', 'Transferencia'];

const PaymentDialog: React.FC<PaymentDialogProps> = ({
  isOpen,
  onOpenChange,
  totalAmount,
  onConfirm,
}) => {
  const [selectedMethod, setSelectedMethod] = React.useState<PaymentMethod | null>(null);

  // Reset selection when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      setSelectedMethod(null); // Reset selection on open
    }
  }, [isOpen]);

  const handleConfirmClick = () => {
    if (selectedMethod) {
      onConfirm(selectedMethod);
    }
    // Optionally add a toast if no method is selected, though the button is disabled
  };

  const handleCancel = () => {
    onOpenChange(false); // Simply close the dialog
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Seleccionar Método de Pago</DialogTitle>
          <DialogDescription>
            Elige cómo se pagará el total de {formatCurrency(totalAmount)}.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <RadioGroup
            value={selectedMethod ?? ''}
            onValueChange={(value: PaymentMethod) => setSelectedMethod(value)}
            className="grid gap-4"
          >
            {paymentMethods.map((method) => (
              <div key={method} className="flex items-center space-x-2">
                <RadioGroupItem value={method} id={`payment-${method.replace(/\s+/g, '-')}`} />
                <Label htmlFor={`payment-${method.replace(/\s+/g, '-')}`} className="cursor-pointer">
                  {method}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
        <DialogFooter>
           {/* Use DialogClose for the Cancel button */}
          <DialogClose asChild>
             <Button type="button" variant="secondary">
              Cancelar
            </Button>
          </DialogClose>
          <Button
            type="button"
            onClick={handleConfirmClick}
            disabled={!selectedMethod} // Disable Confirm if no method is selected
          >
            Confirmar Pago
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDialog;
