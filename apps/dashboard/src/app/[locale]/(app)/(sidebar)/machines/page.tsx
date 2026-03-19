import React from 'react';
import { Server } from 'lucide-react';
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

export default function MachinesPage() {
  const db = getDb();
  
  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Equipment & Machines</h1>
          <p className="text-muted-foreground">Track machine inventory, financing obligations, and service history.</p>
        </div>
        <Button>Add Machine</Button>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Serial / Model</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-center">Last Serviced</TableHead>
                <TableHead className="text-right">Financing Payment</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {db.machines.map((mac) => (
                <TableRow key={mac.id} className="cursor-pointer">
                  <TableCell>
                    <div className="flex items-center">
                      <Server className="flex-shrink-0 h-4 w-4 text-muted-foreground mr-3" />
                      <div>
                        <div className="font-medium">{mac.serial}</div>
                        <div className="text-xs text-muted-foreground">{mac.model}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{db.locations.find(l => l.id === mac.locationId)?.name || 'Unassigned'}</TableCell>
                  <TableCell className="text-center">{mac.lastService}</TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">{mac.payment}</TableCell>
                  <TableCell className="text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      mac.status === 'Online' ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                    }`}>
                      {mac.status}
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
