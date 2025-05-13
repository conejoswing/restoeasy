

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
import { Textarea } from '@/components/ui/textarea'; // Import Textarea

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
  onConfirm: (modifications: string[] | undefined, observation?: string) => void; // Callback with selected modifications array and observation
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
  const [observation, setObservation] = React.useState<string>(''); // State for observation

  // Reset selection when dialog opens or item changes
  React.useEffect(() => {
    if (isOpen) {
      setSelectedModifications([]); // Start with no modifications selected
      setObservation(''); // Reset observation
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
    // Pass the array of selected modifications, or undefined if empty, and the observation
    onConfirm(selectedModifications.length > 0 ? selectedModifications : undefined, observation.trim() || undefined);
  };

  const handleCancel = () => {
    onCancel(); // Call the cancel callback provided by the parent
    onOpenChange(false); // Close the dialog
  };

  if (!item) return null;

  // Filter out specific modifications based on category and item name
    const availableModifications = item.modifications?.filter(mod => {
        const standardMods = ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'];
        const dinamicoVienesaRestrictedOptions = ['sin americana', 'sin chucrut', 'sin palta'];
        const dinamicoAsRestrictedOptions = ['sin americana', 'sin chucrut', 'sin palta'];
        const chacareroAsSpecificIngredientMods = ['sin tomate', 'sin aji oro', 'sin poroto verde', 'sin aji jalapeño'];
        const napolitanoAsRestrictedOptions = ['sin queso', 'sin tomate', 'sin oregano', 'sin aceituna'];
        const quesoChampiñonAsMods = ['Sin Queso', 'Sin Champiñon', 'Sin Tocino'];
        const promoChacareroMods = ['sin tomate', 'sin aji oro', 'sin poroto verde', 'sin aji jalapeño'];
        const promoMechadaDinamicoOptions = ['sin americana', 'sin chucrut', 'sin palta', 'Papa Personal'];
        
        const chorrillanaMods = ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'Quitar Huevos', 'Agregado Huevos', 'Agregado Tocino', 'Agregado Cheddar'];

        // Specific list for Primavera in Promo Fajitas
        const primaveraPromoFajitasMods = ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'Pollo', 'Lomito', 'Vacuno'];
        const modsToRemoveFromFajitas = ['tocino', 'lechuga', 'palta', 'queso cheddar', 'cebolla', 'tomate', 'poroto verde', 'queso amarillo', 'choclo', 'cebolla caramelizada', 'champiñón', 'papas hilo', 'aceituna'];


        if (item.category === 'Completos Vienesas' && (item.name === 'Dinamico Grande' || item.name === 'Dinamico Normal')) {
            const allowedMods = [...standardMods, ...dinamicoVienesaRestrictedOptions];
            return allowedMods.includes(mod);
        }
        else if (item.category === 'Completos As' && (item.name === 'Dinamico Grande' || item.name === 'Dinamico Normal')) {
            const allowedMods = [...standardMods, ...dinamicoAsRestrictedOptions];
            return allowedMods.includes(mod);
        }
        else if (item.category === 'Completos As' && (item.name === 'Chacarero Normal' || item.name === 'Chacarero Grande')) {
            const allowedChacareroMods = [...standardMods, ...chacareroAsSpecificIngredientMods];
            return allowedChacareroMods.includes(mod);
        }
        else if (item.category === 'Completos As' && (item.name === 'Napolitano Normal' || item.name === 'Napolitano Grande')) {
            const allowedMods = [...standardMods, ...napolitanoAsRestrictedOptions];
            return allowedMods.includes(mod);
        }
        else if (item.category === 'Completos As' && (item.name.includes('Queso Champiñon Normal') || item.name.includes('Queso Champiñon Grande'))) {
            const allowedQuesoChampiñonMods = [...standardMods, ...quesoChampiñonAsMods];
            return allowedQuesoChampiñonMods.includes(mod);
        }
        else if (item.category === 'Promo Churrasco' && item.name === 'Chacarero') {
             const allowedPromoChacareroMods = [...standardMods, ...promoChacareroMods];
            return allowedPromoChacareroMods.includes(mod);
        }
        else if (item.category === 'Promo Mechada' && item.name === 'Dinamico') {
             const allowedPromoMechadaDinamicoMods = [...standardMods, ...promoMechadaDinamicoOptions];
            return allowedPromoMechadaDinamicoMods.includes(mod);
        }
        else if (item.category === 'Completos Vienesas') {
           return standardMods.includes(mod);
        }
        else if (['Completos As', 'Promo Churrasco', 'Promo Mechada', 'Promociones', 'Promo Hamburguesas', 'Churrascos'].includes(item.category)) {
            return standardMods.includes(mod);
        }
        
        if (item.category === 'Papas Fritas' && (item.name === 'Chorrillana 2' || item.name === 'Chorrillana 4')) {
            return chorrillanaMods.includes(mod);
        }
        
        if (item.category === 'Promo Fajitas' && item.name === 'Primavera') {
             return primaveraPromoFajitasMods.filter(m => !modsToRemoveFromFajitas.includes(m)).includes(mod);
        }
        else if (item.category === 'Promo Fajitas' && (item.name === '4 Ingredientes' || item.name === '6 Ingredientes' || item.name === 'Americana' || item.name === 'Brasileño' || item.name === 'Chacarero' || item.name === 'Golosasa' || item.name === 'Italiana')) {
            // Use the standardMods for these fajita items, or specific ones if defined
            const fajitaSpecificBaseMods = ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'Pollo', 'Lomito', 'Vacuno'];
            if (item.name === '4 Ingredientes' || item.name === '6 Ingredientes') {
                 const fourOrSixIngMods = ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'Pollo', 'Lomito', 'Vacuno', ...additionalIngredientMods];
                 return fourOrSixIngMods.filter(m => !['lechuga'].includes(m)).includes(mod);
            }
             if (item.name === 'Golosasa') {
                return fajitaSpecificBaseMods.filter(m => !modsToRemoveFromFajitas.includes(m)).includes(mod);
            }
             if (item.name === 'Italiana') {
                return italianaFajitaModifications.filter(m => !modsToRemoveFromFajitas.includes(m)).includes(mod);
            }
             if (item.name === 'Americana' || item.name === 'Brasileño' || item.name === 'Chacarero') {
                return fajitaSpecificBaseMods.filter(m => !modsToRemoveFromFajitas.includes(m)).includes(mod);
            }

            return fajitaSpecificBaseMods.filter(m => !modsToRemoveFromFajitas.includes(m)).includes(mod);
        }


        if (item.category === 'Papas Fritas' && !['Chorrillana 2', 'Chorrillana 4'].includes(item.name)) {
            return false;
        }
        if (['Bebidas', 'Colaciones'].includes(item.category)) {
            return false;
        }

        return true;
  }) ?? [];


  // Calculate total additional cost for selected modifications
  const totalModificationCost = selectedModifications.reduce((acc, mod) => {
    return acc + (item.modificationPrices?.[mod] ?? 0);
  }, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md"> {/* Increased width slightly */}
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
        <ScrollArea className="max-h-[calc(70vh-200px)] p-1"> {/* Adjusted max-h for textarea */}
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
            <div className="mt-4">
              <Label htmlFor="observation" className="block text-sm font-medium mb-1">
                Observaciones Adicionales
              </Label>
              <Textarea
                id="observation"
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                placeholder="Ej: Sin cebolla, bien cocido..."
                className="min-h-[80px]"
              />
            </div>
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

