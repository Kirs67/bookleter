import { BrowserRouter, Routes, Route } from "npm:react-router-dom@6";
import './App.css'
import Index from "./pages/index.tsx";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
