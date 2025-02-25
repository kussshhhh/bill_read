import React from 'react';
import { useDrag } from 'react-dnd';

const PersonTag = ({ name, onRemove }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'person',
    item: { name },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <span
      ref={drag}
      style={{
        ...styles.personTag,
        opacity: isDragging ? 0.5 : 1,
        cursor: 'move',
      }}
    >
      {name}
      <button onClick={() => onRemove(name)} style={styles.removeButton}>×</button>
    </span>
  );
};

const styles = {
  personTag: {
    display: 'inline-block',
    padding: '8px 12px',
    backgroundColor: '#b3e5fc',
    color: '#01579b',
    borderRadius: '20px',
    position: 'relative',
    fontSize: '14px',
    transition: 'all 0.3s',
  },
  removeButton: {
    marginLeft: '8px',
    background: 'none',
    border: 'none',
    color: '#01579b',
    cursor: 'pointer',
    fontSize: '16px',
  },
};

export default PersonTag;

