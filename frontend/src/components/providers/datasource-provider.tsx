"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "sql-ai:active-datasource";

type DatasourceContextValue = {
  activeDatasourceId: string | null;
  setActiveDatasourceId: (id: string | null) => void;
};

const DatasourceContext = createContext<DatasourceContextValue | null>(null);

function DatasourceProvider({ children }: { children: React.ReactNode }) {
  const [activeDatasourceId, setActiveDatasourceIdState] = useState<
    string | null
  >(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setActiveDatasourceIdState(stored);
    }
  }, []);

  const setActiveDatasourceId = useCallback((id: string | null) => {
    setActiveDatasourceIdState(id);
    if (id) {
      localStorage.setItem(STORAGE_KEY, id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const value = useMemo(
    () => ({ activeDatasourceId, setActiveDatasourceId }),
    [activeDatasourceId, setActiveDatasourceId],
  );

  return (
    <DatasourceContext.Provider value={value}>
      {children}
    </DatasourceContext.Provider>
  );
}

function useActiveDatasource() {
  const context = useContext(DatasourceContext);
  if (!context) {
    throw new Error(
      "useActiveDatasource must be used within DatasourceProvider",
    );
  }
  return context;
}

export { DatasourceProvider, useActiveDatasource };
