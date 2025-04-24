'use client';

import * as React from 'react';
import {useState, useEffect} from 'react';
import {useParams, useRouter} from 'next/navigation';
import Image from 'next/image';
import {Button} from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter, // Import CardFooter
} from '@/components/ui/card';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Separator} from '@/components/ui/separator';
import {PlusCircle, MinusCircle, XCircle, CheckCircle} from 'lucide-react';
import {useToast} from '@/hooks/use-toast';

interface MenuItem {
  id: number;
  name: string;
  price: number;
  category: string;
}

interface OrderItem extends MenuItem {
  quantity: number;
}

// Mock data - replace with actual API calls
const mockMenu: MenuItem[] = [
  {
    id: 1,
    name: 'Hamburguesa',
    price: 8.99,
    category: 'Platos Principales',
  },
  {
    id: 2,
    name: 'Pizza',
    price: 12.5,
    category: 'Platos Principales',
  },
  {
    id: 3,
    name: 'Ensalada',
    price: 6.5,
    category: 'Entrantes',
  },
  {
    id: 4,
    name: 'Patatas Fritas',
    price: 3.0,
    category: 'Acompañamientos',
  },
  {
    id: 5,
    name: 'Refresco',
    price: 2.0,
    category: 'Bebidas',
  },
  {
    id: 6,
    name: 'Helado',
    price: 4.5,
    category: 'Postres',
  },
  {
    id: 7,
    name: 'Alitas de Pollo',
    price: 9.5,
    category: 'Entrantes',
  },
   {
    id: 8,
    name: 'Filete',
    price: 18.0,
    category: 'Platos Principales',
  },
   {
    id: 9,
    name: 'Agua',
    price: 1.0,
    category: 'Bebidas',
  },
];

const categories = [
  ...new Set(mockMenu.map((item) => item.category)),
];

