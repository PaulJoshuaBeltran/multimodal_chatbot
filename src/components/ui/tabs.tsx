// src/components/ui/tabs.tsx
"use client"

import * as React from "react"
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const TabsOrientationContext = React.createContext<"horizontal" | "vertical">(
  "horizontal"
)

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsOrientationContext.Provider value={orientation}>
      <TabsPrimitive.Root
        data-slot="tabs"
        orientation={orientation}
        data-orientation={orientation}
        className={cn(
          "group/tabs flex gap-2",
          orientation === "horizontal" ? "flex-col" : "flex-row",
          className
        )}
        {...props}
      />
    </TabsOrientationContext.Provider>
  )
}

const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit items-center justify-center rounded-lg p-[3px] text-muted-foreground data-[variant=line]:rounded-none",
  {
    variants: {
      variant: {
        default: "bg-muted",
        line: "gap-1 bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function TabsList({
  className,
  variant = "default",
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  const orientation = React.useContext(TabsOrientationContext)
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(
        tabsListVariants({ variant }),
        orientation === "horizontal" ? "h-8" : "h-fit flex-col",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  const orientation = React.useContext(TabsOrientationContext)
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-1.5 py-0.5 text-sm font-medium whitespace-nowrap text-foreground/60 transition-all hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 has-data-[icon=inline-end]:pr-1 has-data-[icon=inline-start]:pl-1 aria-disabled:pointer-events-none aria-disabled:opacity-50 dark:text-muted-foreground dark:hover:text-foreground data-[variant=default]:data-active:shadow-sm data-[variant=line]:data-active:shadow-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        orientation === "vertical" && "w-full justify-start",
        "data-[variant=line]:bg-transparent data-[variant=line]:data-active:bg-transparent dark:data-[variant=line]:data-active:border-transparent dark:data-[variant=line]:data-active:bg-transparent",
        "data-active:bg-background data-active:text-foreground dark:data-active:border-input dark:data-active:bg-input/30 dark:data-active:text-foreground",
        orientation === "horizontal"
          ? "after:absolute after:bg-foreground after:opacity-0 after:transition-opacity after:inset-x-0 after:bottom-[-5px] after:h-0.5 data-[variant=line]:data-active:after:opacity-100"
          : "after:absolute after:bg-foreground after:opacity-0 after:transition-opacity after:inset-y-0 after:-right-1 after:w-0.5 data-[variant=line]:data-active:after:opacity-100",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("flex-1 text-sm outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }