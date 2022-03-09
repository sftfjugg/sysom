import { useState, useCallback } from 'react'
import { request } from 'umi';

export default () => {
  const [count, setCount] = useState(0)

  const handleCount = useCallback((value) => {
    setCount(() => { 
      return value || 0
    })
  }, [])

  return {
    count,
    handleCount,
  }
}
