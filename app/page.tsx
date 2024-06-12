'use client'
import React, { useEffect, useState } from 'react';
import LeftSideBar from './components/LeftSideBar';
import RightSideBar from './components/RightSideBar';
import Chat from './components/Chat';
import Login from './components/SignIn';
import SignUpForm from './components/SignUp';
import Notifications from './components/Notifications';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/Firebase';
import { useUserStore } from './lib/UserStore';
import { useChatStore } from '../app/lib/ChatStore'
import Image from 'next/image';
import Vibechat from '@/app/images/VibeChat.png'


function HomePage() {
  const [newUser, setNewUser] = useState(false); // Track if it's a new user
  const { currentUser, isLoading, fetchUserInfo } = useUserStore();
  const { chatId } = useChatStore();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      fetchUserInfo(user?.uid);
    });

    return () => {
      unsub();
    };
  }, [fetchUserInfo]);

  

  if (isLoading) return <div className='loading'>Loading...</div>;

  return (
    <div>
      {currentUser ? (
        <div className='bg-white w-[1100px] h-[580px]  rounded-md'>
          <div className='flex'>
            <LeftSideBar />
            {!chatId && 
             <div className='flex justify-center items-center w-full flex-col'>
              <div className='animated-image text-center'>
                <Image src={Vibechat} alt='Image' width={250} height={250} />
                <p className='font-medium text-2xl'>VibeChat</p>
              </div>
            </div>
            }
           
            {chatId && <Chat /> }
            {chatId && <RightSideBar /> }
            
            
          </div>
        </div>
      ) : (
        newUser ? (
          <div>
            <Login setNewUser={setNewUser} /> {/* Pass setNewUser to Login */}
          </div>
        ) : (
          <div>
            <SignUpForm setNewUser={setNewUser} /> {/* Pass setNewUser to SignUpForm */}
          </div>
        )
      )}
      <Notifications />
    </div>
  );
}

export default HomePage;
