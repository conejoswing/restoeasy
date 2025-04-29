
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface MenuItem {
  id: number;
  name: string;
  price: number;
  category: string;
  modifications?: string[];
  modificationPrices?: { [key: string]: number };
}

interface EditModificationsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  item: MenuItem | null;
  onConfirm: (updatedMods: string[], updatedPrices: { [key: string]: number }) => void;
  onCancel: () => void;
}

// Helper to format currency
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
};

const EditModificationsDialog: React.FC<EditModificationsDialogProps> = ({
  isOpen,
  onOpenChange,
  item,
  onConfirm,
  onCancel,
}) => {
  const [modifications, setModifications] = useState<string[]>([]);
  const [prices, setPrices] = useState<{ [key: string]: string }>({}); // Store prices as strings for input
  const [newModification, setNewModification] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (item && isOpen) {
      const currentMods = item.modifications ?? [];
      const currentPrices = item.modificationPrices ?? {};
      setModifications(currentMods);
      // Convert numeric prices back to strings for the input fields
      const stringPrices = Object.entries(currentPrices).reduce((acc, [key, value]) => {
        acc[key] = value.toString();
        return acc;
      }, {} as { [key: string]: string });
      setPrices(stringPrices);
    } else if (!isOpen) {
      // Reset state when dialog closes
      setModifications([]);
      setPrices({});
      setNewModification('');
      setNewPrice('');
    }
  }, [item, isOpen]);

  const handleModificationNameChange = (index: number, newName: string) => {
    const oldName = modifications[index];
    const updatedMods = [...modifications];
    updatedMods[index] = newName;

    // Update prices map with the new name, keeping the old price
    const updatedPrices = { ...prices };
    if (prices[oldName] !== undefined) {
      updatedPrices[newName] = prices[oldName];
      delete updatedPrices[oldName]; // Remove the old name entry
    }

    setModifications(updatedMods);
    setPrices(updatedPrices);
  };

  const handlePriceChange = (modName: string, value: string) => {
    setPrices((prev) => ({ ...prev, [modName]: value }));
  };

  const handleAddModification = () => {
    if (!newModification) {
      toast({ title: "Error", description: "El nombre de la modificación no puede estar vacío.", variant: "destructive" });
      return;
    }
    if (modifications.includes(newModification)) {
        toast({ title: "Error", description: "Esta modificación ya existe.", variant: "destructive" });
        return;
    }

    const priceValue = newPrice === '' ? '0' : newPrice; // Default price to 0 if empty
    const parsedPrice = parseInt(priceValue, 10);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      toast({ title: "Error", description: "El precio debe ser un número válido y no negativo.", variant: "destructive" });
      return;
    }

    setModifications((prev) => [...prev, newModification]);
    setPrices((prev) => ({ ...prev, [newModification]: priceValue })); // Store as string
    setNewModification('');
    setNewPrice('');
  };

  const handleRemoveModification = (indexToRemove: number) => {
    const modToRemove = modifications[indexToRemove];
    setModifications((prev) => prev.filter((_, index) => index !== indexToRemove));
    setPrices((prev) => {
      const newPrices = { ...prev };
      delete newPrices[modToRemove];
      return newPrices;
    });
  };

  const handleConfirmClick = () => {
    // Validate all prices before confirming
    const numericPrices: { [key: string]: number } = {};
    for (const mod of modifications) {
      const priceStr = prices[mod] ?? '0';
      const priceNum = parseInt(priceStr, 10);
      if (isNaN(priceNum) || priceNum < 0) {
        toast({ title: "Error", description: `Precio inválido para "${mod}". Debe ser un número no negativo.`, variant: "destructive" });
        return; // Stop confirmation if any price is invalid
      }
      numericPrices[mod] = priceNum;
    }
    onConfirm(modifications, numericPrices); // Pass validated numeric prices
  };

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Modificaciones para {item.name}</DialogTitle>
          <DialogDescription>
            Añada, elimine o modifique las opciones y sus precios adicionales. Deje el precio en 0 si no hay costo adicional.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[400px] p-1">
          <div className="grid gap-4 py-4 px-3">
            {modifications.length === 0 && (
                <p className="text-sm text-muted-foreground text-center">No hay modificaciones definidas.</p>
            )}
            {modifications.map((mod, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={mod}
                  onChange={(e) => handleModificationNameChange(index, e.target.value)}
                  placeholder="Nombre Modificación"
                  className="flex-grow"
                />
                <div className="flex items-center">
                  <span className="text-sm text-muted-foreground mr-1">+</span>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={prices[mod] ?? ''}
                    onChange={(e) => handlePriceChange(mod, e.target.value)}
                    placeholder="Precio"
                    className="w-24" // Adjust width as needed
                  />
                   <span className="text-sm text-muted-foreground ml-1">CLP</span>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => handleRemoveModification(index)}
                  title="Eliminar"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
        <Separator className="my-4" />
         <div className="px-3">
            <Label className="text-sm font-medium mb-2 block">Añadir Nueva Modificación</Label>
            <div className="flex items-center gap-2">
                 <Input
                    value={newModification}
                    onChange={(e) => setNewModification(e.target.value)}
                    placeholder="Nombre Nueva Modificación"
                    className="flex-grow"
                />
                 <div className="flex items-center">
                  <span className="text-sm text-muted-foreground mr-1">+</span>
                   <Input
                        type="number"
                        min="0"
                        step="1"
                        value={newPrice}
                        onChange={(e) => setNewPrice(e.target.value)}
                        placeholder="Precio (CLP)"
                        className="w-28" // Adjust width
                    />
                 </div>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    onClick={handleAddModification}
                    title="Añadir"
                    disabled={!newModification} // Disable if name is empty
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </div>
         </div>

        <DialogFooter className='mt-6'>
          <DialogClose asChild>
            <Button type="button" variant="secondary" onClick={onCancel}>
              Cancelar
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleConfirmClick}>
            Guardar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditModificationsDialog;
