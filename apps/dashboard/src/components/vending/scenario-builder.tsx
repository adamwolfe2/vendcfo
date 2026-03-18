"use client";

import React, { useState } from 'react';
import { calculatePriceChange, PriceChangeInputs, PriceChangeOutputs } from '@vendcfo/calculators';
import { TrendingUp, AlertTriangle, DollarSign } from 'lucide-react';
import { Card, CardContent } from "@vendcfo/ui/card";
import { Input } from "@vendcfo/ui/input";
import { Label } from "@vendcfo/ui/label";
import { cn } from "@vendcfo/ui/cn";

export function ScenarioBuilder() {
  const [activeTab, setActiveTab] = useState<'price' | 'expansion'>('price');

  const [priceInputs, setPriceInputs] = useState<PriceChangeInputs>({
    currentRetailPrice: 1.50,
    proposedNewPrice: 2.00,
    currentMonthlyUnitSales: 500,
    assumedElasticityDeclinePct: 5,
    unitCost: 0.75
  });

  const priceResults: PriceChangeOutputs = calculatePriceChange(priceInputs);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPriceInputs(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  return (
    <Card>
      {/* Tabs */}
      <div className="border-b border-border flex gap-4 px-6 pt-4">
        <button 
          onClick={() => setActiveTab('price')}
          className={cn(
            "pb-4 px-2 font-medium text-sm border-b-2 transition-colors",
            activeTab === 'price' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          Price Elasticity Model
        </button>
        <button 
          onClick={() => setActiveTab('expansion')}
          className={cn(
            "pb-4 px-2 font-medium text-sm border-b-2 transition-colors",
            activeTab === 'expansion' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          Location Expansion Model
        </button>
      </div>

      <CardContent className="p-6">
        {activeTab === 'price' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Inputs Column */}
            <div className="space-y-5">
              <h3 className="text-lg font-semibold text-foreground">Current Baseline</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sb-price">Current Price ($)</Label>
                  <Input type="number" step="0.25" id="sb-price" name="currentRetailPrice" value={priceInputs.currentRetailPrice} onChange={handlePriceChange} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="sb-cost">Unit Cost ($)</Label>
                  <Input type="number" step="0.05" id="sb-cost" name="unitCost" value={priceInputs.unitCost} onChange={handlePriceChange} className="mt-1" />
                </div>
              </div>

              <div>
                <Label htmlFor="sb-units">Monthly Unit Sales (Volume)</Label>
                <Input type="number" id="sb-units" name="currentMonthlyUnitSales" value={priceInputs.currentMonthlyUnitSales} onChange={handlePriceChange} className="mt-1" />
              </div>

              <div className="pt-4 border-t border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4">Proposed Changes</h3>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="sb-new-price">Proposed New Price ($)</Label>
                    <Input type="number" step="0.25" id="sb-new-price" name="proposedNewPrice" value={priceInputs.proposedNewPrice} onChange={handlePriceChange} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="sb-elasticity">Assumed Elasticity Drop (%)</Label>
                    <p className="text-xs text-muted-foreground mb-2">Expected volume decline per $0.25 price hike.</p>
                    <Input type="number" id="sb-elasticity" name="assumedElasticityDeclinePct" value={priceInputs.assumedElasticityDeclinePct} onChange={handlePriceChange} />
                  </div>
                </div>
              </div>
            </div>

            {/* Outputs Column */}
            <div className="bg-secondary rounded-xl p-6 border border-border flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold tracking-wider text-muted-foreground uppercase mb-4">Projected Impact</h3>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">New Monthly Gross Profit</p>
                      <h4 className="text-3xl font-bold text-foreground">${priceResults.projectedNewGrossProfit.toLocaleString()}</h4>
                      <p className="text-xs text-muted-foreground mt-1">Based on calculated volume drop</p>
                    </div>
                    <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
                      <DollarSign size={24} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-card p-4 rounded-lg border border-red-500/20 shadow-sm">
                      <p className="text-xs text-red-500 dark:text-red-400 font-semibold uppercase tracking-wider mb-2">Downside Risk</p>
                      <p className="text-xl font-bold text-foreground">${priceResults.downsideScenarioProfit.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground mt-1">If sales drop 1.5x expected</p>
                    </div>
                    
                    <div className="bg-card p-4 rounded-lg border border-green-500/20 shadow-sm">
                      <p className="text-xs text-green-600 dark:text-green-400 font-semibold uppercase tracking-wider mb-2">Upside Target</p>
                      <p className="text-xl font-bold text-foreground">${priceResults.upsideScenarioProfit.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground mt-1">If volume holds steady</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                {priceResults.recommendation === 'raise' ? (
                  <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg flex items-start">
                    <TrendingUp className="text-green-600 dark:text-green-400 mt-0.5 mr-3 flex-shrink-0" size={20} />
                    <div>
                      <h5 className="font-semibold text-green-700 dark:text-green-300 text-sm">Recommendation: Raise Price</h5>
                      <p className="text-sm text-green-700 dark:text-green-400 mt-1">The proposed price hike is highly likely to increase gross profit, even accounting for moderate volume declines.</p>
                    </div>
                  </div>
                ) : priceResults.recommendation === 'lower' ? (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg flex items-start">
                    <AlertTriangle className="text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3 flex-shrink-0" size={20} />
                    <div>
                      <h5 className="font-semibold text-yellow-700 dark:text-yellow-300 text-sm">Recommendation: Lower Price</h5>
                      <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">Lowering the price may increase total gross profit by driving significantly higher volume.</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-lg flex items-start">
                    <AlertTriangle className="text-orange-600 dark:text-orange-400 mt-0.5 mr-3 flex-shrink-0" size={20} />
                    <div>
                      <h5 className="font-semibold text-orange-700 dark:text-orange-300 text-sm">Recommendation: Hold Price</h5>
                      <p className="text-sm text-orange-700 dark:text-orange-400 mt-1">The expected drop in unit sales negates the margin increase. Hold the current price to avoid risking market share.</p>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {activeTab === 'expansion' && (
          <div className="flex flex-col items-center justify-center p-12 text-center h-64 border-2 border-dashed border-border rounded-xl">
            <h3 className="text-lg font-semibold text-foreground mb-2">Expansion Model</h3>
            <p className="text-muted-foreground max-w-sm mb-6">Model the ROI of acquiring new locations and purchasing new equipment or routes.</p>
            <button className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors">
              Coming Soon
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
