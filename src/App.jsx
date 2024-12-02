import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Forecast from './forecasting component/forecastcourses'


function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <Forecast />
        
      </div>
    
    </>
  )
}

export default App
