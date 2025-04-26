
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
import { ScrollArea } from '@/components/ui/scroll-area'; // Added for long modification lists

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
  onConfirm: (modification: string | undefined) => void; // Callback with selected modification
  onCancel: () => void; // Callback for cancellation
}

const ModificationDialog: React.FC<ModificationDialogProps> = ({
  isOpen,
  onOpenChange,
  item,
  onConfirm,
  onCancel,
}) => {
  const [selectedModification, setSelectedModification] = React.useState<string | undefined>(undefined);

  // Reset selection when dialog opens or item changes
  React.useEffect(() => {
    if (isOpen && item?.modifications?.length) {
      // Optionally set a default, e.g., the first modification or 'Ninguno' if applicable
      // setSelectedModification(item.modifications[0]);
       setSelectedModification(undefined); // Start with nothing selected
    } else {
        setSelectedModification(undefined);
    }
  }, [isOpen, item]);


  const handleConfirm = () => {
    onConfirm(selectedModification);
    // Optional: Add a check if a modification is required before confirming
    // if (!selectedModification && item?.modifications?.length) {
    //    // Show some error or prevent closing
    //    console.log("Please select a modification");
    //    return;
    // }
  };

   const handleCancel = () => {
        onCancel(); // Call the cancel callback provided by the parent
        onOpenChange(false); // Close the dialog
    }


  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Seleccionar Modificación para {item.name}</DialogTitle>
          <DialogDescription>
            Elige una opción para este artículo. Precio Base: ${item.price.toFixed(2)}
            {/* Add note about potential price changes here if applicable */}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[300px] p-1"> {/* Added ScrollArea */}
            <RadioGroup
              value={selectedModification}
              onValueChange={setSelectedModification}
              className="grid gap-4 py-4 px-3" // Added padding inside scroll area
            >
              {/* Optionally add a "None" or default option */}
               <div className="flex items-center space-x-2">
                  <RadioGroupItem value={undefined as any} id="mod-ninguno" checked={selectedModification === undefined} /> {/* Handle undefined value */}
                  <Label htmlFor="mod-ninguno">Ninguno / Por defecto</Label>
              </div>
              {item.modifications?.map((mod) => {
                 const modificationCost = item.modificationPrices?.[mod];
                 const costString = modificationCost ? ` (+ $${modificationCost.toFixed(2)})` : '';
                 return (
                    <div key={mod} className="flex items-center space-x-2">
                      <RadioGroupItem value={mod} id={`mod-${mod.replace(/\s+/g, '-')}`} />
                      <Label htmlFor={`mod-${mod.replace(/\s+/g, '-')}`}>
                        {mod}
                        <span className="text-muted-foreground text-xs">{costString}</span>
                      </Label>
                    </div>
                 );
              })}
            </RadioGroup>
        </ScrollArea>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={handleCancel}> {/* Use handleCancel */}
            Cancelar
          </Button>
          <Button type="button" onClick={handleConfirm}>
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ModificationDialog;
