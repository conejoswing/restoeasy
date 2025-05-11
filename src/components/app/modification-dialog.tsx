

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
        const dinamicoVienesaRestrictedOptions = ['sin americana', 'sin chucrut', 'sin palta']; // For Completos Vienesas Dinamico
        const dinamicoAsRestrictedOptions = ['sin americana', 'sin chucrut', 'sin palta']; // For Completos As Dinamico
        const chacareroAsSpecificIngredientMods = ['sin tomate', 'sin aji oro', 'sin poroto verde', 'sin aji jalapeño']; // For Completos As Chacarero
        const napolitanoAsRestrictedOptions = ['sin queso', 'sin tomate', 'sin oregano', 'sin aceituna']; // For Completos As Napolitano
        const quesoChampiñonAsMods = ['Sin Queso', 'Sin Champiñon', 'Sin Tocino']; // For Completos As Queso Champiñon
        const promoChacareroMods = ['con tomate', 'sin tomate', 'con aji oro', 'sin aji oro', 'con poroto verde', 'sin poroto verde', 'con aji jalapeño', 'sin aji jalapeño']; // For Promo Churrasco Chacarero
        const promoMechadaDinamicoOptions = ['con americana', 'sin americana', 'con chucrut', 'sin chucrut', 'con palta', 'sin palta', 'Papa Personal']; // For Promo Mechada Dinamico

        const promoFajitasSelectableProteinAndLettuce = ['Pollo', 'Lomito', 'Vacuno', 'Lechuga'];
        const promoFajitasAdditionalToppings = [
            'tocino', 'palta', 'queso cheddar', 'cebolla', 'tomate', 'poroto verde',
            'queso amarillo', 'aceituna', 'choclo', 'cebolla caramelizada', 'champiñón', 'papas hilo'
        ];


        // Note: 'Pollo', 'Lomito', 'Vacuno', 'Lechuga' and other fajita toppings are assumed to be part of item.modifications for Promo Fajitas in mockMenu.
        // The filter here primarily ensures that only those defined in item.modifications are shown, and applies further specific exclusions if necessary.

        const chorrillanaMods = ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'Quitar Huevos', 'Agregado Huevos', 'Agregado Tocino', 'Agregado Cheddar'];

        if (item.category === 'Promo Fajitas') {
            // Allow standard mayo/queso mods, protein choices, and additional toppings
            const allowedPromoFajitaMods = [
                ...standardMods,
                ...promoFajitasSelectableProteinAndLettuce,
                ...promoFajitasAdditionalToppings
            ];
            return allowedPromoFajitaMods.includes(mod);
        }


        // For 'Completos Vienesas' and specific item names 'Dinamico Grande' or 'Dinamico Normal'
        if (item.category === 'Completos Vienesas' && (item.name === 'Dinamico Grande' || item.name === 'Dinamico Normal')) {
            const allowedMods = [...standardMods, ...dinamicoVienesaRestrictedOptions];
            return allowedMods.includes(mod);
        }
        // For 'Completos As' and item name 'Dinamico Normal' or 'Dinamico Grande'
        else if (item.category === 'Completos As' && (item.name === 'Dinamico Grande' || item.name === 'Dinamico Normal')) {
            const allowedMods = [...standardMods, ...dinamicoAsRestrictedOptions];
            return allowedMods.includes(mod);
        }
        // For 'Completos As' and item name 'Chacarero Normal' or 'Chacarero Grande'
        else if (item.category === 'Completos As' && (item.name === 'Chacarero Normal' || item.name === 'Chacarero Grande')) {
            const allowedChacareroMods = [...standardMods, ...chacareroAsSpecificIngredientMods];
            return allowedChacareroMods.includes(mod);
        }
        // For 'Completos As' and specific item names 'Napolitano Normal' or 'Napolitano Grande'
        else if (item.category === 'Completos As' && (item.name === 'Napolitano Normal' || item.name === 'Napolitano Grande')) {
            const allowedMods = [...standardMods, ...napolitanoAsRestrictedOptions];
            return allowedMods.includes(mod);
        }
        // For 'Completos As' and specific item names 'Queso Champiñon Normal' or 'Queso Champiñon Grande'
        else if (item.category === 'Completos As' && (item.name.includes('Queso Champiñon'))) {
            const allowedQuesoChampiñonMods = [...standardMods, ...quesoChampiñonAsMods];
            return allowedQuesoChampiñonMods.includes(mod);
        }
         // For 'Promo Churrasco' and item name 'Chacarero'
        else if (item.category === 'Promo Churrasco' && item.name === 'Chacarero') {
             const allowedPromoChacareroMods = [...standardMods, ...promoChacareroMods];
            return allowedPromoChacareroMods.includes(mod);
        }
        // For 'Promo Mechada' and item name 'Dinamico'
        else if (item.category === 'Promo Mechada' && item.name === 'Dinamico') {
             const allowedPromoMechadaDinamicoMods = [...standardMods, ...promoMechadaDinamicoOptions];
            return allowedPromoMechadaDinamicoMods.includes(mod);
        }
        // Standard filter for other Completos Vienesas (excluding dynamic ones)
        else if (item.category === 'Completos Vienesas') {
           return standardMods.includes(mod);
        }
         // Standard mods for other categories like Completos As (not specifically handled above), Promo Churrasco (not Chacarero), etc.
        else if (['Completos As', 'Promo Churrasco', 'Promo Mechada', 'Promociones'].includes(item.category)) {
            return standardMods.includes(mod);
        }
         // Promo Hamburguesas and Churrascos also default to standardMods if not more specific
        else if (['Promo Hamburguesas', 'Churrascos'].includes(item.category)) {
            return standardMods.includes(mod);
        }

        // Specific modifications for Chorrillana 2 and Chorrillana 4
        if (item.category === 'Papas Fritas' && (item.name === 'Chorrillana 2' || item.name === 'Chorrillana 4')) {
            return chorrillanaMods.includes(mod);
        }

        // Categories without modifications (unless specifically handled above, like Chorrillanas)
        if (item.category === 'Papas Fritas' && !['Chorrillana 2', 'Chorrillana 4'].includes(item.name)) {
            return false;
        }
        if (['Bebidas', 'Colaciones'].includes(item.category)) {
            return false;
        }

        // If we reach here, it means the mod is in item.modifications and no specific category rule above excluded it.
        // This ensures that if a mod was added to item.modifications in mockMenu, it's allowed unless a rule here says no.
        return true;
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
