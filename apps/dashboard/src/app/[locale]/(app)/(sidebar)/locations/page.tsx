import React from 'react';
import { Building2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { getDb } from '@vendcfo/spreadsheet-bridge';
import { Card, CardContent } from "@vendcfo/ui/card";
import { Button } from "@vendcfo/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@vendcfo/ui/table";

export default function LocationsPage() {
  const db = getDb();
  const sortedLocations = [...db.locations].sort((a, b) => b.profit - a.profit);

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Locations</h1>
          <p className="text-muted-foreground">Manage location agreements, revenue share, and profitability.</p>
        </div>
        <Button>Add Location</Button>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Location Name</TableHead>
                <TableHead>Route</TableHead>
                <TableHead className="text-center">Machines</TableHead>
                <TableHead className="text-center">Rev Share %</TableHead>
                <TableHead className="text-right">30d Net Profit</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedLocations.map((loc) => (
                <TableRow key={loc.id} className="cursor-pointer">
                  <TableCell>
                    <div className="flex items-center">
                      <Building2 className="flex-shrink-0 h-4 w-4 text-muted-foreground mr-3" />
                      <span className="font-medium">{loc.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{db.routes.find(r => r.id === loc.routeId)?.name || 'Unassigned'}</TableCell>
                  <TableCell className="text-center">{loc.machines}</TableCell>
                  <TableCell className="text-center">{loc.revShare}%</TableCell>
                  <TableCell className="text-right font-medium">
                    {loc.profit > 0 ? (
                      <span className="text-green-600 dark:text-green-400 flex justify-end items-center">
                        <ArrowUpRight size={14} className="mr-1"/>${loc.profit}
                      </span>
                    ) : (
                      <span className="text-red-500 dark:text-red-400 flex justify-end items-center">
                        <ArrowDownRight size={14} className="mr-1"/>-${Math.abs(loc.profit)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      loc.status === 'Active' ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'
                    }`}>
                      {loc.status}
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
