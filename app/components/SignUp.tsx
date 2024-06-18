import React, { useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { FaGithub } from 'react-icons/fa';
import { createUserWithEmailAndPassword, GithubAuthProvider, GoogleAuthProvider, signInWithPopup, fetchSignInMethodsForEmail } from 'firebase/auth';
import { auth, db } from '@/app/lib/Firebase';
import { doc, setDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';

const SignUpForm: React.FC<{ setNewUser: React.Dispatch<React.SetStateAction<boolean>> }> = ({ setNewUser }) => {
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.target as HTMLFormElement);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    const email = formData.get('email') as string;
    const about = formData.get('about') as string; 
    const avatar = formData.get('avatar') as string;

   
    try {

      // Checking if email is already registered
      const signInMethods = await fetchSignInMethodsForEmail(auth, email);

      if (signInMethods.length > 0) {
        
        toast.error('An account with this email already exists.');
        setLoading(false);
        return;
      }

      const res = await createUserWithEmailAndPassword(auth, email, password);

      await setDoc(doc(db, "users", res.user.uid), {
        username,
        email,
        id: res.user.uid,
        blocked: [],
        password,
        about,
        avatar
      });

      await setDoc(doc(db, "userchats", res.user.uid), {
        chats: []
      });

      toast.success('Account creation successful!');

    } catch (error: any) {
      console.log(error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubSignIn = async () => {
    setLoading(true);
    const provider = new GithubAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GithubAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;

      const user = result.user;

      await setDoc(doc(db, "users", user.uid), {
        username: user.displayName,
        email: user.email,
        id: user.uid,
        blocked: [],
        about: "",
        avatar: user.photoURL
      });

      await setDoc(doc(db, "userchats", user.uid), {
        chats: []
      });

      toast.success('Account creation successful!');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;

      const user = result.user;

      await setDoc(doc(db, "users", user.uid), {
        username: user.displayName,
        email: user.email,
        id: user.uid,
        blocked: [],
        about: "",
        avatar: user.photoURL
      });

      await setDoc(doc(db, "userchats", user.uid), {
        chats: []
      });

      toast.success('Account creation successful!');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-400 items-center justify-center h-screen">
      <div className="p-8 space-y-8 bg-white rounded shadow-md w-96">
        <h2 className="text-2xl font-bold text-center">Create an account</h2>
        <form onSubmit={handleSignUp} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              placeholder="John Doe"
              maxLength={20}  // <-- Maximum length set to 20 characters
              required
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="text"
              autoComplete="email"
              placeholder="johndoe0101@gmail.com"
              maxLength={25} 
              required
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="1234567890"
              maxLength={20}  // <-- Maximum length set to 20 characters
              autoComplete="new-password"
              required
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-500 sm:text-sm"
            />
          </div>
          <div className=''>
            <button
              type="submit"
              className="w-full px-4 py-2 font-medium text-white bg-slate-800 rounded-md hover:bg-slate-900 flex items-center justify-center"
            >
              {loading && (
                <span className='loaderAuth mr-4'></span>
              )}
              Sign Up
            </button>
          </div>
        </form>
        <div className="relative flex items-center justify-center mt-6">
          <span className="absolute px-2 text-gray-500 bg-white">or</span>
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="flex justify-around items-center">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-32 flex justify-center px-4 py-2 font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
          >
            <FcGoogle className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={handleGitHubSignIn}
            className="w-32 flex justify-center px-4 py-2 font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
          >
            <FaGithub className="h-5 w-5" />
          </button>
        </div>
        <div className="flex justify-center">
          <span className="text-sm text-slate-600">
            Already have an account?
            <span
              onClick={() => setNewUser(true)}
              className="text-sm text-indigo-500 ml-1 hover:underline cursor-pointer"
            >
              Sign In
            </span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default SignUpForm;
