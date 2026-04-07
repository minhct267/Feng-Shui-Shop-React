import { Outlet, createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Header from './components/Header'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import AdminProductsPage from './pages/AdminProductsPage'
import AddProductPage from './pages/AddProductPage'
import ManageProducts from './components/ManageProducts'

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
      {
        path: '/admin/products',
        element: <AdminProductsPage />,
        children: [
          { index: true, element: <ManageProducts /> },
          { path: 'add', element: <AddProductPage /> },
        ],
      },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
