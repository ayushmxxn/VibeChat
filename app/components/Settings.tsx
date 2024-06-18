import { useState, useRef, useEffect } from 'react';
import { useUserStore } from '../lib/UserStore';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useMediaQuery } from 'react-responsive';
import { auth, db } from '../lib/Firebase'; 
import LeftSideBar from './LeftSideBar';
import DefaultAvatar from '@/app/images/DefaultAvatar.png';
import Back from '@/app/images/back.png';
import Delete from '@/app/images/delete.png';
import Upload from '@/app/images/upload.png';
import Edit from '@/app/images/edit.png';
import { IoIosArrowBack } from "react-icons/io";
import LightModeIcon from '@/app/images/LightMode.png';
import { LuUpload } from "react-icons/lu";
import { AiOutlineEdit } from "react-icons/ai";
import DarkModeIcon from '@/app/images/DarkMode.png';
import {createContext} from 'react';
import Image from 'next/image';

export const MyContext = createContext({ DarkMode: false, setIsDarkMode: (prev:boolean) => {!prev} })

function Settings() {
  const { currentUser } = useUserStore();
  const [goback, setGoBack] = useState(false);
  const [newAvatar, setNewAvatar] = useState(currentUser.avatar || DefaultAvatar);
  const [aboutMe, setAboutMe] = useState<string>('');
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState(currentUser.username || '');
  const [DarkMode, setIsDarkMode] = useState<boolean>(false)
  const isDesktop = useMediaQuery({ minWidth: 768 });
  

  const aboutInputRef = useRef<HTMLInputElement>(null);
  const usernameInputRef = useRef<HTMLInputElement>(null);

  // Fetch the latest user data from Firebase
  useEffect(() => {
    const fetchUserData = async () => {
      const docRef = doc(db, "users", currentUser.id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const userData = docSnap.data();
        setNewAvatar(userData.avatar || DefaultAvatar);
        setAboutMe(userData.about || '');
        setNewUsername(userData.username || '');
      } else {
        console.log("No such document!");
      }
    };

    fetchUserData();
  }, [currentUser.id]);

  // Update the document in Firestore
  const updateDocument = async () => {
    const docRef = doc(db, "users", currentUser.id);
    await updateDoc(docRef, {
      about: aboutMe,
      username: newUsername,
      avatar: newAvatar
    });
    console.log("Document updated");
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const newAvatar = reader.result as string;
        setNewAvatar(newAvatar);
        try {
          const docRef = doc(db, "users", currentUser.id);
          await updateDoc(docRef, {
            avatar: newAvatar,
          });
          console.log('Avatar updated successfully');
        } catch (error) {
          console.error('Error updating avatar:', error);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBack = () => {
    setGoBack(true);
  };

  const handleEditAboutClick = () => {
    setIsEditingAbout(true);
    setTimeout(() => {
      if (aboutInputRef.current) {
        aboutInputRef.current.focus();
        const length = aboutInputRef.current.value.length;
        aboutInputRef.current.setSelectionRange(length, length);
      }
    }, 0);
  };

  const handleEditUsernameClick = () => {
    setIsEditingUsername(true);
    setTimeout(() => {
      if (usernameInputRef.current) {
        usernameInputRef.current.focus();
        const length = usernameInputRef.current.value.length;
        usernameInputRef.current.setSelectionRange(length, length);
      }
    }, 0);
  };

  const handleAboutBlur = () => {
    setIsEditingAbout(false);
    updateDocument();
  };

  const handleUsernameBlur = () => {
    setIsEditingUsername(false);
    updateDocument();
  };

   const handleMode = () => {
    setIsDarkMode((prev) => !prev);
    console.log(DarkMode)
  };

  
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(savedDarkMode);
  }, []);

  
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(DarkMode));
  }, [DarkMode]);


  return (
    <MyContext.Provider value={{ DarkMode, setIsDarkMode }}>
    <>
      {goback ? (
        <LeftSideBar />
      ) : (
        <>
          <div className={`flex items-center w-72 pb-2 p-3 justify-center dark:bg-slate-800 dark:text-white`}>
            <IoIosArrowBack onClick={handleBack} className={`relative right-[80px] cursor-pointer ${isDesktop && 'relative right-[90px]'}`} />
           
            <div className={`${!isDesktop && 'relative left-10 '}`}>
              <p>Settings</p>
            </div>
          </div>
          <hr className='my-1 border-t-1  border-slate-300 dark:border-slate-500'/>
          <div className='flex items-center justify-between pr-4'>
            <Image src={newAvatar} alt='Profile' width={90} height={90} className='p-3 rounded-full'/>
            <div className='flex items-center gap-2'>
              <Image onClick={() => setNewAvatar(DefaultAvatar)} src={Delete} alt='Delete' width={25} height={20} className='bg-white dark:bg-slate-800  p-1 rounded-lg border dark:border-slate-500 cursor-pointer'/>
              <label className='font-normal text-sm flex items-center gap-2 border dark:border-slate-500 px-2 py-1 rounded-md cursor-pointer'>
                <LuUpload/>
                Upload
                <input type="file" onChange={handleAvatarChange} style={{ display: 'none' }} />
              </label>
            </div>
          </div>
          <hr className='my-1 border-t-1 border-slate-300 mx-2 dark:border-slate-500'/>
          <div className='flex justify-between items-center pr-5'>
            <div>
              <p className='text-sm font-medium pl-3 pt-3'>Name</p>
              {isEditingUsername ? (
                <input
                  ref={usernameInputRef}
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  onBlur={handleUsernameBlur}
                  className='text-xs dark:bg-slate-800 font-medium pl-3 pt-1 text-slate-500 border-none focus:ring-0 focus:outline-none'
                />
              ) : (
                <p className='text-xs font-medium pl-3 pt-1 text-slate-500 dark:text-slate-400'>{newUsername}</p>
              )}
            </div>
            <div>
              <AiOutlineEdit size={25} onClick={handleEditUsernameClick} className='cursor-pointer'/>
            </div>
          </div>
          <hr className='my-3 border-t-1 border-slate-300 mx-2 dark:border-slate-500'/>
          <div className='flex justify-between items-center pr-5'>
            <div>
              <p className='text-sm font-medium pl-3 pt-1'>About</p>
              {isEditingAbout ? (
                <input
                  ref={aboutInputRef}
                  type="text"
                  value={aboutMe}
                  onChange={(e) => setAboutMe(e.target.value)}
                  onBlur={handleAboutBlur}
                  className='text-xs dark:bg-slate-800 font-medium pl-3 pt-1 text-slate-500 border-none focus:ring-0 focus:outline-none'
                />
              ) : (
                <p className='text-xs font-medium pl-3 pt-1 text-slate-500 dark:text-slate-400'>{aboutMe}</p>
              )}
            </div>
            <div>
              <AiOutlineEdit size={25} onClick={handleEditAboutClick} className='cursor-pointer'/>
            </div>
          </div>
          <hr className='my-3 border-t-1 border-slate-300 mx-2 dark:border-slate-500'/>
          <div className='flex justify-between items-center pr-5'>
            <div>
              <p className='text-sm font-medium pl-3 pt-1'>Email</p>
              <p className='text-xs font-medium pl-3 pt-1 text-slate-500 dark:text-slate-400'>{currentUser.email}</p>
            </div>
            <div>
              <AiOutlineEdit size={25} className='cursor-pointer'/>
            </div>
          </div>
          <hr className='my-3 border-t-1 border-slate-300 mx-2 dark:border-slate-500'/>
          <div className='flex justify-between items-center pr-5'>
            <div>
              <p className='text-sm font-medium pl-3 pt-1'>Password</p>
              <p className='text-xs font-medium pl-3 pt-1 py-3 text-slate-500 dark:text-slate-400'>********</p>
            </div>
            <div>
              <AiOutlineEdit size={25} className='cursor-pointer'/>
            </div>
          </div>
          <hr className='border-t-1 border-slate-300 mx-2 dark:border-slate-500'/>
          
          <hr className='border-t-1 border-slate-300 mx-2 dark:border-slate-500'/>
          <div className={`flex flex-col justify-center items-center  ${aboutMe? 'mt-[162px]' : 'mt-[180px]'}`}>
            <button onClick={() => auth.signOut()} className={`bg-slate-900 hover:bg-black dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white font-normal py-2 px-4 w-60  rounded-md text-sm ${!isDesktop && 'w-80 mt-10'}`}>Log out</button>
          </div>
        </>
      )}
    </>
    </MyContext.Provider>
  );
}

export default Settings;
