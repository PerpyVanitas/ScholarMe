"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Tabs } from "@/components/ui/tabs";
import React from "react";

interface SyncTabsProps extends React.ComponentProps<typeof Tabs> {
  defaultValue: string;
}

export function SyncTabs({
  defaultValue,
  children,
  className,
  ...props
}: SyncTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const tab = searchParams.get("tab") || defaultValue;

  return (
    <Tabs
      value={tab}
      onValueChange={(val) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("tab", val);
        router.push(pathname + "?" + params.toString(), { scroll: false });
      }}
      className={className}
      {...props}
    >
      {children}
    </Tabs>
  );
}
