
'use client';

import * as React from 'react';
import {
  Table,
  TableBody, 
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'; // Changed import path
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge'; 
import {
  Dialog as ShadDialog, // Renamed to avoid conflict
  DialogClose as ShadDialogClose, // Renamed
  DialogContent as ShadDialogContent, // Renamed
  DialogDescription as ShadDialogDescription, // Renamed
  DialogFooter as ShadDialogFooter, // Renamed
  DialogHeader as ShadDialogHeader, // Renamed
  DialogTitle as ShadDialogTitle, // Renamed
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useState, useEffect, useMemo } from 'react'; 
import { Edit, PlusCircle, Trash2, ListPlus, Tags, Pencil, ListChecks, Save } from 'lucide-react'; // Added Save icon
import { useToast } from '@/hooks/use-toast';
import { formatCurrency as printUtilsFormatCurrency } from '@/lib/printUtils';
import { Button } from '@/components/ui/button';
import type { MenuItem } from '@/types/menu';
import { loadMenuData, MENU_STORAGE_KEY, sortMenu, orderedCategories } from '@/lib/menuUtils';

interface ModificationWithNameAndPrice {
  name: string;
  price: string; // Keep as string for input, parse on save
}

const ProductsManagementPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [isMenuInitialized, setIsMenuInitialized] = useState(false);

  const [isEditPriceDialogOpen, setIsEditPriceDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<MenuItem | null>(null);
  const [newPrice, setNewPrice] = useState('');

  const [isEditIngredientsDialogOpen, setIsEditIngredientsDialogOpen] = useState(false);
  const [editingIngredientsProduct, setEditingIngredientsProduct] = useState<MenuItem | null>(null);
  const [currentIngredients, setCurrentIngredients] = useState<string[]>([]);
  const [newIngredient, setNewIngredient] = useState('');

  const [isEditCategoryDialogOpen, setIsEditCategoryDialogOpen] = useState(false);
  const [editingCategoryProduct, setEditingCategoryProduct] = useState<MenuItem | null>(null);
  const [newCategory, setNewCategory] = useState('');

  const [isEditProductNameDialogOpen, setIsEditProductNameDialogOpen] = useState(false);
  const [editingProductNameProduct, setEditingProductNameProduct] = useState<MenuItem | null>(null);
  const [newProductName, setNewProductName] = useState('');

  const [isEditBaseModificationsDialogOpen, setIsEditBaseModificationsDialogOpen] = useState(false);
  const [editingBaseModificationsProduct, setEditingBaseModificationsProduct] = useState<MenuItem | null>(null);
  const [currentBaseModifications, setCurrentBaseModifications] = useState<ModificationWithNameAndPrice[]>([]);
  const [newBaseModification, setNewBaseModification] = useState<ModificationWithNameAndPrice>({ name: '', price: '' });


  const { toast } = useToast();

  useEffect(() => {
    const loadedMenu = loadMenuData();
    setMenu(loadedMenu);
    setIsMenuInitialized(true);
  }, []);

  // Effect to listen for menu updates from other components (e.g., table detail page saving changes)
  useEffect(() => {
    const handleMenuUpdate = () => {
      console.log('ProductsManagementPage: Detected menu update. Reloading menu data.');
      setMenu(loadMenuData());
    };

    window.addEventListener('menuUpdated', handleMenuUpdate);

    return () => {
      window.removeEventListener('menuUpdated', handleMenuUpdate);
    };
  }, []);


  const handleSaveChanges = () => {
    if (!isMenuInitialized) {
      toast({ title: "Error", description: "El menú aún no se ha inicializado.", variant: "destructive" });
      return;
    }
    try {
      localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(menu));
      toast({ title: "Cambios Guardados", description: "Los cambios en el menú se han guardado exitosamente." });
      window.dispatchEvent(new CustomEvent('menuUpdated')); // Dispatch event after saving
    } catch (e) {
      console.error("Error saving menu to localStorage:", e);
      toast({ title: "Error al Guardar", description: "No se pudieron guardar los cambios en el menú.", variant: "destructive" });
    }
  };


  const filteredProducts = menu.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openEditPriceDialog = (product: MenuItem) => {
    setEditingProduct(product);
    setNewPrice(product.price.toString());
    setIsEditPriceDialogOpen(true);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewPrice(e.target.value);
  };

  const handleUpdatePrice = () => {
    if (!editingProduct || newPrice === '') {
      toast({ title: "Error", description: "Debe ingresar un precio.", variant: "destructive"});
      return;
    }
    const priceValue = parseInt(newPrice, 10);
    if (isNaN(priceValue) || priceValue < 0) {
      toast({ title: "Error", description: "El precio debe ser un número válido y no negativo.", variant: "destructive"});
      return;
    }

    setMenu(prevMenu => {
      const updatedMenu = prevMenu.map(item =>
        item.id === editingProduct.id ? { ...item, price: priceValue } : item
      );
      return sortMenu(updatedMenu);
    });

    const toastDescription = `El precio de ${editingProduct.name} se actualizó a ${printUtilsFormatCurrency(priceValue)}.`;
    toast({ title: "Precio Actualizado", description: toastDescription});
    setIsEditPriceDialogOpen(false);
    setEditingProduct(null);
    setNewPrice('');
  };

  const openEditIngredientsDialog = (product: MenuItem) => {
    setEditingIngredientsProduct(product);
    setCurrentIngredients(product.ingredients ? [...product.ingredients] : []);
    setNewIngredient('');
    setIsEditIngredientsDialogOpen(true);
  };

  const handleIngredientTextChange = (index: number, value: string) => {
    const updatedIngredients = [...currentIngredients];
    updatedIngredients[index] = value;
    setCurrentIngredients(updatedIngredients);
  };

  const handleAddNewIngredientField = () => {
    if (newIngredient.trim() !== '') {
        setCurrentIngredients(prev => [...prev, newIngredient.trim()]);
        setNewIngredient('');
    } else {
        // Add an empty field to allow direct editing if user clicks add without typing
        setCurrentIngredients(prev => [...prev, '']);
    }
  };

  const handleRemoveIngredient = (indexToRemove: number) => {
    setCurrentIngredients(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleUpdateIngredients = () => {
    if (!editingIngredientsProduct) return;

    const updatedIngredientsList = currentIngredients.map(ing => ing.trim()).filter(ing => ing !== '');

    setMenu(prevMenu => {
        const updatedMenu = prevMenu.map(item =>
        item.id === editingIngredientsProduct.id ? { ...item, ingredients: updatedIngredientsList } : item
      );
      return sortMenu(updatedMenu);
    });
    
    toast({ title: "Ingredientes Actualizados", description: `Los ingredientes de ${editingIngredientsProduct.name} han sido actualizados.`});
    setIsEditIngredientsDialogOpen(false);
    setEditingIngredientsProduct(null);
    setCurrentIngredients([]);
    setNewIngredient('');
  };

  const openEditCategoryDialog = (product: MenuItem) => {
    setEditingCategoryProduct(product);
    setNewCategory(product.category);
    setIsEditCategoryDialogOpen(true);
  };

  const handleUpdateCategory = () => {
    const trimmedNewCategory = newCategory.trim();
    if (!editingCategoryProduct || !trimmedNewCategory) {
      toast({ title: "Error", description: "El nombre de la categoría no puede estar vacío.", variant: "destructive"});
      return;
    }

    setMenu(prevMenu => {
      const updatedMenu = prevMenu.map(item =>
        item.id === editingCategoryProduct.id ? { ...item, category: trimmedNewCategory } : item
      );
      return sortMenu(updatedMenu);
    });

    toast({ title: "Categoría Actualizada", description: `La categoría de ${editingCategoryProduct.name} se actualizó a ${trimmedNewCategory}.`});
    setIsEditCategoryDialogOpen(false);
    setEditingCategoryProduct(null);
    setNewCategory('');
  };

  const openEditProductNameDialog = (product: MenuItem) => {
    setEditingProductNameProduct(product);
    setNewProductName(product.name);
    setIsEditProductNameDialogOpen(true);
  };

  const handleUpdateProductName = () => {
    if (!editingProductNameProduct || newProductName.trim() === '') {
      toast({ title: "Error", description: "El nombre del producto no puede estar vacío.", variant: "destructive"});
      return;
    }

    setMenu(prevMenu => {
      const updatedMenu = prevMenu.map(item =>
        item.id === editingProductNameProduct.id ? { ...item, name: newProductName.trim() } : item
      );
      return sortMenu(updatedMenu);
    });

    toast({ title: "Nombre Actualizado", description: `El nombre del producto se actualizó a "${newProductName.trim()}".`});
    setIsEditProductNameDialogOpen(false);
    setEditingProductNameProduct(null);
    setNewProductName('');
  };

  const openEditBaseModificationsDialog = (product: MenuItem) => {
    setEditingBaseModificationsProduct(product);
    const existingModifications = product.modifications || [];
    const existingPrices = product.modificationPrices || {};
    setCurrentBaseModifications(
      existingModifications.map(modName => ({
        name: modName,
        price: (existingPrices[modName] || 0).toString(),
      }))
    );
    setNewBaseModification({ name: '', price: '' });
    setIsEditBaseModificationsDialogOpen(true);
  };
  
  const handleBaseModificationNameChange = (index: number, value: string) => {
    const updatedModifications = [...currentBaseModifications];
    updatedModifications[index].name = value;
    setCurrentBaseModifications(updatedModifications);
  };

  const handleBaseModificationPriceChange = (index: number, value: string) => {
    const updatedModifications = [...currentBaseModifications];
    updatedModifications[index].price = value;
    setCurrentBaseModifications(updatedModifications);
  };
  
  const handleAddNewBaseModificationField = () => {
    if (newBaseModification.name.trim() !== '') {
      setCurrentBaseModifications(prev => [...prev, { ...newBaseModification }]);
      setNewBaseModification({ name: '', price: '' });
    } else {
      setCurrentBaseModifications(prev => [...prev, { name: '', price: '0' }]); // Add an empty field for editing
    }
  };
  
  const handleRemoveBaseModification = (indexToRemove: number) => {
    setCurrentBaseModifications(prev => prev.filter((_, index) => index !== indexToRemove));
  };
  
  const handleUpdateBaseModifications = () => {
    if (!editingBaseModificationsProduct) return;
  
    const updatedModificationsList: string[] = [];
    const updatedModificationPrices: { [key: string]: number } = {};
  
    currentBaseModifications.forEach(mod => {
      const name = mod.name.trim();
      if (name) {
        updatedModificationsList.push(name);
        const price = parseFloat(mod.price);
        updatedModificationPrices[name] = isNaN(price) || price < 0 ? 0 : price;
      }
    });
  
    setMenu(prevMenu => {
      const updatedMenu = prevMenu.map(item =>
        item.id === editingBaseModificationsProduct.id 
          ? { ...item, modifications: updatedModificationsList, modificationPrices: updatedModificationPrices } 
          : item
      );
      return sortMenu(updatedMenu);
    });
    
    toast({ title: "Modificaciones Base Actualizadas", description: `Las modificaciones base de ${editingBaseModificationsProduct.name} han sido actualizadas.`});
    setIsEditBaseModificationsDialogOpen(false);
    setEditingBaseModificationsProduct(null);
    setCurrentBaseModifications([]);
    setNewBaseModification({ name: '', price: '' });
  };


  const groupedMenu = useMemo(() => {
    const allProductCategories = Array.from(new Set(filteredProducts.map(item => item.category)));
    
    const sortedCategoryNames = allProductCategories.sort((a, b) => {
        const indexA = orderedCategories.indexOf(a);
        const indexB = orderedCategories.indexOf(b);

        if (indexA !== -1 && indexB !== -1) return indexA - indexB; 
        if (indexA !== -1) return -1; 
        if (indexB !== -1) return 1;  
        return a.localeCompare(b); 
    });

    const groups: { [key: string]: MenuItem[] } = {};
    filteredProducts.forEach(item => {
        if (!groups[item.category]) {
            groups[item.category] = [];
        }
        groups[item.category].push(item);
    });
    
    return sortedCategoryNames.reduce((acc, categoryName) => {
        if (groups[categoryName]) {
            acc[categoryName] = groups[categoryName];
        }
        return acc;
    }, {} as { [key: string]: MenuItem[] });
  }, [filteredProducts]);


  if (!isMenuInitialized) {
    return <div className="flex items-center justify-center min-h-screen">Cargando productos...</div>;
  }


  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Lista de Productos</h1>
         <div className="flex items-center gap-4">
            <Input
              type="text"
              placeholder="Buscar producto o categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Button onClick={handleSaveChanges}>
              <Save className="mr-2 h-4 w-4" />
              Guardar Cambios
            </Button>
         </div>
      </div>

       <Card>
         <CardContent className="p-0">
            <Table>
            <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Promo</TableHead>
                  <TableHead>Modificaciones Base</TableHead>
                  <TableHead className="text-right">Precio Base</TableHead>
                  <TableHead className="text-center w-56">Acciones</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {filteredProducts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No se encontraron productos.
                    </TableCell>
                  </TableRow>
                )}
                {Object.entries(groupedMenu).map(([category, items]) => (
                  <React.Fragment key={category}>
                    {items.map((item) => (
                    <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell><Badge variant="secondary">{item.category}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-xs overflow-hidden text-ellipsis whitespace-nowrap">
                            {item.ingredients && item.ingredients.length > 0
                            ? item.ingredients.join(', ')
                            : '-'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-xs overflow-hidden text-ellipsis whitespace-nowrap">
                            {item.modifications && item.modifications.length > 0
                            ? item.modifications.map(modName => {
                                const price = item.modificationPrices?.[modName];
                                return price && price > 0 ? `${modName} (${printUtilsFormatCurrency(price)})` : modName;
                              }).join(', ')
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right font-mono">{printUtilsFormatCurrency(item.price)}</TableCell>
                        <TableCell className="text-center">
                            <div className="flex justify-center gap-1">
                                <Button variant="outline" size="icon" onClick={() => openEditProductNameDialog(item)} className="h-8 w-8" title="Editar Nombre Producto">
                                    <Pencil className="h-4 w-4" />
                                    <span className="sr-only">Editar Nombre Producto</span>
                                </Button>
                                <Button variant="outline" size="icon" onClick={() => openEditPriceDialog(item)} className="h-8 w-8" title="Editar Precio">
                                    <Edit className="h-4 w-4" />
                                    <span className="sr-only">Editar Precio</span>
                                </Button>
                                <Button variant="outline" size="icon" onClick={() => openEditIngredientsDialog(item)} className="h-8 w-8" title="Editar Promo">
                                    <ListPlus className="h-4 w-4" />
                                    <span className="sr-only">Editar Promo</span>
                                </Button>
                                 <Button variant="outline" size="icon" onClick={() => openEditBaseModificationsDialog(item)} className="h-8 w-8" title="Editar Modificaciones Base">
                                    <ListChecks className="h-4 w-4" />
                                    <span className="sr-only">Editar Modificaciones Base</span>
                                </Button>
                                <Button variant="outline" size="icon" onClick={() => openEditCategoryDialog(item)} className="h-8 w-8" title="Editar Categoría">
                                    <Tags className="h-4 w-4" />
                                    <span className="sr-only">Editar Categoría</span>
                                </Button>
                            </div>
                        </TableCell>
                    </TableRow>
                    ))}
                  </React.Fragment>
                ))}
            </TableBody>
            </Table>
         </CardContent>
       </Card>


       {/* Edit Product Name Dialog */}
       <ShadDialog open={isEditProductNameDialogOpen} onOpenChange={setIsEditProductNameDialogOpen}>
         <ShadDialogContent className="sm:max-w-[425px]">
           <ShadDialogHeader>
             <ShadDialogTitle>Editar Nombre de {editingProductNameProduct?.name}</ShadDialogTitle>
             <ShadDialogDescription>
                 Actualice el nombre para este producto.
             </ShadDialogDescription>
           </ShadDialogHeader>
           <div className="grid gap-4 py-4">
             <div className="grid grid-cols-4 items-center gap-4">
                 <Label htmlFor="productName" className="text-right">
                     Nuevo Nombre
                 </Label>
                 <Input
                     id="productName"
                     value={newProductName}
                     onChange={(e) => setNewProductName(e.target.value)}
                     className="col-span-3"
                     required
                 />
             </div>
           </div>
           <ShadDialogFooter>
             <ShadDialogClose asChild>
                 <Button type="button" variant="secondary" onClick={() => setIsEditProductNameDialogOpen(false)}>Cancelar</Button>
             </ShadDialogClose>
             <Button type="submit" onClick={handleUpdateProductName}>Guardar Cambios</Button>
           </ShadDialogFooter>
         </ShadDialogContent>
       </ShadDialog>


       {/* Edit Price Dialog */}
       <ShadDialog open={isEditPriceDialogOpen} onOpenChange={setIsEditPriceDialogOpen}>
         <ShadDialogContent className="sm:max-w-[425px]">
           <ShadDialogHeader>
             <ShadDialogTitle>Editar Precio de {editingProduct?.name}</ShadDialogTitle>
             <ShadDialogDescription>
                 Actualice el precio base para este producto.
             </ShadDialogDescription>
           </ShadDialogHeader>
           <div className="grid gap-4 py-4">
             <div className="grid grid-cols-4 items-center gap-4">
                 <Label htmlFor="price" className="text-right">
                     Nuevo Precio (CLP)
                 </Label>
                 <Input
                     id="price"
                     type="number"
                     value={newPrice}
                     onChange={handlePriceChange}
                     className="col-span-3"
                     required
                     min="0"
                     step="1"
                 />
             </div>
           </div>
           <ShadDialogFooter>
             <ShadDialogClose asChild>
                 <Button type="button" variant="secondary" onClick={() => setIsEditPriceDialogOpen(false)}>Cancelar</Button>
             </ShadDialogClose>
             <Button type="submit" onClick={handleUpdatePrice}>Guardar Cambios</Button>
           </ShadDialogFooter>
         </ShadDialogContent>
       </ShadDialog>

      {/* Edit Ingredients Dialog */}
      <ShadDialog open={isEditIngredientsDialogOpen} onOpenChange={setIsEditIngredientsDialogOpen}>
        <ShadDialogContent className="sm:max-w-md">
            <ShadDialogHeader>
            <ShadDialogTitle>Editar Promo de {editingIngredientsProduct?.name}</ShadDialogTitle>
            <ShadDialogDescription>
                Añada, modifique o elimine ingredientes para este producto.
            </ShadDialogDescription>
            </ShadDialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                {currentIngredients.map((ingredient, index) => (
                    <div key={index} className="flex items-center gap-2">
                    <Input
                        value={ingredient}
                        onChange={(e) => handleIngredientTextChange(index, e.target.value)}
                        placeholder={`Ingrediente ${index + 1}`}
                        className="flex-grow"
                    />
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveIngredient(index)} className="text-destructive hover:text-destructive/90">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Eliminar ingrediente</span>
                    </Button>
                    </div>
                ))}
                 <div className="flex items-center gap-2 mt-2">
                     <Input
                         value={newIngredient}
                         onChange={(e) => setNewIngredient(e.target.value)}
                         placeholder="Nuevo ingrediente"
                         className="flex-grow"
                         onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddNewIngredientField();}}}
                     />
                    <Button onClick={handleAddNewIngredientField} size="icon" variant="outline">
                        <PlusCircle className="h-4 w-4" />
                        <span className="sr-only">Añadir nuevo ingrediente</span>
                    </Button>
                 </div>
            </div>
            <ShadDialogFooter>
            <ShadDialogClose asChild>
                <Button type="button" variant="secondary" onClick={() => setIsEditIngredientsDialogOpen(false)}>Cancelar</Button>
            </ShadDialogClose>
            <Button type="submit" onClick={handleUpdateIngredients}>Guardar Ingredientes</Button>
            </ShadDialogFooter>
        </ShadDialogContent>
      </ShadDialog>

      {/* Edit Category Dialog */}
      <ShadDialog open={isEditCategoryDialogOpen} onOpenChange={setIsEditCategoryDialogOpen}>
        <ShadDialogContent className="sm:max-w-[425px]">
          <ShadDialogHeader>
            <ShadDialogTitle>Editar Categoría de {editingCategoryProduct?.name}</ShadDialogTitle>
            <ShadDialogDescription>
              Ingrese el nuevo nombre de categoría para este producto.
            </ShadDialogDescription>
          </ShadDialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="newCategoryName" className="text-right">
                Categoría
              </Label>
              <Input
                id="newCategoryName"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="col-span-3"
                placeholder="Ej: Especiales de la Casa"
              />
            </div>
          </div>
          <ShadDialogFooter>
            <ShadDialogClose asChild>
              <Button type="button" variant="secondary" onClick={() => setIsEditCategoryDialogOpen(false)}>Cancelar</Button>
            </ShadDialogClose>
            <Button type="submit" onClick={handleUpdateCategory}>Guardar Cambios</Button>
          </ShadDialogFooter>
        </ShadDialogContent>
      </ShadDialog>

      {/* Edit Base Modifications Dialog */}
      <ShadDialog open={isEditBaseModificationsDialogOpen} onOpenChange={setIsEditBaseModificationsDialogOpen}>
        <ShadDialogContent className="sm:max-w-lg"> {/* Wider dialog */}
            <ShadDialogHeader>
            <ShadDialogTitle>Editar Modificaciones Base de {editingBaseModificationsProduct?.name}</ShadDialogTitle>
            <ShadDialogDescription>
                Añada, modifique o elimine las modificaciones base y sus precios para este producto.
            </ShadDialogDescription>
            </ShadDialogHeader>
            <div className="grid gap-3 py-4 max-h-[60vh] overflow-y-auto">
                {currentBaseModifications.map((mod, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <Input
                            value={mod.name}
                            onChange={(e) => handleBaseModificationNameChange(index, e.target.value)}
                            placeholder={`Nombre Modificación ${index + 1}`}
                            className="flex-grow"
                        />
                        <Input
                            type="number"
                            value={mod.price}
                            onChange={(e) => handleBaseModificationPriceChange(index, e.target.value)}
                            placeholder="Precio (CLP)"
                            className="w-28" 
                            min="0"
                            step="1"
                        />
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveBaseModification(index)} className="text-destructive hover:text-destructive/90">
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Eliminar modificación</span>
                        </Button>
                    </div>
                ))}
                 <div className="flex items-center gap-2 mt-2">
                     <Input
                         value={newBaseModification.name}
                         onChange={(e) => setNewBaseModification(prev => ({ ...prev, name: e.target.value }))}
                         placeholder="Nueva modificación"
                         className="flex-grow"
                         onKeyPress={(e) => { if (e.key === 'Enter' && newBaseModification.name.trim()) { e.preventDefault(); handleAddNewBaseModificationField();}}}
                     />
                      <Input
                         type="number"
                         value={newBaseModification.price}
                         onChange={(e) => setNewBaseModification(prev => ({ ...prev, price: e.target.value }))}
                         placeholder="Precio (CLP)"
                         className="w-28"
                         min="0"
                         step="1"
                         onKeyPress={(e) => { if (e.key === 'Enter' && newBaseModification.name.trim()) { e.preventDefault(); handleAddNewBaseModificationField();}}}
                     />
                    <Button onClick={handleAddNewBaseModificationField} size="icon" variant="outline">
                        <PlusCircle className="h-4 w-4" />
                        <span className="sr-only">Añadir nueva modificación</span>
                    </Button>
                 </div>
            </div>
            <ShadDialogFooter>
            <ShadDialogClose asChild>
                <Button type="button" variant="secondary" onClick={() => setIsEditBaseModificationsDialogOpen(false)}>Cancelar</Button>
            </ShadDialogClose>
            <Button type="submit" onClick={handleUpdateBaseModifications}>Guardar Modificaciones</Button>
            </ShadDialogFooter>
        </ShadDialogContent>
      </ShadDialog>

    </div>
);
};


const ProductsPageContent = () => {
    return <ProductsManagementPage />;
}

export default function ProductsPage() {
    return <ProductsPageContent />;
}


    
