
'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog as ShadDialog,
  DialogClose as ShadDialogClose,
  DialogContent as ShadDialogContent,
  DialogDescription as ShadDialogDescription,
  DialogFooter as ShadDialogFooter,
  DialogHeader as ShadDialogHeader,
  DialogTitle as ShadDialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState, useEffect, useMemo } from 'react';
import { Edit, PlusCircle, Trash2, ListPlus, Tags, Pencil } from 'lucide-react'; // Added Pencil
import { useToast } from '@/hooks/use-toast';
import { formatCurrency as printUtilsFormatCurrency } from '@/lib/printUtils';
import { Button } from '@/components/ui/button';
import type { MenuItem } from '@/types/menu';
import { loadMenuData, MENU_STORAGE_KEY, sortMenu, orderedCategories } from '@/lib/menuUtils';


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


  const { toast } = useToast();

  useEffect(() => {
    const loadedMenu = loadMenuData();
    setMenu(loadedMenu);
    setIsMenuInitialized(true);
  }, []);

  useEffect(() => {
    if (isMenuInitialized && menu.length > 0) {
      try {
        localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(menu));
      } catch (e) {
        console.error("Error saving menu to localStorage:", e);
        toast({title: "Error", description: "No se pudo guardar el menú.", variant: "destructive"});
      }
    }
  }, [menu, isMenuInitialized, toast]);


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
        // Optionally, allow adding an empty field to be filled in later
        setCurrentIngredients(prev => [...prev, '']);
    }
  };

  const handleRemoveIngredient = (indexToRemove: number) => {
    setCurrentIngredients(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleUpdateIngredients = () => {
    if (!editingIngredientsProduct) return;

    // Filter out empty strings and trim whitespace
    const updatedIngredientsList = currentIngredients.map(ing => ing.trim()).filter(ing => ing !== '');

    setMenu(prevMenu => {
        const updatedMenu = prevMenu.map(item =>
        item.id === editingIngredientsProduct.id ? { ...item, ingredients: updatedIngredientsList } : item
      );
      return sortMenu(updatedMenu); // Ensure menu is re-sorted
    });
    
    toast({ title: "Ingredientes Actualizados", description: `Los ingredientes de ${editingIngredientsProduct.name} han sido actualizados.`});
    setIsEditIngredientsDialogOpen(false);
    setEditingIngredientsProduct(null);
    setCurrentIngredients([]);
    setNewIngredient('');
  };

  const openEditCategoryDialog = (product: MenuItem) => {
    setEditingCategoryProduct(product);
    setNewCategory(product.category); // Set initial category
    setIsEditCategoryDialogOpen(true);
  };

  const handleCategorySelectChange = (value: string) => {
    setNewCategory(value);
  };

  const handleUpdateCategory = () => {
    if (!editingCategoryProduct || !newCategory) {
      toast({ title: "Error", description: "Debe seleccionar una categoría.", variant: "destructive"});
      return;
    }

    setMenu(prevMenu => {
      const updatedMenu = prevMenu.map(item =>
        item.id === editingCategoryProduct.id ? { ...item, category: newCategory } : item
      );
      return sortMenu(updatedMenu); // Ensure menu is re-sorted after category change
    });

    toast({ title: "Categoría Actualizada", description: `La categoría de ${editingCategoryProduct.name} se actualizó a ${newCategory}.`});
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


  // Group menu items by category, then sort categories by predefined order
  const groupedMenu = useMemo(() => {
    const groups: { [key: string]: MenuItem[] } = {};
    filteredProducts.forEach(item => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    
    // Order the groups based on orderedCategories
    return orderedCategories.reduce((acc, categoryName) => {
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
        <Input
           type="text"
           placeholder="Buscar producto o categoría..."
           value={searchTerm}
           onChange={(e) => setSearchTerm(e.target.value)}
           className="max-w-sm"
         />
      </div>

       <Card>
         <CardContent className="p-0"> {/* Remove padding from CardContent to make Table flush */}
            <Table>
            <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Ingredientes</TableHead>
                  <TableHead className="text-right">Precio Base</TableHead>
                  <TableHead className="text-center w-56">Acciones</TableHead> {/* Adjusted width for 4 icons */}
                </TableRow>
            </TableHeader>
            <TableBody>
                {filteredProducts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No se encontraron productos.
                    </TableCell>
                  </TableRow>
                )}
                {Object.entries(groupedMenu).map(([category, items]) => (
                  <React.Fragment key={category}>
                    {/* Optional: Add a category header row if desired */}
                    {/* <TableRow className="bg-muted/50">
                      <TableCell colSpan={5} className="font-semibold text-lg py-2 px-4">{category}</TableCell>
                    </TableRow> */}
                    {items.map((item) => (
                    <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell><Badge variant="secondary">{item.category}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-xs overflow-hidden text-ellipsis whitespace-nowrap">
                            {item.ingredients && item.ingredients.length > 0
                            ? item.ingredients.join(', ')
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right font-mono">{printUtilsFormatCurrency(item.price)}</TableCell>
                        <TableCell className="text-center">
                            <div className="flex justify-center gap-2">
                                <Button variant="outline" size="icon" onClick={() => openEditProductNameDialog(item)} className="h-8 w-8" title="Editar Nombre Producto">
                                    <Pencil className="h-4 w-4" />
                                    <span className="sr-only">Editar Nombre Producto</span>
                                </Button>
                                <Button variant="outline" size="icon" onClick={() => openEditPriceDialog(item)} className="h-8 w-8" title="Editar Precio">
                                    <Edit className="h-4 w-4" />
                                    <span className="sr-only">Editar Precio</span>
                                </Button>
                                <Button variant="outline" size="icon" onClick={() => openEditIngredientsDialog(item)} className="h-8 w-8" title="Editar Ingredientes">
                                    <ListPlus className="h-4 w-4" />
                                    <span className="sr-only">Editar Ingredientes</span>
                                </Button>
                                <Button variant="outline" size="icon" onClick={() => openEditCategoryDialog(item)} className="h-8 w-8" title="Editar Categoría">
                                    <Tags className="h-4 w-4" /> {/* Edit Category Icon */}
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
                     step="1" // Allow integer prices
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
        <ShadDialogContent className="sm:max-w-md"> {/* Wider for ingredients list */}
            <ShadDialogHeader>
            <ShadDialogTitle>Editar Ingredientes de {editingIngredientsProduct?.name}</ShadDialogTitle>
            <ShadDialogDescription>
                Añada, modifique o elimine ingredientes para este producto.
            </ShadDialogDescription>
            </ShadDialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto"> {/* Scrollable area for many ingredients */}
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
                 {/* Input for adding new ingredient */}
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
              Seleccione la nueva categoría para este producto.
            </ShadDialogDescription>
          </ShadDialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Categoría
              </Label>
              <Select onValueChange={handleCategorySelectChange} value={newCategory}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {orderedCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

    </div>
);
};


const ProductsPageContent = () => {
    // This component could fetch initial data if needed, or handle context providers
    return <ProductsManagementPage />;
}

export default function ProductsPage() {
    return <ProductsPageContent />;
}

