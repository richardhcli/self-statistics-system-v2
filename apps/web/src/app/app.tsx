/**
 * App Component (Root)
 * 
 * Application entry point that initializes persistence and renders routing.
 * Handles loading state during IndexedDB initialization.
 * 
 * Responsibilities:
 * - Wait for IndexedDB persistence initialization when entering /app routes
 * - Render URL-based routing structure
 * - Show loading screen during initialization of protected areas
 * 
 * @returns JSX.Element App content or loading screen
 */

import React from "react";
import { useLocation } from "react-router-dom";
import { usePersistence } from "../hooks/use-persistence";
import { AppRoutes } from "./routes";
import { clearIndexedDBConditional } from "../testing";

/**
 * TEMPORARY: Clear IndexedDB on app load (debugging hydration issues)
 * @deprecated Remove this after debugging is complete
 */
// console.warn("[App] Clearing IndexedDB for debugging purposes. Remove in final app.");
clearIndexedDBConditional().catch(console.error);

const App: React.FC = () => {
  console.log("[App] Starting");

  const location = useLocation();
  const { isInitialized } = usePersistence();
  const requiresPersistence = location.pathname.startsWith("/app");

  React.useEffect(() => {
    console.log("[App] Persistence initialized:", isInitialized);
  }, [isInitialized]);

  // Show loading state until persistence is initialized
  if (requiresPersistence && !isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-slate-700 dark:text-slate-300">Initializing application...</p>
        </div>
      </div>
    );
  }

  // Render app routing
  return <AppRoutes />;
};

export default App;