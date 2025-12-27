import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Pxl8 from './pages/Pxl8'
import PxlBatch from './pages/PxlBatch'
import Layout from './components/Layout'
import './App.css'

function App() {
  // Set basename only in production (for GitHub Pages)
  const basename = import.meta.env.PROD ? '/pxl8' : '/'
  
  return (
    <BrowserRouter basename={basename}>
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
