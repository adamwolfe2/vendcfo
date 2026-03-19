import React from 'react';
import { PackageOpen } from 'lucide-react';
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

export default function SkusPage() {
  const db = getDb();
  
  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Products & SKUs</h1>
          <p className="text-muted-foreground">Analyze product margins, identify low performers, and adjust pricing.</p>
        </div>
        <Button>Add Product</Button>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead className="text-center">Unit Cost</TableHead>
                <TableHead className="text-center">Retail Price</TableHead>
                <TableHead>Gross Margin %</TableHead>
                <TableHead className="text-center">Sales Velocity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {db.skus.map((sku) => (
                <TableRow key={sku.id} className="cursor-pointer">
                  <TableCell>
                    <div className="flex items-center">
                      <PackageOpen className="flex-shrink-0 h-4 w-4 text-muted-foreground mr-3" />
                      <div>
                        <div className="font-medium">{sku.name}</div>
                        <div className="text-xs text-muted-foreground">{sku.category}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-mono">${sku.cost.toFixed(2)}</TableCell>
                  <TableCell className="text-center font-mono">${sku.price.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${sku.margin < 30 ? 'text-red-500 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                        {sku.margin}%
                      </span>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${sku.margin < 30 ? 'bg-red-500' : 'bg-green-500'}`}
                          style={{ width: `${Math.min(sku.margin, 100)}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      sku.velocity === 'High' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : 
                      sku.velocity === 'Medium' ? 'bg-secondary text-muted-foreground' : 
                      'bg-red-500/10 text-red-600 dark:text-red-400'
                    }`}>
                      {sku.velocity}
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
