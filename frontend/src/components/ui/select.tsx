"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const Select = React.forwardRef<
  React.ElementRef<"select">,
  React.ComponentPropsWithoutRef<"select"> & {
    value?: string;
    onValueChange?: (value: string) => void;
  }>(
  ({ className, value, onValueChange, children, ...props }, ref) =>
  <div className="relative">
    <select
      ref={ref}
      value={value}
      onChange={(e) => onValueChange?.(e.target.value)}
      className={cn(
        "flex h-10 w-full rounded-md border border-[#ced4da] bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#6c757d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007bff] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none",
        className
      )}
      {...props}>

      {children}
    </select>
    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
      <span className="text-[#6c757d]">▼</span>
    </div>
  </div>
);
Select.displayName = "Select";

const SelectTrigger = React.forwardRef<
  React.ElementRef<"button">,
  React.ComponentPropsWithoutRef<"button">>(
  ({ className, children, ...props }, ref) =>
  <button
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-[#ced4da] bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-[#6c757d] focus:outline-none focus:ring-2 focus:ring-[#007bff] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}>

    {children}
    <span className="text-[#6c757d]">▼</span>
  </button>
);
SelectTrigger.displayName = "SelectTrigger";

const SelectValue = React.forwardRef<
  React.ElementRef<"span">,
  React.ComponentPropsWithoutRef<"span"> & {
    placeholder?: string;
  }>(
  ({ className, placeholder, children, ...props }, ref) =>
  <span
    ref={ref}
    className={cn("block truncate", className)}
    {...props}>

    {children || placeholder}
  </span>
);
SelectValue.displayName = "SelectValue";

const SelectContent = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">>(
  ({ className, children, ...props }, ref) =>
  <div
    ref={ref}
    className={cn(
      "absolute z-50 min-w-[8rem] overflow-hidden rounded-md border border-[#dee2e6] bg-white text-[#212529] shadow-md",
      className
    )}
    {...props}>

    {children}
  </div>
);
SelectContent.displayName = "SelectContent";

const SelectItem = React.forwardRef<
  React.ElementRef<"option">,
  React.ComponentPropsWithoutRef<"option">>(
  ({ className, children, ...props }, ref) =>
  <option
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-[#f8f9fa] focus:bg-[#f8f9fa]",
      className
    )}
    {...props}>

    {children}
  </option>
);
SelectItem.displayName = "SelectItem";

export {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue };