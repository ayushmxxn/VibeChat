import React from 'react';
import { FcGoogle } from 'react-icons/fc';
import { FaGithub } from 'react-icons/fa';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/app/lib/Firebase';
import { doc, setDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';


const SignUpForm: React.FC<{ setNewUser: React.Dispatch<React.SetStateAction<boolean>> }> = ({ setNewUser }) => {

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.target as HTMLFormElement);
    const username = formData.get('username') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const about = formData.get('about') as string; // New field: about
    const avatar = formData.get('avatar') as string; 

    try {
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

      toast.success('Account Created');

    } catch (error: any) {
      console.log(error.message);
      toast.error(error.message);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen">
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
              autoComplete="new-password"
              required
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-500 sm:text-sm"
            />
          </div>
          <div>
            <button
              type="submit"
              className="w-full px-4 py-2 font-medium text-white bg-slate-800 rounded-md hover:bg-slate-900"
            >
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
            className="w-32 flex justify-center px-4 py-2 font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
          >
            <FcGoogle className="h-5 w-5" />
          </button>
          <button
            type="button"
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
