"use client";
import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

// mini cn helper – falls du keinen hast:
const cn = (...a: Array<string | undefined | false | null>) => a.filter(Boolean).join(" ");

export const Tabs = TabsPrimitive.Root;

export const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn("inline-flex items-center rounded-2xl bg-black/30 p-1 border border-white/10", className)}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

export const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "px-3 py-1.5 text-sm rounded-xl transition",
      "data-[state=active]:bg-white/15 data-[state=active]:text-white",
      "data-[state=inactive]:text-white/70 hover:data-[state=inactive]:bg-white/5 hover:data-[state=inactive]:text-white",
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

export const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content ref={ref} className={cn("mt-4 focus:outline-none", className)} {...props} />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;
