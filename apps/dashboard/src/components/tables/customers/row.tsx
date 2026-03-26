"use client";

import { type Row, flexRender } from "@tanstack/react-table";
import { cn } from "@vendcfo/ui/cn";
import { TableCell, TableRow } from "@vendcfo/ui/table";
import React from "react";
import type { Customer } from "./columns";

type Props = {
  row: Row<Customer>;
  setOpen: (id?: string) => void;
};

export const CustomerRow = React.memo(function CustomerRow({ row, setOpen }: Props) {
  return (
    <>
      <TableRow
        className="group h-[45px] cursor-pointer hover:bg-[#F2F1EF]"
        key={row.id}
      >
        {row.getVisibleCells().map((cell, index) => (
          <TableCell
            key={cell.id}
            onClick={() => ![3, 4, 5, 6].includes(index) && setOpen(row.id)}
            className={cn(cell.column.columnDef.meta?.className)}
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        ))}
      </TableRow>
    </>
  );
});
