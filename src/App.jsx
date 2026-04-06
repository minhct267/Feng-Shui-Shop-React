import { Outlet, createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Header from './components/Header'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import AddProductPage from './pages/AddProductPage'

function Layout() {
  return (
    <AuthProvider>
      <Header />
      <Outlet />
      <Footer />
    </AuthProvider>
  )
}

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <main className="pt-20"><HomePage /></main> },
      { path: '/login', element: <LoginPage /> },
      { path: '/admin/products/add', element: <AddProductPage /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
