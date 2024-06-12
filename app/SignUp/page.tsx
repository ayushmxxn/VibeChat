import React from 'react'
import SignUpForm from '../components/SignUp'
import { ToastContainer } from 'react-toastify'
import "react-toastify/dist/ReactToastify.css"

function SignUpPage() {
  return (
    <div>
      <SignUpForm setNewUser={function (value: React.SetStateAction<boolean>): void {
        throw new Error('Function not implemented.')
      } }/>
      <ToastContainer position='bottom-right'/>
    </div>
  )
}

export default SignUpPage
