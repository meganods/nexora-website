"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface LocationContextType {
  selectedCity: string;
  setSelectedCity: (city: string) => void;
}

const LocationContext = createContext<LocationContextType>({
  selectedCity: 'Delhi',
  setSelectedCity: () => {},
});

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [selectedCity, setSelectedCityState] = useState('Delhi');

  useEffect(() => {
    const stored = localStorage.getItem('nexora_selected_city');
    if (stored) {
      setSelectedCityState(stored);
    }
  }, []);

  const setSelectedCity = (city: string) => {
    localStorage.setItem('nexora_selected_city', city);
    setSelectedCityState(city);
  };

  return (
    <LocationContext.Provider value={{ selectedCity, setSelectedCity }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  return useContext(LocationContext);
}
