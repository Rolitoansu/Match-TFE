import './App.css'
import { AuthProvider } from './context/AuthContext'

function App() {

  return (
    <AuthProvider>
      <div className="App">
        <h1>Hello, World!</h1>
        <h2>Welcome to Match TFE</h2>
      </div>
    </AuthProvider>
  )
}

export default App
