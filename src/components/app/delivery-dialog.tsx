
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

// Define the structure for delivery information
export interface DeliveryInfo {
  name: string;
  address: string;
  phone: string;
  deliveryFee: number;
}

// Define the props for the DeliveryDialog component
interface DeliveryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: DeliveryInfo | null; // Optional initial data for editing
  onConfirm: (info: DeliveryInfo) => void; // Callback with collected info
  onCancel: () => void; // Callback for cancellation
}

// Storage key for the last used delivery info - REMOVED as per new requirement
// const DELIVERY_INFO_STORAGE_KEY = 'lastDeliveryInfo';

/**
 * DeliveryDialog: A modal dialog component for collecting delivery information.
 * It allows users to input their name, address, phone number, and delivery fee.
 */
const DeliveryDialog: React.FC<DeliveryDialogProps> = ({
  isOpen,
  onOpenChange,
  initialData,
  onConfirm,
  onCancel,
}) => {
  // State variables for form inputs
  const [name, setName] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [deliveryFee, setDeliveryFee] = React.useState('');
  const { toast } = useToast();

   // Load initial data or last used data when dialog opens
   React.useEffect(() => {
     if (isOpen) {
        // Prioritize initialData if provided (for editing existing order)
        if (initialData) {
             setName(initialData.name);
             setAddress(initialData.address);
             setPhone(initialData.phone);
             setDeliveryFee(initialData.deliveryFee.toString());
              console.log("DeliveryDialog: Loaded initialData for editing.");
        } else {
            // If no initial data, clear form. No longer loading from localStorage.
            setName('');
            setAddress('');
            setPhone('');
            setDeliveryFee('');
            console.log("DeliveryDialog: No initial data. Form cleared for new entry.");
        }
     }
   }, [isOpen, initialData]);


  /**
   * handleConfirmClick: Handles the confirm button click event.
   * It validates the form data and triggers the onConfirm callback if data is valid.
   */
  const handleConfirmClick = () => {
    // Validate form fields
    if (!name || !address || !phone || !deliveryFee) {
      toast({
        title: 'Error',
        description: 'Por favor, rellene todos los campos de envío.',
        variant: 'destructive',
      });
      return;
    }
    const fee = parseFloat(deliveryFee);
    if (isNaN(fee) || fee < 0) {
      toast({
        title: 'Error',
        description: 'El costo de envío debe ser un número válido y no negativo.',
        variant: 'destructive',
      });
      return;
    }

    const collectedInfo: DeliveryInfo = {
        name: name.trim(),
        address: address.trim(),
        phone: phone.trim(),
        deliveryFee: fee,
    };

    // Pass collected info back to the parent component
    onConfirm(collectedInfo);
  };


  const handleCancelClick = () => {
    onCancel(); // Call parent cancel logic
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
