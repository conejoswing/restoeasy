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
import { Checkbox } from '@/components/ui/checkbox'; // Import Checkbox
import { Banknote, CreditCard, Landmark, Percent } from 'lucide-react'; // Import icons
import type { PaymentMethod } from '@/app/tables/[tableId]/page'; // Import PaymentMethod type
import { Separator } from '@/components/ui/separator'; // Import Separator

interface PaymentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  totalAmount: number; // This is the subtotal before tip
  onConfirm: (method: PaymentMethod, tipAmount: number, finalAmountWithTip: number) => void; // Updated callback
}

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

const PaymentDialog: React.FC<PaymentDialogProps> = ({
  isOpen,
  onOpenChange,
  totalAmount, // This is now subtotal
  onConfirm,
}) => {
  const [selectedMethod, setSelectedMethod] = React.useState<PaymentMethod | null>(null);
  const [includeTip, setIncludeTip] = React.useState<boolean>(false);
  const [tipAmount, setTipAmount] = React.useState<number>(0);
  const [grandTotal, setGrandTotal] = React.useState<number>(totalAmount);

  // Reset selection and tip when dialog opens or totalAmount changes
  React.useEffect(() => {
    if (isOpen) {
      setSelectedMethod(null);
      setIncludeTip(false); // Default to no tip
    }
  }, [isOpen]);

  // Recalculate tip and grand total when totalAmount or includeTip changes
  React.useEffect(() => {
    let currentTip = 0;
    if (includeTip) {
      currentTip = Math.round(totalAmount * 0.10); // Calculate 10% tip and round
    }
    setTipAmount(currentTip);
    setGrandTotal(totalAmount + currentTip);
  }, [totalAmount, includeTip, isOpen]); // Add isOpen to re-calc when dialog becomes visible with new totalAmount

  const handleConfirmClick = () => {
    if (selectedMethod) {
      onConfirm(selectedMethod, tipAmount, grandTotal);
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
          {/* Totals Display */}
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-medium">{formatCurrency(totalAmount)}</span>
            </div>
            {includeTip && (
              <div className="flex justify-between text-muted-foreground">
                <span>Propina (10%):</span>
                <span className="font-medium">{formatCurrency(tipAmount)}</span>
              </div>
            )}
             <Separator className="my-2" />
            <div className="flex justify-between text-lg font-semibold">
              <span>Total a Pagar:</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          {/* Tip Checkbox */}
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="includeTip"
              checked={includeTip}
              onCheckedChange={(checked) => setIncludeTip(!!checked)}
            />
            <Label htmlFor="includeTip" className="flex items-center cursor-pointer">
              <Percent className="h-4 w-4 mr-2 text-primary" />
              Incluir Propina (10%)
            </Label>
          </div>

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
