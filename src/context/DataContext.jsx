import { createContext, useContext } from 'react'
import { RECIPIENTS as INIT_RECIPIENTS } from '../data/recipients.js'
import { CAREGIVERS as INIT_CAREGIVERS } from '../data/caregivers.js'
import { useLocalStorage } from '../utils/useLocalStorage.js'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const [recipients, setRecipients] = useLocalStorage('redapple_recipients', INIT_RECIPIENTS)
  const [caregivers, setCaregivers] = useLocalStorage('redapple_caregivers', INIT_CAREGIVERS)

  const addRecipient    = (r)  => setRecipients(prev => [...prev, r])
  const updateRecipient = (r)  => setRecipients(prev => prev.map(x => x.id === r.id ? r : x))
  const deleteRecipient = (id) => setRecipients(prev => prev.filter(x => x.id !== id))

  const addCaregiver    = (c)  => setCaregivers(prev => [...prev, c])
  const updateCaregiver = (c)  => setCaregivers(prev => prev.map(x => x.id === c.id ? c : x))
  const deleteCaregiver = (id) => setCaregivers(prev => prev.filter(x => x.id !== id))

  return (
    <DataContext.Provider value={{
      recipients, setRecipients, addRecipient, updateRecipient, deleteRecipient,
      caregivers, setCaregivers, addCaregiver, updateCaregiver, deleteCaregiver,
    }}>
      {children}
    </DataContext.Provider>
  )
}

export const useData = () => useContext(DataContext)
