import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Plus } from 'lucide-react';
import PersonTag from './PersonTag';
import ItemBox from './ItemBox';
import ItemForm from './ItemForm';

const ReceiptSplitter = ({ receiptData }) => {
  const [people, setPeople] = useState([]);
  const [newPerson, setNewPerson] = useState('');
  const [items, setItems] = useState(receiptData.items.map(item => ({ ...item, assignees: [] })));
  const [editingItem, setEditingItem] = useState(null);
  const [showItemForm, setShowItemForm] = useState(false);

  const additionalCharges = [
    receiptData.tax,
    receiptData.tip,
    receiptData.additional_charges
  ]
    .filter(charge => charge !== "NA")
    .reduce((sum, charge) => sum + (typeof charge === 'number' ? charge : 0), 0);

  const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);
  const total = subtotal + additionalCharges;

  const handlePersonKeyPress = (e) => {
    if (e.key === 'Enter' && newPerson) {
      addPerson();
    }
  };

  const addPerson = useCallback(() => {
    if (newPerson && !people.includes(newPerson)) {
      setPeople(prevPeople => [...prevPeople, newPerson]);
      setNewPerson('');
    }
  }, [newPerson, people]);

  const removePerson = useCallback((personToRemove) => {
    setPeople(prevPeople => prevPeople.filter(person => person !== personToRemove));
    setItems(prevItems => prevItems.map(item => ({
      ...item,
      assignees: item.assignees.filter(person => person !== personToRemove)
    })));
  }, []);

  const assignPersonToItem = useCallback((itemName, personName) => {
    setItems(prevItems => prevItems.map(item => {
      if (item.name === itemName && !item.assignees.includes(personName)) {
        return { ...item, assignees: [...item.assignees, personName] };
      }
      return item;
    }));
  }, []);

  const removeAssignee = useCallback((itemName, personName) => {
    setItems(prevItems => prevItems.map(item => {
      if (item.name === itemName) {
        return {
          ...item,
          assignees: item.assignees.filter(p => p !== personName)
        };
      }
      return item;
    }));
  }, []);

  const addItem = useCallback((newItem) => {
    setItems(prevItems => [...prevItems, { ...newItem, assignees: [] }]);
    setShowItemForm(false);
  }, []);

  const editItem = useCallback((itemName, updatedItem) => {
    setItems(prevItems => prevItems.map(item =>
      item.name === itemName ? { ...item, ...updatedItem } : item
    ));
    setEditingItem(null);
  }, []);

  const deleteItem = useCallback((itemName) => {
    setItems(prevItems => prevItems.filter(item => item.name !== itemName));
  }, []);

  const calculateSplitCosts = useCallback(() => {
    const splitCosts = {};
    people.forEach(person => { splitCosts[person] = 0 });

    items.forEach(item => {
      if (item.assignees.length > 0) {
        const costPerPerson = item.total_price / item.assignees.length;
        item.assignees.forEach(person => {
          splitCosts[person] += costPerPerson;
        });
      }
    });

    const sharedCosts = [receiptData.tax, receiptData.tip, receiptData.additional_charges]
      .filter(cost => cost !== "NA")
      .reduce((sum, cost) => sum + (typeof cost === 'number' ? cost : 0), 0);

    const sharedCostPerPerson = people.length > 0 ? sharedCosts / people.length : 0;
    people.forEach(person => {
      splitCosts[person] += sharedCostPerPerson;
    });

    return splitCosts;
  }, [items, people, receiptData.tax, receiptData.tip, receiptData.additional_charges]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div style={styles.container}>
        <h2 style={styles.title}>{receiptData.name_of_establishment} - Receipt Splitter</h2>
        
        <div style={styles.addPerson}>
          <input
            type="text"
            value={newPerson}
            onChange={(e) => setNewPerson(e.target.value)}
            onKeyPress={handlePersonKeyPress}
            placeholder="Enter name"
            style={styles.input}
          />
          <button onClick={addPerson} style={styles.button}>Add Person</button>
        </div>

        <div style={styles.peopleList}>
          <h3 style={styles.sectionTitle}>People (Drag to assign)</h3>
          <div style={styles.tagContainer}>
            {people.map(person => (
              <PersonTag key={person} name={person} onRemove={removePerson} />
            ))}
          </div>
        </div>

        <div style={styles.itemsList}>
          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>Items (Drop people here to assign)</h3>
            <button
              onClick={() => setShowItemForm(!showItemForm)}
              style={styles.addButton}
            >
              <Plus size={20} />
            </button>
          </div>
          <div style={styles.itemContainer}>
            {items.map((item) => (
              <ItemBox
                key={item.name}
                item={item}
                currency={receiptData.currency}
                onAssign={assignPersonToItem}
                onEdit={() => setEditingItem(item)}
                onDelete={() => deleteItem(item.name)}
                onRemoveAssignee={(person) => removeAssignee(item.name, person)}
                additionalCharges={additionalCharges}
                subtotal={subtotal}
              />
            ))}
          </div>
        </div>

        {showItemForm && (
          <ItemForm
            onSubmit={addItem}
            currency={receiptData.currency}
          />
        )}

        {editingItem && (
          <div 
            style={styles.editFormOverlay}
            onClick={() => setEditingItem(null)}
          >
            <div 
              style={styles.editForm}
              onClick={e => e.stopPropagation()}
            >
              <div style={styles.editFormHeader}>
                <h3>Edit Item</h3>
                <button
                  onClick={() => setEditingItem(null)}
                  style={styles.closeButton}
                >
                  ×
                </button>
              </div>
              <ItemForm
                onSubmit={(item) => editItem(editingItem.name, item)}
                initialValues={editingItem}
                currency={receiptData.currency}
              />
            </div>
          </div>
        )}

        <div style={styles.totalSection}>
          <div style={styles.totalRow}>
            <span>Subtotal:</span>
            <span>{receiptData.currency}{subtotal.toFixed(2)}</span>
          </div>
          <div style={styles.totalRow}>
            <span>Tax + Tip + Additional:</span>
            <span>{receiptData.currency}{additionalCharges.toFixed(2)}</span>
          </div>
          <div style={styles.totalRow}>
            <span style={styles.grandTotal}>Total:</span>
            <span style={styles.grandTotal}>{receiptData.currency}{total.toFixed(2)}</span>
          </div>
        </div>

        <div style={styles.splitCosts}>
          <h3 style={styles.sectionTitle}>Split Costs</h3>
          {Object.entries(calculateSplitCosts()).map(([person, cost]) => (
            <div key={person} style={styles.splitCostItem}>
              <span>{person}</span>
              <span>{receiptData.currency}{cost.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </DndProvider>
  );
};

ReceiptSplitter.propTypes = {
  receiptData: PropTypes.shape({
    name_of_establishment: PropTypes.string.isRequired,
    currency: PropTypes.string.isRequired,
    items: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string.isRequired,
      quantity: PropTypes.number.isRequired,
      price_per_item: PropTypes.number.isRequired,
      total_price: PropTypes.number.isRequired,
    })).isRequired,
    number_of_items: PropTypes.number.isRequired,
    subtotal: PropTypes.number.isRequired,
    tax: PropTypes.oneOfType([PropTypes.number, PropTypes.oneOf(["NA"])]).isRequired,
    tip: PropTypes.oneOfType([PropTypes.number, PropTypes.oneOf(["NA"])]).isRequired,
    additional_charges: PropTypes.oneOfType([PropTypes.number, PropTypes.oneOf(["NA"])]).isRequired,
    total: PropTypes.number.isRequired,
  }).isRequired,
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '20px auto',
    padding: '20px',
    boxShadow: '0 0 20px rgba(0,0,0,0.1)',
    borderRadius: '12px',
    backgroundColor: '#ffffff',
    fontFamily: 'Arial, sans-serif',
  },
  title: {
    textAlign: 'center',
    color: '#333',
    marginBottom: '20px',
  },
  addPerson: {
    display: 'flex',
    marginBottom: '20px',
  },
  input: {
    flex: 1,
    padding: '12px',
    marginRight: '10px',
    borderRadius: '6px',
    border: '1px solid #b39ddb',
    fontSize: '16px',
  },
  button: {
    padding: '12px 24px',
    backgroundColor: '#b39ddb',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'background-color 0.3s',
  },
  sectionTitle: {
    color: '#333',
    marginBottom: '15px',
  },
  peopleList: {
    marginBottom: '30px',
  },
  tagContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
  },
  itemsList: {
    marginBottom: '30px',
  },
  itemContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '15px',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '15px',
  },
  addButton: {
    padding: '4px',
    backgroundColor: '#b39ddb',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    transition: 'transform 0.2s ease',
  },
  totalSection: {
    backgroundColor: '#f5f5f5',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '30px',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    fontSize: '16px',
  },
  grandTotal: {
    fontWeight: 'bold',
    fontSize: '18px',
    color: '#333',
  },
  splitCosts: {
    backgroundColor: '#f9f9f9',
    padding: '20px',
    borderRadius: '8px',
  },
  splitCostItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 0',
    borderBottom: '1px solid #eee',
    fontSize: '16px',
  },
  editFormOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  editForm: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    width: '90%',
    maxWidth: '500px',
  },
  editFormHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    color: '#666',
    cursor: 'pointer',
    padding: '4px 8px',
    '&:hover': {
      color: '#333',
    },
  },
};

export default ReceiptSplitter;

