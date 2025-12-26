import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Pxl8 from './pages/Pxl8'
import PxlBatch from './pages/PxlBatch'
import Layout from './components/Layout'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Pxl8 />} />
          <Route path="/batch" element={<PxlBatch />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
