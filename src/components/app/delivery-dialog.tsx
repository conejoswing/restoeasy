
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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Home, Phone, User, DollarSign } from 'lucide-react'; // Import icons

export interface DeliveryInfo {
  name: string;
  address: string;
  phone: string;
  deliveryFee: number;
}

interface DeliveryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: DeliveryInfo | null; // Optional initial data for editing
  onConfirm: (info: DeliveryInfo) => void; // Callback with collected info
  onCancel: () => void; // Callback for cancellation
}

const DeliveryDialog: React.FC<DeliveryDialogProps> = ({
  isOpen,
  onOpenChange,
  initialData,
  onConfirm,
  onCancel,
}) => {
  const [name, setName] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [deliveryFee, setDeliveryFee] = React.useState('');
  const { toast } = useToast();

  // Pre-fill form if initialData is provided
  React.useEffect(() => {
    if (isOpen && initialData) {
      setName(initialData.name);
      setAddress(initialData.address);
      setPhone(initialData.phone);
      setDeliveryFee(initialData.deliveryFee.toString());
    } else if (isOpen) {
      // Reset form if opening without initial data
      setName('');
      setAddress('');
      setPhone('');
      setDeliveryFee('');
    }
  }, [isOpen, initialData]);

  const handleConfirmClick = () => {
    if (!name || !address || !phone || !deliveryFee) {
      toast({ title: "Error", description: "Por favor, rellene todos los campos de envío.", variant: "destructive" });
      return;
    }
    const fee = parseFloat(deliveryFee);
    if (isNaN(fee) || fee < 0) {
      toast({ title: "Error", description: "El costo de envío debe ser un número válido y no negativo.", variant: "destructive" });
      return;
    }

    onConfirm({
      name,
      address,
      phone,
      deliveryFee: fee,
    });
  };

  const handleCancelClick = () => {
    onCancel(); // Call parent cancel logic
    // Don't automatically close if fields are empty and no initial data exists (handled in parent)
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]"> {/* Slightly wider dialog */}
        <DialogHeader>
          <DialogTitle>Datos de Envío</DialogTitle>
          <DialogDescription>
            Ingrese la información necesaria para la entrega a domicilio.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              <User className="inline h-4 w-4 mr-1 align-middle" /> Nombre
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              required
              placeholder="Nombre del cliente"
              autoComplete="name"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="address" className="text-right">
              <Home className="inline h-4 w-4 mr-1 align-middle" /> Dirección
            </Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="col-span-3"
              required
              placeholder="Dirección completa"
              autoComplete="street-address"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right">
               <Phone className="inline h-4 w-4 mr-1 align-middle" /> Teléfono
            </Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="col-span-3"
              required
              placeholder="Número de contacto"
              autoComplete="tel"
            />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="deliveryFee" className="text-right">
              <DollarSign className="inline h-4 w-4 mr-1 align-middle" /> Costo Envío
            </Label>
            <Input
              id="deliveryFee"
              type="number"
              value={deliveryFee}
              onChange={(e) => setDeliveryFee(e.target.value)}
              className="col-span-3"
              required
              placeholder="0"
              min="0"
              step="1" // Or use 0.01 for decimals if needed
            />
          </div>
        </div>
        <DialogFooter>
          {/* Use DialogClose for the Cancel button if allowed */}
          <Button type="button" variant="secondary" onClick={handleCancelClick}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleConfirmClick}>
            Guardar Datos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeliveryDialog;
