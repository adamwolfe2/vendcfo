import fs from 'fs';
import path from 'path';
import { VendingCsvRow } from '../parser';

const DB_PATH = path.join(process.cwd(), 'vending-mock-db.json');

export interface VendingDbState {
  routes: Array<{ id: string; name: string }>;
  locations: Array<{ id: string; name: string; routeId: string; revShare: number; machines: number; profit: number; status: string }>;
  machines: Array<{ id: string; serial: string; model: string; locationId: string; status: string; lastService: string; payment: string }>;
  skus: Array<{ id: string; name: string; category: string; cost: number; price: number; margin: number; velocity: string }>;
  transactions: VendingCsvRow[];
}

const defaultState: VendingDbState = {
  routes: [
    { id: 'r1', name: 'Downtown' },
    { id: 'r2', name: 'University' }
  ],
  locations: [
    { id: '1', name: 'Downtown Core Office', routeId: 'r1', revShare: 15, machines: 3, profit: 850, status: 'Active' },
    { id: '2', name: 'University Campus Library', routeId: 'r2', revShare: 10, machines: 5, profit: 1200, status: 'Active' },
  ],
  machines: [
    { id: '1', serial: 'AMS-39V-001', model: 'AMS 39 Visi-Combo', locationId: '1', status: 'Online', lastService: '2 days ago', payment: '$120.00' },
  ],
  skus: [
    { id: '1', name: 'Coca-Cola 20oz Bottle', category: 'Beverage', cost: 0.85, price: 2.50, margin: 66, velocity: 'High' },
  ],
  transactions: []
};

function ensureDb() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultState, null, 2));
  }
}

export function getDb(): VendingDbState {
  ensureDb();
  const data = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(data) as VendingDbState;
}

export function saveDb(state: VendingDbState) {
  fs.writeFileSync(DB_PATH, JSON.stringify(state, null, 2));
}

export function insertTransactions(rows: VendingCsvRow[]) {
  const db = getDb();
  db.transactions.push(...rows);
  
  // Basic heuristic to create locations/machines based on CSV rows if they don't exist
  rows.forEach(row => {
    if (row['Location Name'] && !db.locations.find(l => l.name === row['Location Name'])) {
      db.locations.push({
        id: Math.random().toString(36).substring(7),
        name: row['Location Name'],
        routeId: 'r1',
        revShare: 10,
        machines: 1,
        profit: 0,
        status: 'Active'
      });
    }
  });

  saveDb(db);
}
