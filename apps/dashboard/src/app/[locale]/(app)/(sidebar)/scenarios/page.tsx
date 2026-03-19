import { ScenarioBuilder } from '@/components/vending/scenario-builder';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Scenario Builder | VendCFO',
  description: 'Model what-if business decisions.',
};

export default function ScenariosPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">Scenario Builder</h1>
        <p className="text-muted-foreground">
          Model business decisions before making them. See the projected financial impact of pricing changes, product mix shifts, and new equipment logic.
        </p>
      </div>
      
      <ScenarioBuilder />
    </div>
  );
}
