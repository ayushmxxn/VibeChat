'use client';

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
import { useChatStore } from '../app/lib/ChatStore';
import { useMediaQuery } from 'react-responsive';
import Image from 'next/image';
import Vibechat from '@/app/images/VibeChat.png';
import MobileChat from './components/MobileChat';
import { motion } from "framer-motion";

function HomePage() {
  const [newUser, setNewUser] = useState(false); // Track if it's a new user
  const { currentUser, isLoading, fetchUserInfo } = useUserStore();
  const { chatId } = useChatStore();
  const isDesktop = useMediaQuery({ minWidth: 768 }); // Define the breakpoint for mobile vs. desktop

  useEffect(() => {
    const applyTheme = () => {
      const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      if (darkModeMediaQuery.matches) {
        document.documentElement.classList.add('dark-mode');
        document.documentElement.classList.remove('light-mode');
      } else {
        document.documentElement.classList.add('light-mode');
        document.documentElement.classList.remove('dark-mode');
      }
    };

    if (typeof window !== 'undefined') {
      applyTheme();
      // Listen for changes in theme preference
      window.matchMedia('(prefers-color-scheme: dark)').addListener(applyTheme);
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      fetchUserInfo(user?.uid);
    });

    return () => {
      unsub();
    };
  }, [fetchUserInfo]);

  if (isLoading) {
    return (
      <div className="loader-container">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div>
      {currentUser ? (
        <div className={`w-full sm:h-[638px] dark:bg-slate-900`}>
          <div className={`${isDesktop ? 'flex' : 'flex-col'}`}>
            <LeftSideBar />
            {!isDesktop && <MobileChat />}
            {chatId && isDesktop && <Chat />} {/* Render Chat only if it's desktop and chatId is present */}
            {chatId && isDesktop && <RightSideBar />} {/* Conditionally render RightSideBar based on device type */}
            {!chatId && (
              <div className="flex justify-center items-center w-full flex-col">
                <motion.div
                  className="text-center sm:block hidden"
                  initial={{
                    rotate: '0deg',
                    scale: 0,
                    y: -400
                  }}
                  animate={{
                    rotate: '360deg',
                    scale: 1,
                    y: [0, 150, -150, -150, 0]
                  }}
                  transition={{
                    duration: 1,
                    ease: 'backInOut'
                  }}
                >
                  <Image src={Vibechat} alt="Image" width={250} height={250} />
                  <p className="font-medium text-2xl dark:text-white">VibeChat</p>
                </motion.div>
              </div>
            )}
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