// Helper function to capitalize first letter
const capitalizeFirstLetter = (string: string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export default function TableDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const tableIdParam = params.tableId as string; // Get the raw param (can be number or string)
  const [order, setOrder] = useState<OrderItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(
    categories[0] || 'Todos'
  );

  // Simulate fetching existing order (replace with real logic)
  // Note: This mock logic might not make sense for "Mezón" or "Delivery"
  // In a real app, you'd fetch based on the specific ID/type.
  useEffect(() => {
    if (!['mezon', 'delivery'].includes(tableIdParam) && Math.random() > 0.5) { // Only simulate for tables
      const mockExistingOrder = mockMenu.slice(0, Math.floor(Math.random() * 3) + 1).map(item => ({
        ...item,
        quantity: Math.floor(Math.random() * 2) + 1
      }));
      setOrder(mockExistingOrder);
    }
  }, [tableIdParam]);


  const addToOrder = (item: MenuItem) => {
    setOrder((prevOrder) => {
      const existingItem = prevOrder.find((orderItem) => orderItem.id === item.id);
      if (existingItem) {
        return prevOrder.map((orderItem) =>
          orderItem.id === item.id
            ? {...orderItem, quantity: orderItem.quantity + 1}
            : orderItem
        );
      } else {
        return [...prevOrder, {...item, quantity: 1}];
      }
    });
      toast({
        title: `${item.name} añadido`,
        description: `Total: ${calculateTotal(order) + item.price}`,
        variant: "default",
        className: "bg-secondary text-secondary-foreground"
      })
  };

  const removeFromOrder = (itemId: number) => {
    setOrder((prevOrder) => {
      const existingItem = prevOrder.find((orderItem) => orderItem.id === itemId);
      if (existingItem && existingItem.quantity > 1) {
        return prevOrder.map((orderItem) =>
          orderItem.id === itemId
            ? {...orderItem, quantity: orderItem.quantity - 1}
            : orderItem
        );
      } else {
        return prevOrder.filter((orderItem) => orderItem.id !== itemId);
      }
    });
     toast({
        title: `Cantidad reducida / eliminada`,
        variant: "default",
     })
  };

   const removeCompletely = (itemId: number) => {
     setOrder((prevOrder) => prevOrder.filter((orderItem) => orderItem.id !== itemId));
      toast({
        title: `Artículo eliminado del pedido`,
        variant: "destructive",
      })
   }

  const calculateTotal = (currentOrder: OrderItem[]) => {
    return currentOrder.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  const handleFinalizeOrder = () => {
    // In a real app: send order to backend, update table status, navigate or show success
    console.log('Finalizando pedido:', order);
    toast({
      title: "¡Pedido Realizado!",
      description: `Total: $${calculateTotal(order).toFixed(2)} para ${getPageTitle()}`,
      variant: "default",
       className: "bg-green-200 text-green-800 border-green-400" // Using direct colors temporarily for success
    });
    // Maybe clear order and navigate back or update table status visually
     setOrder([]); // Option to clear order
     // router.push('/tables'); // Option to navigate back
  };

  const filteredMenu =
    selectedCategory === 'Todos'
      ? mockMenu
      : mockMenu.filter((item) => item.category === selectedCategory);

  const total = calculateTotal(order);

  // Determine the title based on the tableIdParam
  const getPageTitle = () => {
      if (tableIdParam === 'mezon') {
          return 'Mezón';
      } else if (tableIdParam === 'delivery') {
          return 'Delivery';
      } else {
          return `Mesa ${tableIdParam}`;
      }
  }


  return (
    <div className="container mx-auto p-4 h-[calc(100vh-theme(spacing.16))] flex flex-col">
      <h1 className="text-3xl font-bold mb-6">{getPageTitle()} - Pedido</h1>
      <div className="flex flex-grow gap-4 overflow-hidden">
        {/* Menu Section */}
        <Card className="w-3/5 flex flex-col shadow-lg">
          <CardHeader>
            <CardTitle>Menú</CardTitle>
            <div className="flex space-x-2 pt-2 overflow-x-auto pb-2">
               <Button
                variant={selectedCategory === 'Todos' ? 'default' : 'secondary'}
                onClick={() => setSelectedCategory('Todos')}
                className="shrink-0"
              >
                Todos
              </Button>
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'secondary'}
                  onClick={() => setSelectedCategory(category)}
                  className="shrink-0"
                >
                  {category}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="flex-grow overflow-hidden p-0">
            <ScrollArea className="h-full p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredMenu.map((item) => (
                  <Card
                    key={item.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => addToOrder(item)}
                  >
                    <CardContent className="p-3">
                      <h3 className="font-semibold text-sm truncate">{item.name}</h3>
                      <p className="text-xs text-muted-foreground">${item.price.toFixed(2)}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Order Summary Section */}
        <Card className="w-2/5 flex flex-col shadow-lg">
          <CardHeader>
            <CardTitle>Pedido Actual</CardTitle>
            <CardDescription>Artículos añadidos.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow overflow-hidden p-0">
            <ScrollArea className="h-full p-4">
              {order.length === 0 ? (
                <p className="text-muted-foreground text-center">Aún no se han añadido artículos.</p>
              ) : (
                <ul className="space-y-3">
                  {order.map((item) => (
                    <li key={item.id} className="flex items-center justify-between">
                     <div className='flex items-center gap-2'>
                        <div>
                          <span className="font-medium text-sm">{item.name}</span>
                          <p className='text-xs text-muted-foreground'>${item.price.toFixed(2)}</p>
                        </div>
                     </div>

                      <div className="flex items-center gap-2">
                         <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeFromOrder(item.id)}>
                            <MinusCircle className="h-4 w-4" />
                          </Button>
                        <span className="font-medium w-4 text-center">{item.quantity}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-primary" onClick={() => addToOrder(item)}>
                           <PlusCircle className="h-4 w-4" />
                         </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive/70" onClick={() => removeCompletely(item.id)}>
                            <XCircle className="h-4 w-4" />
                          </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </ScrollArea>
          </CardContent>
          <Separator />
          <CardFooter className="p-4 flex flex-col items-stretch gap-4">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <Button size="lg" onClick={handleFinalizeOrder} disabled={order.length === 0}>
              <CheckCircle className="mr-2 h-5 w-5" /> Finalizar Pedido
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
