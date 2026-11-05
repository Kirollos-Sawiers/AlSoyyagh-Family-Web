import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LoginPage, JoinPage, ChangePasswordPage } from './features/auth'
import { ArchiveWorkspacePage } from './features/workspace'
import { HomePage } from './features/tree'
import { useHealthPing } from './hooks/useHealthPing'

function App() {
  useHealthPing()

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/tree" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/join" element={<JoinPage />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />
        <Route path="/workspace" element={<ArchiveWorkspacePage />} />
        <Route path="/admin" element={<ArchiveWorkspacePage />} />
        <Route path="/archive-workspace" element={<ArchiveWorkspacePage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
