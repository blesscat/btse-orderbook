import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Orderbook from './pages/orderbook'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/orderbook" element={<Orderbook />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
