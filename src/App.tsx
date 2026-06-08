import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-100 dark:from-secondary-900 dark:to-secondary-950">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-primary-600 dark:text-primary-400 mb-4">
            FlowPay Console
          </h1>
          <p className="text-xl text-secondary-700 dark:text-secondary-300 mb-8">
            Real-Time Payment Processing Platform
          </p>
          
          <div className="max-w-md mx-auto bg-white dark:bg-secondary-800 rounded-2xl shadow-xl p-8">
            <div className="mb-6">
              <button
                onClick={() => setCount((count) => count + 1)}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
              >
                Count is {count}
              </button>
            </div>
            
            <div className="space-y-3 text-sm text-secondary-600 dark:text-secondary-400">
              <p>✅ React 18 + TypeScript</p>
              <p>✅ Vite Build Tool</p>
              <p>✅ TailwindCSS Configured</p>
              <p>✅ Path Aliases Ready</p>
              <p>✅ Development Server Running</p>
            </div>
          </div>

          <div className="mt-8 text-secondary-600 dark:text-secondary-400">
            <p className="text-sm">Day 1 Setup Complete! 🚀</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
