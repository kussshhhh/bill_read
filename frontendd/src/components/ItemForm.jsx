import React, { useState, useEffect } from 'react';

const ItemForm = ({ onSubmit, initialValues, currency }) => {
  const [item, setItem] = useState({
    name: '',
    quantity: 1,
    price_per_item: 0,
    total_price: 0,
  });

  useEffect(() => {
    if (initialValues) {
      setItem(initialValues);
    }
  }, [initialValues]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setItem(prevItem => {
      const updatedItem = { ...prevItem, [name]: value };
      if (name === 'quantity' || name === 'price_per_item') {
        updatedItem.total_price = updatedItem.quantity * updatedItem.price_per_item;
      }
      return updatedItem;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(item);
    setItem({ name: '', quantity: 1, price_per_item: 0, total_price: 0 });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.target.name === 'name' && item.name) {
      e.preventDefault();
      document.querySelector('input[name="quantity"]').focus();
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <input
        type="text"
        name="name"
        value={item.name}
        onChange={handleChange}
        onKeyPress={handleKeyPress}
        placeholder="Item name"
        style={styles.input}
        required
      />
      <input
        type="number"
        name="quantity"
        value={item.quantity}
        onChange={handleChange}
        min="1"
        style={styles.input}
        required
      />
      <input
        type="number"
        name="price_per_item"
        value={item.price_per_item}
        onChange={handleChange}
        min="0"
        step="0.01"
        style={styles.input}
        required
      />
      <div style={styles.totalPrice}>
        Total: {currency}{item.total_price.toFixed(2)}
      </div>
      <button type="submit" style={styles.button}>
        {initialValues ? 'Update Item' : 'Add Item'}
      </button>
    </form>
  );
};

const styles = {
  form: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    marginBottom: '20px',
    backgroundColor: '#f8bbd0',
    padding: '15px',
    borderRadius: '8px',
  },
  input: {
    flex: '1 0 200px',
    padding: '10px',
    fontSize: '16px',
    border: '1px solid #f48fb1',
    borderRadius: '4px',
    backgroundColor: 'white',
  },
  totalPrice: {
    flex: '1 0 100%',
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#880e4f',
    marginTop: '10px',
  },
  button: {
    padding: '10px 20px',
    fontSize: '16px',
    backgroundColor: '#b39ddb',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};

export default ItemForm;

