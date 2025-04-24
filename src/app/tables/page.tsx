'use client';

import * as React from 'react';
import {useState} from 'react';
import Link from 'next/link';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {cn} from '@/lib/utils';

interface Table {
  id: number;
  status: 'available' | 'occupied';
}

const initialTables: Table[] = Array.from({length: 12}, (_, i) => ({
  id: i + 1,
  status: Math.random() > 0.6 ? 'occupied' : 'available', // Randomly assign status
}));

export default function TablesPage() {
  const [tables, setTables] = useState<Table[]>(initialTables);

  // In a real app, this would likely involve fetching data and potentially more complex state management.
  // For now, we just use local state.

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Table Management</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {tables.map((table) => (
          <Link key={table.id} href={`/tables/${table.id}`} passHref>
            <Card
              className={cn(
                'cursor-pointer transition-all duration-200 hover:shadow-lg',
                table.status === 'available'
                  ? 'bg-secondary hover:bg-secondary/90'
                  : 'bg-muted hover:bg-muted/90',
                 table.status === 'occupied' ? 'border-primary border-2' : ''
              )}
            >
              <CardHeader className="p-4">
                <CardTitle className="text-center text-lg">
                  Table {table.id}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 text-center">
                <span
                  className={cn(
                    'text-sm font-medium px-2 py-1 rounded-full',
                    table.status === 'available'
                      ? 'bg-green-200 text-green-800'
                      : 'bg-orange-200 text-orange-800'
                  )}
                >
                  {table.status === 'available' ? 'Available' : 'Occupied'}
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
