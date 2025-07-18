
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import apiFetch from '@/lib/api';

// Define the Guard type - this should match the object structure from your backend API
export interface Guard {
  id: string;
  name: string;
  role: string;
  location: string;
  hourlyRate?: number;
  dailyRate?: number;
  monthlyRate?: number;
  rating: number;
  experience: number;
  skills: string[];
  bio?: string;
  profilePictureUrl?: string; // Expecting a URL from the backend
}

// Define the context shape
interface GuardsContextType {
  guards: Guard[];
  isLoading: boolean;
  refetchGuards: () => void;
}

// Create the context
const GuardsContext = createContext<GuardsContextType | undefined>(undefined);

// Create the provider component
export const GuardsProvider = ({ children }: { children: ReactNode }) => {
  const [guards, setGuards] = useState<Guard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGuards = useCallback(async () => {
    setIsLoading(true);
    try {
      // Assuming your backend returns an array of guards
      const data = await apiFetch('/api/guards');
      setGuards(data || []);
    } catch (error) {
      console.error("Failed to fetch guards:", error);
      setGuards([]); // Set to empty array on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGuards();
  }, [fetchGuards]);


  return (
    <GuardsContext.Provider value={{ guards, isLoading, refetchGuards: fetchGuards }}>
      {children}
    </GuardsContext.Provider>
  );
};

// Create a custom hook for using the context
export const useGuards = () => {
  const context = useContext(GuardsContext);
  if (context === undefined) {
    throw new Error('useGuards must be used within a GuardsProvider');
  }
  return context;
};
