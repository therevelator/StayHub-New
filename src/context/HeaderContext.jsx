import { createContext, useState, useContext } from 'react';

const HeaderContext = createContext();

export function HeaderProvider({ children }) {
  const [headerRendered, setHeaderRendered] = useState(false);
  
  // Add a function to reset the header state
  const resetHeaderState = () => {
    setHeaderRendered(false);
  };
  
  return (
    <HeaderContext.Provider value={{ headerRendered, setHeaderRendered, resetHeaderState }}>
      {children}
    </HeaderContext.Provider>
  );
}

export function useHeader() {
  return useContext(HeaderContext);
} 