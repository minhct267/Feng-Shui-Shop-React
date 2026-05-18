import { Outlet, createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import Header from './components/Header'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ProductDetailPage from './pages/ProductDetailPage'
import CartPage from './pages/CartPage'
import AdminProductsPage from './pages/AdminProductsPage'
import AddProductPage from './pages/AddProductPage'
import UpdateProductPage from './pages/UpdateProductPage'
import ManageProducts from './components/ManageProducts'

function Layout() {
  return (
    <AuthProvider>
      <CartProvider>
        <Header />
        <Outlet />
        <Footer />
      </CartProvider>
    </AuthProvider>
  )
}

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <main className="pt-20"><HomePage /></main> },
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/products/:productId', element: <main className="pt-20"><ProductDetailPage /></main> },
      { path: '/cart', element: <main className="pt-20"><CartPage /></main> },
      {
        path: '/admin/products',
        element: <AdminProductsPage />,
        children: [
          { index: true, element: <ManageProducts /> },
          { path: 'add', element: <AddProductPage /> },
          { path: 'update/:productId', element: <UpdateProductPage /> },
        ],
      },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
