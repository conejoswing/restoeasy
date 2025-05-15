
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
import { Input } from '@/components/ui/input'; // Import Input
import { Banknote, CreditCard, Landmark } from 'lucide-react';
import type { PaymentMethod } from '@/app/tables/[tableId]/page';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// Helper to format currency
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
};

const paymentMethods: { name: PaymentMethod; icon: React.ReactNode }[] = [
    { name: 'Efectivo', icon: <Banknote className="h-4 w-4 mr-2 text-green-600" /> },
    { name: 'Tarjeta', icon: <CreditCard className="h-4 w-4 mr-2 text-blue-600" /> },
    { name: 'Transferencia', icon: <Landmark className="h-4 w-4 mr-2 text-indigo-600" /> },
];

interface PaymentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  totalAmount: number;
  onConfirm: (method: PaymentMethod, paidAmount: number) => void;
}

const PaymentDialog: React.FC<PaymentDialogProps> = ({
  isOpen,
  onOpenChange,
  totalAmount,
  onConfirm,
}) => {
  const [selectedMethod, setSelectedMethod] = React.useState<PaymentMethod | null>(null);
  const [cashReceived, setCashReceived] = React.useState<string>('');
  const [changeDue, setChangeDue] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setSelectedMethod(null);
      setCashReceived('');
      setChangeDue(null);
    }
  }, [isOpen]);

  React.useEffect(() => {
    if (selectedMethod === 'Efectivo' && cashReceived) {
      const received = parseFloat(cashReceived);
      if (!isNaN(received) && received >= totalAmount) {
        setChangeDue(received - totalAmount);
      } else {
        setChangeDue(null);
      }
    } else {
      setChangeDue(null);
    }
  }, [selectedMethod, cashReceived, totalAmount]);

  const handleCashReceivedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers
    if (/^\d*$/.test(value)) {
      setCashReceived(value);
    }
  };

  const handleConfirmClick = () => {
    if (selectedMethod) {
      if (selectedMethod === 'Efectivo') {
        const received = parseFloat(cashReceived);
        if (isNaN(received) || received < totalAmount) {
          // This case should ideally be prevented by disabling the button,
          // but as a fallback:
          alert("El monto recibido es insuficiente o inválido.");
          return;
        }
      }
      onConfirm(selectedMethod, totalAmount);
    }
  };

  const isConfirmDisabled = () => {
    if (!selectedMethod) return true;
    if (selectedMethod === 'Efectivo') {
      const received = parseFloat(cashReceived);
      return isNaN(received) || received < totalAmount;
    }
    return false;
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
          <div className="space-y-1 text-sm">
             <Separator className="my-2" />
            <div className="flex justify-between text-lg font-semibold">
              <span>Total a Pagar:</span>
              <span>{formatCurrency(totalAmount)}</span>
            </div>
          </div>

          <RadioGroup
            value={selectedMethod ?? ''}
            onValueChange={(value: PaymentMethod) => {
              setSelectedMethod(value);
              if (value !== 'Efectivo') {
                setCashReceived(''); // Clear cash received if not paying with cash
              }
            }}
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

          {selectedMethod === 'Efectivo' && (
            <div className="space-y-3 pt-3 border-t mt-3">
              <div>
                <Label htmlFor="cashReceived" className="text-sm font-medium">Monto Recibido (CLP)</Label>
                <Input
                  id="cashReceived"
                  type="text" // Use text to manage non-numeric input via regex
                  value={cashReceived}
                  onChange={handleCashReceivedChange}
                  placeholder="Ingrese monto"
                  className="mt-1 text-lg"
                  inputMode="numeric" // Hint for numeric keyboard on mobile
                />
              </div>
              {parseFloat(cashReceived) >= totalAmount && changeDue !== null && (
                <div className="text-base">
                  <span className="font-medium">Vuelto: </span>
                  <span className="font-semibold text-green-600">{formatCurrency(changeDue)}</span>
                </div>
              )}
              {cashReceived && parseFloat(cashReceived) < totalAmount && (
                 <p className="text-sm text-destructive">Monto recibido es menor al total a pagar.</p>
              )}
            </div>
          )}
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
            disabled={isConfirmDisabled()}
          >
            Confirmar Pago
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDialog;
