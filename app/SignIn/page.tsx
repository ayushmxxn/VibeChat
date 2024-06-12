import React from 'react'
import SignInForm from '../components/SignIn'
import { ToastContainer } from 'react-toastify'
import "react-toastify/dist/ReactToastify.css"

function SignInPage() {
  return (
    <div>
      <SignInForm/>
      <ToastContainer position='bottom-right'/>
    </div>
    
  )
}

export default SignInPage
