import { BrowserRouter, Routes, Route } from "npm:react-router-dom@6";
import './App.css'
import Index from "./pages/index.tsx";

function App() {
  return (
    <>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route path="/" element={<Index />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
