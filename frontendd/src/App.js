import React, { useState, useEffect } from 'react';
import { Home, Menu, X } from 'lucide-react';
import ReceiptAnalyzer from './components/ReceiptAnalyzer';

// IndexedDB initialization
const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('splittyDB', 1);

    request.onerror = () => reject(request.error);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create bills store with complete state
      if (!db.objectStoreNames.contains('bills')) {
        const billStore = db.createObjectStore('bills', { keyPath: 'id' });
        // Index for quick access by timestamp
        billStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
  });
};

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [previousBills, setPreviousBills] = useState([]);
  const [db, setDb] = useState(null);
  const [currentBillId, setCurrentBillId] = useState(null);
  const [currentBillState, setCurrentBillState] = useState(null);

  // Initialize IndexedDB
  useEffect(() => {
    initDB()
      .then(database => {
        setDb(database);
        loadBills(database);
      })
      .catch(error => console.error('Error initializing database:', error));
  }, []);

  const loadBills = (database) => {
    const transaction = database.transaction(['bills'], 'readonly');
    const store = transaction.objectStore('bills');
    const index = store.index('timestamp');
    const request = index.getAll();

    request.onsuccess = () => {
      setPreviousBills(request.result.sort((a, b) => b.timestamp - a.timestamp));
    };
  };

  const saveBillState = (receiptData, splitState = {}) => {
    if (!db) return;

    const billState = {
      id: Date.now(),
      timestamp: Date.now(),
      receipt: receiptData,
      splitState: {
        people: splitState.people || [],
        assignments: splitState.assignments || {},
        ...splitState
      }
    };

    const transaction = db.transaction(['bills'], 'readwrite');
    const store = transaction.objectStore('bills');
    store.add(billState);

    transaction.oncomplete = () => {
      setCurrentBillId(billState.id);
      loadBills(db);
    };
  };

  const updateBillState = (billId, splitState) => {
    if (!db) return;

    const transaction = db.transaction(['bills'], 'readwrite');
    const store = transaction.objectStore('bills');
    const request = store.get(billId);

    request.onsuccess = () => {
      const bill = request.result;
      if (bill) {
        bill.splitState = splitState;
        bill.lastUpdated = Date.now();
        store.put(bill);
      }
    };

    transaction.oncomplete = () => {
      loadBills(db);
    };
  };

  const loadBillState = (billId) => {
    if (!db) return;

    const transaction = db.transaction(['bills'], 'readonly');
    const store = transaction.objectStore('bills');
    const request = store.get(billId);

    request.onsuccess = () => {
      if (request.result) {
        setCurrentBillId(billId);
        setCurrentBillState(request.result);
        setIsSidebarOpen(false);  // Close sidebar after selection
      }
    };
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="App">
      <div style={styles.header}>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          style={styles.menuButton}
          aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          <Menu size={24} />
        </button>
        <h1 style={styles.title}>splitty</h1>
        <button 
          onClick={() => {
            setCurrentBillId(null);
            setCurrentBillState(null);
            window.location.reload();
          }} 
          style={styles.homeButton}
          aria-label="Home"
        >
          <Home size={24} />
        </button>
      </div>

      {/* Sidebar */}
      <div 
        style={{
          ...styles.sidebar,
          transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)'
        }}
        role="complementary"
        aria-label="Previous bills"
        onKeyDown={handleKeyDown}
      >
        <div style={styles.sidebarHeader}>
          <h2 style={styles.sidebarTitle}>Previous Bills</h2>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            style={styles.closeButton}
            aria-label="Close sidebar"
          >
            <X size={24} />
          </button>
        </div>

        <div style={styles.billsList}>
          {previousBills.length === 0 ? (
            <p style={styles.emptyState}>No previous bills</p>
          ) : (
            previousBills.map(bill => (
              <div 
                key={bill.id} 
                style={{
                  ...styles.billItem,
                  backgroundColor: currentBillId === bill.id ? '#f0f0f0' : 'transparent'
                }}
                onClick={() => loadBillState(bill.id)}
              >
                <h4 style={styles.billTitle}>
                  {bill.receipt.name_of_establishment}
                </h4>
                <p>{new Date(bill.timestamp).toLocaleDateString()}</p>
                <p>
                  {bill.receipt.currency}
                  {bill.receipt.total.toFixed(2)}
                </p>
                <p style={styles.billDetails}>
                  Split between {bill.splitState.people.length} people
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Overlay */}
      {isSidebarOpen && (
        <div 
          style={styles.overlay}
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <ReceiptAnalyzer 
        initialState={currentBillState}
        onSaveBillState={saveBillState}
        onUpdateBillState={(splitState) => {
          if (currentBillId) {
            updateBillState(currentBillId, splitState);
          }
        }}
      />
    </div>
  );
}

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    position: 'relative',
    zIndex: 2,
    backgroundColor: 'white',
  },
  title: {
    margin: 0,
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    color: '#333',
  },
  menuButton: {
    backgroundColor: '#b39ddb',
    border: 'none',
    color: 'white',
    padding: '8px',
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.3s',
    zIndex: 3,
  },
  homeButton: {
    backgroundColor: '#b39ddb',
    border: 'none',
    color: 'white',
    padding: '8px',
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.3s',
  },
  sidebar: {
    position: 'fixed',
    top: 0,
    left: 0,
    height: '100vh',
    width: '300px',
    backgroundColor: 'white',
    boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
    transition: 'transform 0.3s ease-in-out',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 999,
  },
  sidebarHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '1px solid #eee',
  },
  sidebarTitle: {
    margin: 0,
    color: '#333',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: '#666',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  billsList: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px',
  },
  billItem: {
    padding: '15px',
    borderBottom: '1px solid #eee',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: '#f5f5f5',
    },
  },
  billTitle: {
    margin: '0 0 8px 0',
    color: '#333',
    fontWeight: 'bold',
  },
  billDetails: {
    fontSize: '0.9em',
    color: '#666',
    marginTop: '4px',
  },
  emptyState: {
    textAlign: 'center',
    color: '#666',
    margin: '10px 0',
    fontStyle: 'italic',
  },
};

export default App;