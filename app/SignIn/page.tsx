import React from 'react';
import SignInForm from '../components/SignIn';
import { ToastContainer } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";

function SignInPage() {
  const [newUser, setNewUser] = React.useState(false);

  return (
    <div>
      <SignInForm setNewUser={setNewUser} />
      <ToastContainer position='bottom-right'/>
    </div>
  );
}

export default SignInPage;