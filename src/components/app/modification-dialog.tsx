
import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox'; // Import Checkbox
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MenuItem {
  id: number;
  name: string;
  price: number;
  category: string;
  modifications?: string[];
  modificationPrices?: { [key: string]: number }; // Optional map of modification name to additional price
}

interface ModificationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  item: MenuItem | null; // Item to modify
  onConfirm: (modifications: string[] | undefined) => void; // Callback with selected modifications array
  onCancel: () => void; // Callback for cancellation
}

// Helper to format currency
const formatCurrency = (amount: number) => {
    // Format as CLP with no decimals
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
};

const ModificationDialog: React.FC<ModificationDialogProps> = ({
  isOpen,
  onOpenChange,
  item,
  onConfirm,
  onCancel,
}) => {
  // State to hold an array of selected modifications
  const [selectedModifications, setSelectedModifications] = React.useState<string[]>([]);

  // Reset selection when dialog opens or item changes
  React.useEffect(() => {
    if (isOpen) {
      setSelectedModifications([]); // Start with no modifications selected
    }
  }, [isOpen]);

  const handleCheckboxChange = (modification: string, checked: boolean) => {
    setSelectedModifications((prev) =>
      checked
        ? [...prev, modification] // Add modification if checked
        : prev.filter((mod) => mod !== modification) // Remove modification if unchecked
    );
  };

  const handleConfirm = () => {
    // Pass the array of selected modifications, or undefined if empty
    onConfirm(selectedModifications.length > 0 ? selectedModifications : undefined);
  };

  const handleCancel = () => {
    onCancel(); // Call the cancel callback provided by the parent
    onOpenChange(false); // Close the dialog
  };

  if (!item) return null;

  // Filter out specific modifications based on category
  const availableModifications = item.modifications?.filter(mod => {
    // Exclude 'Porotos Verdes' for specific categories
    if (['Completos As', 'Promo Churrasco', 'Promo Mechada', 'Fajitas'].includes(item.category) && mod === 'Porotos Verdes') {
      return false;
    }
    // Exclude 'Palta' and 'Tomate' for 'Hamburguesas' category
    if (item.category === 'Hamburguesas' && (mod === 'Palta' || mod === 'Tomate')) {
      return false;
    }
    // Exclude 'Queso Fundido', 'Huevo Frito', 'Cebolla Frita', 'Palta', 'Tomate' for 'Churrascos' category
    if (item.category === 'Churrascos' && ['Queso Fundido', 'Huevo Frito', 'Cebolla Frita', 'Jamón', 'Orégano', 'Salsa Verde', 'Champiñones Salteados', 'Papas Fritas', 'Palta', 'Tomate'].includes(mod)) {
        return false;
    }
    return true; // Include all other modifications
  }) ?? [];


  // Calculate total additional cost for selected modifications
  const totalModificationCost = selectedModifications.reduce((acc, mod) => {
    return acc + (item.modificationPrices?.[mod] ?? 0);
  }, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Seleccionar Modificaciones para {item.name}</DialogTitle>
          <DialogDescription>
            Elige las opciones deseadas para este artículo. Precio Base: {formatCurrency(item.price)}
            {selectedModifications.length > 0 && (
              <span className="block mt-1">
                Costo Adicional: +{formatCurrency(totalModificationCost)} (Total: {formatCurrency(item.price + totalModificationCost)})
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[300px] p-1">
          <div className="grid gap-4 py-4 px-3">
            {!availableModifications || availableModifications.length === 0 ? (
                 <p className="text-sm text-muted-foreground">No hay modificaciones disponibles.</p>
            ) : (
                availableModifications.map((mod) => { // Use the filtered list
                const modificationCost = item.modificationPrices?.[mod];
                const costString = modificationCost ? ` (+ ${formatCurrency(modificationCost)})` : '';
                const checkboxId = `mod-${mod.replace(/\s+/g, '-')}`;
                return (
                    <div key={mod} className="flex items-center space-x-2">
                    <Checkbox
                        id={checkboxId}
                        checked={selectedModifications.includes(mod)}
                        onCheckedChange={(checked) => handleCheckboxChange(mod, !!checked)}
                    />
                    <Label htmlFor={checkboxId} className="flex-grow cursor-pointer">
                        {mod}
                        <span className="text-muted-foreground text-xs ml-1">{costString}</span>
                    </Label>
                    </div>
                );
                })
            )}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleConfirm}>
            Añadir al Pedido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ModificationDialog;
