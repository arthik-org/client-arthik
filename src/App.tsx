import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { Home } from "./pages/Home"
import { LanguageProvider } from "./context/LanguageContext"

function App() {
  return (
    <LanguageProvider>
      <Router>
        <Routes>
          <Route path="/" element={<div />} />
          <Route path="/home" element={<Home />} />
        </Routes>
      </Router>
    </LanguageProvider>
  )
}

export default App
