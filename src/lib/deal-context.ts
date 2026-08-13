"use client";

import { useEffect, useState } from "react";

export type DealContext = {
  customerId?: string;
  customerName?: string;
  customerRut?: string;
  versionId?: string;
  vehicleLabel?: string;
  quoteId?: string;
  updatedAt?: string;
};

const STORAGE_KEY = "panel360_deal_context";

export function getStoredDealContext(): DealContext {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function setStoredDealContext(context: Partial<DealContext>) {
  if (typeof window === "undefined") return;
  try {
    const current = getStoredDealContext();
    const updated = {
      ...current,
      ...context,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage errors
  }
}

export function clearDealContext() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

export function useDealContext() {
  const [context, setContext] = useState<DealContext>({});

  useEffect(() => {
    setContext(getStoredDealContext());
  }, []);

  const updateContext = (next: Partial<DealContext>) => {
    setStoredDealContext(next);
    setContext(getStoredDealContext());
  };

  const resetContext = () => {
    clearDealContext();
    setContext({});
  };

  return { context, updateContext, resetContext };
}
