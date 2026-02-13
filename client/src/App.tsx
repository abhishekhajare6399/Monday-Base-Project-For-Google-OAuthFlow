import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import HelloWorld from './components/helloWorld'
import './App.css'
import { useMondayTheme } from './hooks/useMondayTheme'
import './css/monday-theme.css'

function App() {
  const mondayTheme = useMondayTheme();

  // Apply theme to the root element and body
  useEffect(() => {
    // Apply theme as data attribute to root
    document.documentElement.setAttribute('data-monday-theme', mondayTheme);
    // Also add as class for easier CSS targeting
    document.documentElement.className = `monday-theme-${mondayTheme}`;
    // Apply to body as well
    document.body.setAttribute('data-monday-theme', mondayTheme);
    document.body.className = `monday-theme-${mondayTheme}`;
    }, [mondayTheme]);

  return (
    <BrowserRouter>
      <div className="App" data-theme={mondayTheme}>

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
