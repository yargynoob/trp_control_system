"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const Dialog = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div"> & {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }>(
  ({ className, open, onOpenChange, children, ...props }, ref) => {
    if (!open) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
          className="fixed inset-0 bg-black/50"
          onClick={() => onOpenChange?.(false)} />

      <div
          ref={ref}
          className={cn(
            "relative bg-white rounded-lg shadow-lg w-90 mx-4 overflow-hidden",
            className
          )}
          {...props}>

        {children}
      </div>
    </div>);

  });
Dialog.displayName = "Dialog";

const DialogContent = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">>(
  ({ className, children, ...props }, ref) =>
  <div
    ref={ref}
    className={cn("relative bg-white rounded-lg shadow-lg overflow-y-auto scrollbar-hide", className)}
    style={{
      scrollbarWidth: 'none', /* Firefox */
      msOverflowStyle: 'none' /* Internet Explorer 10+ */
    }}
    {...props}>

    {children}
  </div>
);
DialogContent.displayName = "DialogContent";

const DialogHeader = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">>(
  ({ className, ...props }, ref) =>
  <div
    ref={ref}
    className={cn("mb-4", className)}
    {...props} />

);
DialogHeader.displayName = "DialogHeader";

const DialogTitle = React.forwardRef<
  React.ElementRef<"h2">,
  React.ComponentPropsWithoutRef<"h2">>(
  ({ className, ...props }, ref) =>
  <h2
    ref={ref}
    className={cn("text-lg font-semibold text-[#212529]", className)}
    {...props} />

);
DialogTitle.displayName = "DialogTitle";

const DialogDescription = React.forwardRef<
  React.ElementRef<"p">,
  React.ComponentPropsWithoutRef<"p">>(
  ({ className, ...props }, ref) =>
  <p
    ref={ref}
    className={cn("text-sm text-[#6c757d] mt-2", className)}
    {...props} />

);
DialogDescription.displayName = "DialogDescription";

export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription };