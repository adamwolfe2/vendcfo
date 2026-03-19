import React from 'react';
import { ArrowUpRight, ArrowDownRight, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@vendcfo/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@vendcfo/ui/table";

const MOCK_ROUTES = [
  { id: '1', name: 'Downtown Core', stops: 12, revenue: 8400, profit: 3200, profitPerVisit: 133, status: 'green' },
  { id: '2', name: 'Westside Gym & Transit', stops: 8, revenue: 5100, profit: 1600, profitPerVisit: 100, status: 'yellow' },
  { id: '3', name: 'University Campus', stops: 15, revenue: 9800, profit: 4100, profitPerVisit: 136, status: 'green' },
  { id: '4', name: 'Industrial Park South', stops: 6, revenue: 1200, profit: -150, profitPerVisit: -12, status: 'red' },
];

export function RouteTable() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Route Profitability Ranking</CardTitle>
        <button className="text-sm text-primary font-medium hover:text-primary/80 transition-colors">
          Export CSV
        </button>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Route Name</TableHead>
              <TableHead>Locations</TableHead>
              <TableHead className="text-right">Gross Rev/mo</TableHead>
              <TableHead className="text-right">Net Profit/mo</TableHead>
              <TableHead className="text-right">Profit/Visit</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_ROUTES.sort((a, b) => b.profit - a.profit).map((route) => (
              <TableRow key={route.id} className="cursor-pointer">
                <TableCell className="font-medium">{route.name}</TableCell>
                <TableCell>{route.stops}</TableCell>
                <TableCell className="text-right">${route.revenue.toLocaleString()}</TableCell>
                <TableCell className="text-right font-medium">
                  {route.profit > 0 ? (
                    <span className="text-green-600 dark:text-green-400 flex items-center justify-end">
                      <ArrowUpRight size={14} className="mr-1"/>${route.profit.toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-red-500 dark:text-red-400 flex items-center justify-end">
                      <ArrowDownRight size={14} className="mr-1"/>-${Math.abs(route.profit).toLocaleString()}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right font-mono">${route.profitPerVisit}</TableCell>
                <TableCell className="text-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    route.status === 'green' ? 'bg-green-500/10 text-green-600 dark:text-green-400' :
                    route.status === 'yellow' ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' :
                    'bg-red-500/10 text-red-600 dark:text-red-400'
                  }`}>
                    {route.status === 'red' && <AlertTriangle size={12} className="mr-1" />}
                    {route.status.toUpperCase()}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
