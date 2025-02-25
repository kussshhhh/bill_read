import React, { useState, useEffect } from 'react';
import { Home, Menu, X } from 'lucide-react';
import ReceiptAnalyzer from './components/ReceiptAnalyzer';
import { Auth, AuthResponse } from './components/Auth';
import './App.css';


interface BillState {
  receipt: {
    name_of_establishment: string;
    currency: string;
    total: number;
  };
  splitState: {
    people: string[];
    assignments: Record<string, any>;
    [key: string]: any;
  };
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentBillState, setCurrentBillState] = useState<BillState | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      // Validate the token
      
      if(isTokenValid(token)){
        setIsAuthenticated(true);
      }
      else{
        setIsAuthenticated(false) ;
      }
      
    }
  }, []);

  const isTokenValid = (token: string): boolean => {
    try {
      const payload = token.split('.')[1];
      const decodedPayload = JSON.parse(atob(payload));
      // Check if token is expired
      const currentTime = Math.floor(Date.now() / 1000);
      return decodedPayload.exp > currentTime;
    } catch (error) {
      console.error('Error validating token:', error);
      return false;
    }
  };

  const handleAuthSuccess = (response: AuthResponse) => {
    setIsAuthenticated(true);
    localStorage.setItem('jwt_token', response.jwtToken);

  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('jwt_token');
    setCurrentBillState(null);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsSidebarOpen(false);
    }
  };

  if (!isAuthenticated) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="App">
      <header className="header">
        <div className="header-left">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="menu-button"
            aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            <Menu size={24} />
          </button>
        </div>
        
        <h1 className="title">splitty</h1>
        
        <div className="header-right">
          <button
            onClick={() => {
              setCurrentBillState(null);
              window.location.reload();
            }}
            className="home-button"
            aria-label="Home"
          >
            <Home size={24} />
          </button>
          <button
            onClick={handleLogout}
            className="logout-button"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="main-content">
        <div className="dropbox-container">
          <ReceiptAnalyzer
            initialState={currentBillState}
            onSaveBillState={(receiptData, splitState) => {
              setCurrentBillState({
                receipt: receiptData,
                splitState: {
                  people: splitState?.people || [],
                  assignments: splitState?.assignments || {},
                  ...splitState,
                },
              });
            }}
            onUpdateBillState={(splitState) => {
              if (currentBillState) {
                setCurrentBillState({
                  ...currentBillState,
                  splitState,
                });
              }
            }}
          />
        </div>
      </main>
 

      <aside
        className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}
        role="complementary"
        aria-label="Previous bills"
        onKeyDown={handleKeyDown}
      >
        <div className="sidebar-header">
          <h2 className="sidebar-title">Previous Bills</h2>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="close-button"
            aria-label="Close sidebar"
          >
            <X size={24} />
          </button>
        </div>
        <div className="bills-list">
          <p className="empty-state">No previous bills</p>
        </div>
      </aside>

      {isSidebarOpen && (
        <div
          className="overlay"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
