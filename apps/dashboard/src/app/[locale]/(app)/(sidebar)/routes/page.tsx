import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { getDb } from '@vendcfo/spreadsheet-bridge';
import { Card, CardContent, CardHeader, CardTitle } from "@vendcfo/ui/card";
import { Button } from "@vendcfo/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@vendcfo/ui/table";

export default function RoutesPage() {
  const db = getDb();
  const sortedRoutes = [...db.routes].sort((a: any, b: any) => (b.profit ?? 0) - (a.profit ?? 0));

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Route Profitability</h1>
          <p className="text-muted-foreground">View and manage your vending routes, ranked by profitability.</p>
        </div>
        <Button>Add Route</Button>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Route Name</TableHead>
                <TableHead className="text-center">Stops</TableHead>
                <TableHead className="text-right">Monthly Revenue</TableHead>
                <TableHead className="text-right">Monthly Profit</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRoutes.map((route: any) => (
                <TableRow key={route.id} className="cursor-pointer">
                  <TableCell className="font-medium">{route.name}</TableCell>
                  <TableCell className="text-center">{route.stops ?? '—'}</TableCell>
                  <TableCell className="text-right font-mono">
                    ${(route.revenue ?? 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {(route.profit ?? 0) > 0 ? (
                      <span className="text-green-600 dark:text-green-400 flex items-center justify-end">
                        <ArrowUpRight size={14} className="mr-1"/>${(route.profit ?? 0).toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-red-500 dark:text-red-400 flex items-center justify-end">
                        <ArrowDownRight size={14} className="mr-1"/>-${Math.abs(route.profit ?? 0).toLocaleString()}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      route.status === 'Active' ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'
                    }`}>
                      {route.status ?? 'Active'}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
