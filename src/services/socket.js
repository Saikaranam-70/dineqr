import { io } from 'socket.io-client'

const URL = import.meta.env.VITE_SOCKET_URL || ''

let customerSocket = null
let adminSocket = null

export const connectCustomer = (sessionToken) => {
  if (customerSocket?.connected) return customerSocket
  customerSocket = io(`${URL}/customer`, {
    auth: { sessionToken },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  })
  return customerSocket
}

export const connectAdmin = (token) => {
  if (adminSocket?.connected) return adminSocket
  adminSocket = io(`${URL}/admin`, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
  })
  return adminSocket
}

export const disconnectCustomer = () => { customerSocket?.disconnect(); customerSocket = null }
export const disconnectAdmin    = () => { adminSocket?.disconnect();    adminSocket    = null }
export const getCustomerSocket  = ()  => customerSocket
export const getAdminSocket     = ()  => adminSocket
