"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@vendcfo/ui/card";
import { Input } from "@vendcfo/ui/input";
import { Label } from "@vendcfo/ui/label";
import { Plus, Trash2 } from "lucide-react";
import type React from "react";
import { useState } from "react";

interface Employee {
  id: string;
  name: string;
  hourlyWage: number;
  hoursPerWeek: number;
}

const MAX_EMPLOYEES = 10;

function createEmployee(index: number): Employee {
  return {
    id: crypto.randomUUID(),
    name: index === 0 ? "Employee 1" : `Employee ${index + 1}`,
    hourlyWage: 18,
    hoursPerWeek: 40,
  };
}

export function LaborCalculator() {
  const [employees, setEmployees] = useState<Employee[]>([createEmployee(0)]);
  const [shared, setShared] = useState({
    benefitsPct: 25,
    routesServiced: 5,
    avgStopsPerRoute: 8,
  });

  const addEmployee = () => {
    if (employees.length >= MAX_EMPLOYEES) return;
    setEmployees((prev) => [...prev, createEmployee(prev.length)]);
  };

  const removeEmployee = (id: string) => {
    if (employees.length <= 1) return;
    setEmployees((prev) => prev.filter((e) => e.id !== id));
  };

  const updateEmployee = (
    id: string,
    field: keyof Omit<Employee, "id">,
    value: string,
  ) => {
    setEmployees((prev) =>
      prev.map((e) =>
        e.id === id
          ? {
              ...e,
              [field]: field === "name" ? value : Number.parseFloat(value) || 0,
            }
          : e,
      ),
    );
  };

  const handleSharedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setShared((prev) => ({ ...prev, [name]: Number.parseFloat(value) || 0 }));
  };

  // Per-employee costs
  const employeeCosts = employees.map((emp) => {
    const weeklyCost =
      emp.hourlyWage * emp.hoursPerWeek * (1 + shared.benefitsPct / 100);
    const monthlyCost = weeklyCost * 4.33;
    return { ...emp, weeklyCost, monthlyCost };
  });

  // Totals
  const totalMonthlyCost = employeeCosts.reduce(
    (sum, e) => sum + e.monthlyCost,
    0,
  );
  const totalStops = shared.routesServiced * shared.avgStopsPerRoute;
  const costPerRoute =
    shared.routesServiced > 0 ? totalMonthlyCost / shared.routesServiced : 0;
  const costPerStop = totalStops > 0 ? totalMonthlyCost / totalStops : 0;

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle>Labor / Hiring Calculator</CardTitle>
          <button
            type="button"
            onClick={addEmployee}
            disabled={employees.length >= MAX_EMPLOYEES}
            className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-md border border-border bg-background text-foreground hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Employee
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Employee rows */}
        <div className="space-y-3 mb-5">
          {employees.map((emp, idx) => (
            <div
              key={emp.id}
              className="rounded-md border border-border bg-secondary/50 p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <Input
                  type="text"
                  value={emp.name}
                  onChange={(e) =>
                    updateEmployee(emp.id, "name", e.target.value)
                  }
                  className="h-7 text-sm font-medium w-[140px] bg-background"
                  placeholder="Name"
                />
                {employees.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeEmployee(emp.id)}
                    className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                    aria-label={`Remove ${emp.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Hourly Wage ($)
                  </Label>
                  <Input
                    type="number"
                    value={emp.hourlyWage}
                    onChange={(e) =>
                      updateEmployee(emp.id, "hourlyWage", e.target.value)
                    }
                    className="mt-0.5 h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Hours/Week
                  </Label>
                  <Input
                    type="number"
                    value={emp.hoursPerWeek}
                    onChange={(e) =>
                      updateEmployee(emp.id, "hoursPerWeek", e.target.value)
                    }
                    className="mt-0.5 h-8 text-sm"
                  />
                </div>
              </div>
            </div>
          ))}
          {employees.length >= MAX_EMPLOYEES && (
            <p className="text-xs text-muted-foreground text-center">
              Maximum of {MAX_EMPLOYEES} employees reached.
            </p>
          )}
        </div>

        {/* Shared inputs */}
        <div className="space-y-4 mb-5">
          <div>
            <Label htmlFor="benefitsPct">Benefits Overhead (%)</Label>
            <Input
              type="number"
              id="benefitsPct"
              name="benefitsPct"
              value={shared.benefitsPct}
              onChange={handleSharedChange}
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="routesServiced">Routes Serviced</Label>
              <Input
                type="number"
                id="routesServiced"
                name="routesServiced"
                value={shared.routesServiced}
                onChange={handleSharedChange}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="avgStopsPerRoute">Avg Stops/Route</Label>
              <Input
                type="number"
                id="avgStopsPerRoute"
                name="avgStopsPerRoute"
                value={shared.avgStopsPerRoute}
                onChange={handleSharedChange}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* Per-employee results */}
        {employeeCosts.length > 1 && (
          <div className="bg-secondary/50 p-4 rounded-lg border border-border mb-4">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3">
              Per-Employee Costs
            </h3>
            <div className="space-y-2 font-mono text-sm">
              {employeeCosts.map((emp) => (
                <div key={emp.id} className="flex items-center justify-between">
                  <span className="text-muted-foreground truncate mr-2">
                    {emp.name}
                  </span>
                  <div className="flex gap-4 shrink-0">
                    <span className="text-muted-foreground text-xs">
                      ${emp.weeklyCost.toFixed(0)}/wk
                    </span>
                    <span className="font-medium text-foreground">
                      ${emp.monthlyCost.toFixed(2)}/mo
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Totals */}
        <div className="bg-secondary p-4 rounded-lg border border-border">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3">
            Fully Loaded Cost
          </h3>
          <div className="space-y-3 font-mono text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Monthly Cost:</span>
              <span className="font-bold text-foreground">
                ${totalMonthlyCost.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cost / Route:</span>
              <span className="text-foreground">
                ${costPerRoute.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-border">
              <span className="text-muted-foreground">Cost / Stop:</span>
              <span className="font-medium text-foreground">
                ${costPerStop.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
