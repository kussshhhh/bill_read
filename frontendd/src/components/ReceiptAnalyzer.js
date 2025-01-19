import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import ReceiptSplitter from './ReceiptSplitter';

function ReceiptAnalyzer() {
  const [response, setResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showJson, setShowJson] = useState(false);

  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    setIsLoading(true);
    setError(null);
    setImagePreview(URL.createObjectURL(acceptedFiles[0]));

    const formData = new FormData();
    formData.append('image', acceptedFiles[0]);

    try {
      const result = await axios.post(`${backendUrl}/analyze_receipt`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResponse(result.data);
    } catch (err) {
      setError(
        err.response?.data?.error ||
        'An error occurred while analyzing the receipt. Please try again.'
      );
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [backendUrl]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: {'image/*': []},
  });

  const resetAnalysis = () => {
    setResponse(null);
    setImagePreview(null);
    setError(null);
  };

  const formatJSON = (json) => JSON.stringify(json, null, 2);

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Receipt Analyzer</h2>
      {!response && (
        <div style={styles.dropzone} {...getRootProps()}>
          <input {...getInputProps()} />
          {isDragActive ? (
            <p>Drop the receipt image here...</p>
          ) : (
            <p>Drag 'n' drop a receipt image here, or click to select a file</p>
          )}
        </div>
      )}

      {imagePreview && (
        <div style={styles.imagePreview}>
          <h3>Uploaded Image:</h3>
          <img src={imagePreview || "/placeholder.svg"} alt="Uploaded Receipt" style={styles.previewImage} />
        </div>
      )}

      {isLoading && (
        <div style={styles.message}>
          <p>Analyzing receipt...</p>
        </div>
      )}

      {error && (
        <div style={styles.error}>
          <p>{error}</p>
        </div>
      )}

      {response && (
        <div>
          <button onClick={resetAnalysis} style={styles.button}>Back to Upload</button>
          <button onClick={() => setShowJson(!showJson)} style={styles.button}>
            {showJson ? 'Hide' : 'Show'} JSON
          </button>
          {showJson && (
            <div style={styles.result}>
              <h3>Analysis Result:</h3>
              <pre style={styles.jsonDisplay}>
                {formatJSON(response)}
              </pre>
            </div>
          )}
          <ReceiptSplitter receiptData={response} />
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
  },
  title: {
    textAlign: 'center',
    color: '#333',
  },
  dropzone: {
    border: '2px dashed #cccccc',
    borderRadius: '4px',
    padding: '20px',
    textAlign: 'center',
    cursor: 'pointer',
    backgroundColor: '#f8f8f8',
    transition: 'background-color 0.3s',
  },
  message: {
    marginTop: '20px',
    padding: '10px',
    backgroundColor: '#e8f5e9',
    borderRadius: '4px',
    textAlign: 'center',
  },
  error: {
    marginTop: '20px',
    padding: '10px',
    backgroundColor: '#ffebee',
    color: '#d32f2f',
    borderRadius: '4px',
    textAlign: 'center',
  },
  result: {
    marginTop: '20px',
    padding: '20px',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px',
  },
  jsonDisplay: {
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
    backgroundColor: '#f8f8f8',
    border: '1px solid #ddd',
    padding: '10px',
    borderRadius: '4px',
    fontSize: '14px',
    lineHeight: '1.4',
    maxHeight: '400px',
    overflowY: 'auto',
  },
  imagePreview: {
    marginTop: '20px',
    padding: '20px',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px',
    textAlign: 'center',
  },
  previewImage: {
    maxWidth: '100%',
    maxHeight: '400px',
    borderRadius: '4px',
  },
  button: {
    backgroundColor: '#4CAF50',
    border: 'none',
    color: 'white',
    padding: '10px 20px',
    textAlign: 'center',
    textDecoration: 'none',
    display: 'inline-block',
    fontSize: '16px',
    margin: '4px 2px',
    cursor: 'pointer',
    borderRadius: '4px',
    transition: 'background-color 0.3s',
  },
};

export default ReceiptAnalyzer;