



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
  ingredients?: string[]; // Keep ingredients on MenuItem for display purposes
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

  // Filter out specific modifications based on category and item name
    const availableModifications = item.modifications?.filter(mod => {
        const standardMods = ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'];
        const dinamicoMods = ['con americana', 'sin americana', 'con chucrut', 'sin chucrut', 'con palta', 'sin palta']; // Corrected 'chockut' to 'chucrut'
        const chacareroAsMods = ['con tomate', 'sin tomate', 'con aji oro', 'sin aji oro', 'con poroto verde', 'sin poroto verde', 'con aji jalapeño', 'sin aji jalapeño']; // Corrected 'verve' to 'verde'
        const napolitanoAsMods = ['con queso', 'sin queso', 'con tomate', 'sin tomate', 'con oregano', 'sin oregano', 'con aceituna', 'sin aceituna'];
        const quesoChampiñonMods = ['Queso', 'Champiñon', 'Tocino'];


        // For 'Completos Vienesas' and specific item names 'Dinamico Normal' or 'Dinamico Grande'
        if (item.category === 'Completos Vienesas' && (item.name === 'Dinamico Normal' || item.name === 'Dinamico Grande')) {
            const allowedDinamicoVienesaMods = [...standardMods, ...dinamicoMods];
            return allowedDinamicoVienesaMods.includes(mod);
        }
        // For 'Completos As' and specific item names 'Dinamico Normal' or 'Dinamico Grande'
        else if (item.category === 'Completos As' && (item.name === 'Dinamico Normal' || item.name === 'Dinamico Grande')) {
            const allowedDinamicoAsMods = [...standardMods, ...dinamicoMods];
            return allowedDinamicoAsMods.includes(mod);
        }
        // For 'Completos As' and specific item names 'Chacarero Normal' or 'Chacarero Grande'
        else if (item.category === 'Completos As' && (item.name === 'Chacarero Normal' || item.name === 'Chacarero Grande')) {
            const allowedChacareroAsMods = [...standardMods, ...chacareroAsMods];
            return allowedChacareroAsMods.includes(mod);
        }
         // For 'Completos As' and specific item names 'Napolitano Normal' or 'Napolitano Grande'
        else if (item.category === 'Completos As' && (item.name === 'Napolitano Normal' || item.name === 'Napolitano Grande')) {
            const allowedNapolitanoAsMods = [...standardMods, ...napolitanoAsMods];
            return allowedNapolitanoAsMods.includes(mod);
        }
        // For 'Completos As' and specific item names 'Queso Champiñon Normal' or 'Queso Champiñon Grande'
        else if (item.category === 'Completos As' && (item.name.includes('Queso Champiñon'))) {
            const allowedQuesoChampiñonMods = [...standardMods, ...quesoChampiñonMods];
            return allowedQuesoChampiñonMods.includes(mod);
        }
        // Standard filter for other Completos Vienesas (excluding dynamic ones)
        else if (item.category === 'Completos Vienesas') {
           return standardMods.includes(mod);
        }
         // Standard mods for most other categories that allow them
        else if (['Completos As', 'Fajitas', 'Promo Churrasco', 'Promo Mechada', 'Promociones'].includes(item.category)) { // Removed Hamburguesas and Churrascos
            return standardMods.includes(mod);
        }
         // Specific empty mods for Hamburguesas and Churrascos (as per previous requests to remove specific ingredients from mods)
        else if (['Hamburguesas', 'Churrascos'].includes(item.category)) {
             // For Big Cami, allow all standard mods
            if (item.name === 'Big Cami' || item.name === 'Super Big Cami' || item.name === 'Italiana' || item.name === 'Doble Italiana') { // Added Italiana and Doble Italiana
                return standardMods.includes(mod);
            }
            // For other Hamburguesas (like 'Doble') and Churrascos, only standard mods
            return standardMods.includes(mod);
        }


        // Categories without modifications
        if (['Papas Fritas', 'Bebidas', 'Colaciones'].includes(item.category)) {
            return false;
        }

        return true; // Include by default if not explicitly excluded
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
                 <p className="text-sm text-muted-foreground">No hay modificaciones disponibles para este producto.</p>
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




