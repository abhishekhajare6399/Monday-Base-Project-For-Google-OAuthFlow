import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import HelloWorld from './components/helloWorld'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <BrowserRouter>
    <div className="App">
      <Routes>
        <Route path="/googledrive" element={<HelloWorld />} />
        <Route path="/" element={<Navigate to="/googledrive" replace />} />
        {/* Catch all other routes and redirect to /googledrive */}
        <Route path="*" element={<Navigate to="/googledrive" replace />} />
      </Routes>
    </div>
  </BrowserRouter>
  )
}

export default App
