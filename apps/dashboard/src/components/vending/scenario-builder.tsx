"use client";

import React, { useState } from 'react';
import { calculatePriceChange, PriceChangeInputs, PriceChangeOutputs } from '@vendcfo/calculators';
import { TrendingUp, AlertTriangle, ArrowRight, DollarSign } from 'lucide-react';

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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      
      {/* Tabs */}
      <div className="border-b border-gray-100 flex gap-4 px-6 pt-4">
        <button 
          onClick={() => setActiveTab('price')}
          className={`pb-4 px-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'price' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
        >
          Price Elasticity Model
        </button>
        <button 
          onClick={() => setActiveTab('expansion')}
          className={`pb-4 px-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'expansion' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
        >
          Location Expansion Model
        </button>
      </div>

      <div className="p-6">
        {activeTab === 'price' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Inputs Column */}
            <div className="space-y-5">
              <h3 className="text-lg font-semibold text-gray-900">Current Baseline</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Price ($)</label>
                  <input type="number" step="0.25" name="currentRetailPrice" value={priceInputs.currentRetailPrice} onChange={handlePriceChange} className="w-full border-gray-300 rounded-md shadow-sm p-2 border focus:ring-primary focus:border-primary sm:text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost ($)</label>
                  <input type="number" step="0.05" name="unitCost" value={priceInputs.unitCost} onChange={handlePriceChange} className="w-full border-gray-300 rounded-md shadow-sm p-2 border focus:ring-primary focus:border-primary sm:text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Unit Sales (Volume)</label>
                <input type="number" name="currentMonthlyUnitSales" value={priceInputs.currentMonthlyUnitSales} onChange={handlePriceChange} className="w-full border-gray-300 rounded-md shadow-sm p-2 border focus:ring-primary focus:border-primary sm:text-sm" />
              </div>

              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Proposed Changes</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Proposed New Price ($)</label>
                    <input type="number" step="0.25" name="proposedNewPrice" value={priceInputs.proposedNewPrice} onChange={handlePriceChange} className="w-full border-gray-300 rounded-md shadow-sm p-2 border focus:ring-primary focus:border-primary sm:text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assumed Elasticity Drop (%)</label>
                    <p className="text-xs text-gray-500 mb-2">Expected volume decline per $0.25 price hike.</p>
                    <input type="number" name="assumedElasticityDeclinePct" value={priceInputs.assumedElasticityDeclinePct} onChange={handlePriceChange} className="w-full border-gray-300 rounded-md shadow-sm p-2 border focus:ring-primary focus:border-primary sm:text-sm" />
                  </div>
                </div>
              </div>
            </div>

            {/* Outputs Column */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold tracking-wider text-gray-500 uppercase mb-4">Projected Impact</h3>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">New Monthly Gross Profit</p>
                      <h4 className="text-3xl font-bold text-gray-900">${priceResults.projectedNewGrossProfit.toLocaleString()}</h4>
                      <p className="text-xs text-gray-500 mt-1">Based on calculated volume drop</p>
                    </div>
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                      <DollarSign size={24} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-red-100 shadow-sm">
                      <p className="text-xs text-red-500 font-semibold uppercase tracking-wider mb-2">Downside Risk</p>
                      <p className="text-xl font-bold text-gray-900">${priceResults.downsideScenarioProfit.toLocaleString()}</p>
                      <p className="text-xs text-gray-500 mt-1">If sales drop 1.5x expected</p>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg border border-green-100 shadow-sm">
                      <p className="text-xs text-green-600 font-semibold uppercase tracking-wider mb-2">Upside Target</p>
                      <p className="text-xl font-bold text-gray-900">${priceResults.upsideScenarioProfit.toLocaleString()}</p>
                      <p className="text-xs text-gray-500 mt-1">If volume holds steady</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                {priceResults.recommendation === 'raise' ? (
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg flex items-start">
                    <TrendingUp className="text-green-600 mt-0.5 mr-3 flex-shrink-0" size={20} />
                    <div>
                      <h5 className="font-semibold text-green-900 text-sm">Recommendation: Raise Price</h5>
                      <p className="text-sm text-green-800 mt-1">The proposed price hike is highly likely to increase gross profit, even when accounting for moderate sales volume declines.</p>
                    </div>
                  </div>
                ) : priceResults.recommendation === 'lower' ? (
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg flex items-start">
                    <AlertTriangle className="text-yellow-600 mt-0.5 mr-3 flex-shrink-0" size={20} />
                    <div>
                      <h5 className="font-semibold text-yellow-900 text-sm">Recommendation: Lower Price</h5>
                      <p className="text-sm text-yellow-800 mt-1">Lowering the price may increase total gross profit by driving significantly higher volume.</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg flex items-start">
                    <AlertTriangle className="text-orange-600 mt-0.5 mr-3 flex-shrink-0" size={20} />
                    <div>
                      <h5 className="font-semibold text-orange-900 text-sm">Recommendation: Hold Price</h5>
                      <p className="text-sm text-orange-800 mt-1">The expected drop in unit sales volume negates the margin increase. We recommend holding the current price to avoid risking market share.</p>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {activeTab === 'expansion' && (
          <div className="flex flex-col items-center justify-center p-12 text-center h-64 border-2 border-dashed border-gray-200 rounded-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Expansion Model</h3>
            <p className="text-gray-500 max-w-sm mb-6">Model the ROI of acquiring new locations and purchasing new equipment or routes.</p>
            <button className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors">
              Coming Soon
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
