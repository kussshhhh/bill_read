import React from 'react';
import { useDrop } from 'react-dnd';
import { Edit, Trash2 } from 'lucide-react';

const ItemBox = ({ item, currency, onAssign, onEdit, onDelete, additionalCharges, subtotal, onRemoveAssignee }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'person',
    drop: (draggedItem) => onAssign(item.name, draggedItem.name),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  // Calculate proportional additional charges
  const proportion = item.total_price / subtotal;
  const itemAdditionalCharges = additionalCharges * proportion;

  return (
    <div
      ref={drop}
      style={{
        ...styles.itemBox,
        backgroundColor: isOver ? '#fce4ec' : '#f8bbd0',
      }}
    >
      <div style={styles.itemHeader}>
        <span>{item.name} x{item.quantity}</span>
        <span>{currency}{item.total_price.toFixed(2)}</span>
      </div>
      <div style={styles.additionalInfo}>
        <span>+{currency}{itemAdditionalCharges.toFixed(2)} tax/tip</span>
        <span style={styles.totalWithCharges}>
          Total: {currency}{(item.total_price + itemAdditionalCharges).toFixed(2)}
        </span>
      </div>
      <div style={styles.assignees}>
        {item.assignees.map((person) => (
          <span key={person} style={styles.assignedPerson}>
            {person}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemoveAssignee(person);
              }}
              style={styles.removeAssignee}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div style={styles.itemActions}>
        <button onClick={onEdit} style={styles.actionButton}>
          <Edit size={16} />
        </button>
        <button onClick={onDelete} style={styles.actionButton}>
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

const styles = {
  itemBox: {
    position: 'relative',
    width: 'calc(33.33% - 10px)',
    border: '1px solid #f48fb1',
    borderRadius: '8px',
    padding: '15px',
    paddingBottom: '40px',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
  },
  itemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px',
    fontWeight: 'bold',
    color: '#880e4f',
  },
  additionalInfo: {
    fontSize: '0.9em',
    color: '#ad1457',
    marginBottom: '10px',
    display: 'flex',
    flexDirection: 'column',
  },
  totalWithCharges: {
    marginTop: '4px',
    fontWeight: 'bold',
  },
  assignees: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '5px',
    marginBottom: '10px',
  },
  assignedPerson: {
    padding: '4px 8px',
    backgroundColor: '#b39ddb',
    color: 'white',
    borderRadius: '12px',
    fontSize: '12px',
  },
  itemActions: {
    position: 'absolute',
    bottom: '10px',
    right: '10px',
    display: 'flex',
    gap: '8px',
  },
  actionButton: {
    padding: '4px',
    backgroundColor: 'transparent',
    color: '#880e4f',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: 'rgba(0,0,0,0.05)',
    },
  },
  removeAssignee: {
    marginLeft: '4px',
    background: 'none',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '0 2px',
    '&:hover': {
      color: '#ffebee',
    },
  },
};

export default ItemBox;

