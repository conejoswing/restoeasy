'use client';

import * as React from 'react';
import {useState, useEffect} from 'react';
import {useParams, useRouter} from 'next/navigation';
import Image from 'next/image';
import {Button} from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
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
  imageUrl: string;
}

interface OrderItem extends MenuItem {
  quantity: number;
}

// Mock data - replace with actual API calls
const mockMenu: MenuItem[] = [
  {
    id: 1,
    name: 'Burger',
    price: 8.99,
    category: 'Main Dishes',
    imageUrl: 'https://picsum.photos/seed/burger/200/150',
  },
  {
    id: 2,
    name: 'Pizza',
    price: 12.5,
    category: 'Main Dishes',
    imageUrl: 'https://picsum.photos/seed/pizza/200/150',
  },
  {
    id: 3,
    name: 'Salad',
    price: 6.5,
    category: 'Appetizers',
    imageUrl: 'https://picsum.photos/seed/salad/200/150',
  },
  {
    id: 4,
    name: 'Fries',
    price: 3.0,
    category: 'Sides',
    imageUrl: 'https://picsum.photos/seed/fries/200/150',
  },
  {
    id: 5,
    name: 'Soda',
    price: 2.0,
    category: 'Drinks',
    imageUrl: 'https://picsum.photos/seed/soda/200/150',
  },
  {
    id: 6,
    name: 'Ice Cream',
    price: 4.5,
    category: 'Desserts',
    imageUrl: 'https://picsum.photos/seed/icecream/200/150',
  },
  {
    id: 7,
    name: 'Chicken Wings',
    price: 9.5,
    category: 'Appetizers',
    imageUrl: 'https://picsum.photos/seed/wings/200/150',
  },
   {
    id: 8,
    name: 'Steak',
    price: 18.0,
    category: 'Main Dishes',
    imageUrl: 'https://picsum.photos/seed/steak/200/150',
  },
   {
    id: 9,
    name: 'Water',
    price: 1.0,
    category: 'Drinks',
    imageUrl: 'https://picsum.photos/seed/water/200/150',
  },
];

const categories = [
  ...new Set(mockMenu.map((item) => item.category)),
];

export default function TableDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const tableId = params.tableId;
  const [order, setOrder] = useState<OrderItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(
    categories[0] || 'All'
  );

  // Simulate fetching existing order if table is occupied (replace with real logic)
  useEffect(() => {
    // If table status was passed or fetched and is 'occupied', load mock order
    if (Math.random() > 0.5) { // Simulate 50% chance of existing order
      const mockExistingOrder = mockMenu.slice(0, Math.floor(Math.random() * 3) + 1).map(item => ({
        ...item,
        quantity: Math.floor(Math.random() * 2) + 1
      }));
      setOrder(mockExistingOrder);
    }
  }, [tableId]);


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
        title: `${item.name} added`,
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
        title: `Item quantity reduced / removed`,
        variant: "default",
     })
  };

   const removeCompletely = (itemId: number) => {
     setOrder((prevOrder) => prevOrder.filter((orderItem) => orderItem.id !== itemId));
      toast({
        title: `Item removed from order`,
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
    console.log('Finalizing order:', order);
    toast({
      title: "Order Placed!",
      description: `Total: $${calculateTotal(order).toFixed(2)} for Table ${tableId}`,
      variant: "default",
       className: "bg-green-200 text-green-800 border-green-400"
    });
    // Maybe clear order and navigate back or update table status visually
     // setOrder([]); // Option to clear order
     // router.push('/tables'); // Option to navigate back
  };

  const filteredMenu =
    selectedCategory === 'All'
      ? mockMenu
      : mockMenu.filter((item) => item.category === selectedCategory);

  const total = calculateTotal(order);

  return (
    <div className="container mx-auto p-4 h-[calc(100vh-theme(spacing.16))] flex flex-col">
      <h1 className="text-3xl font-bold mb-6">Table {tableId} - Order</h1>
      <div className="flex flex-grow gap-4 overflow-hidden">
        {/* Menu Section */}
        <Card className="w-3/5 flex flex-col shadow-lg">
          <CardHeader>
            <CardTitle>Menu</CardTitle>
            <div className="flex space-x-2 pt-2 overflow-x-auto pb-2">
               <Button
                variant={selectedCategory === 'All' ? 'default' : 'secondary'}
                onClick={() => setSelectedCategory('All')}
                className="shrink-0"
              >
                All
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
                    <CardContent className="p-0">
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        width={200}
                        height={150}
                        className="w-full h-auto object-cover rounded-t-lg"
                      />
                      <div className="p-3">
                        <h3 className="font-semibold text-sm truncate">{item.name}</h3>
                        <p className="text-xs text-muted-foreground">${item.price.toFixed(2)}</p>
                      </div>
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
            <CardTitle>Current Order</CardTitle>
            <CardDescription>Items added for this table.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow overflow-hidden p-0">
            <ScrollArea className="h-full p-4">
              {order.length === 0 ? (
                <p className="text-muted-foreground text-center">No items added yet.</p>
              ) : (
                <ul className="space-y-3">
                  {order.map((item) => (
                    <li key={item.id} className="flex items-center justify-between">
                     <div className='flex items-center gap-2'>
                        <Image src={item.imageUrl} alt={item.name} width={40} height={30} className="rounded"/>
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
              <CheckCircle className="mr-2 h-5 w-5" /> Finalize Order
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
