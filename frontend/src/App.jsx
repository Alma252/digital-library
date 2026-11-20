import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import ResourceDetail from './pages/ResourceDetail'
import ResourceList from './pages/ResourceList'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<ResourceList />} />
        <Route path="resources/:id" element={<ResourceDetail />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
      </Route>
    </Routes>
  )
}
