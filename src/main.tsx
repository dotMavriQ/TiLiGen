import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Use non-strict mode to avoid react-beautiful-dnd issues with React 18
ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />
)