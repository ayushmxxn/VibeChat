import Image from 'next/image';
import React, { useState, useRef, useEffect } from 'react';
import Back from '@/app/images/back.png';
import Delete from '@/app/images/delete.png';
import Upload from '@/app/images/upload.png';
import Edit from '@/app/images/edit.png';
import DefaultAvatar from '@/app/images/DefaultAvatar.png';
import { auth, db } from '../lib/Firebase'; // Import Firebase modules
import { useUserStore } from '../lib/UserStore';
import LeftSideBar from './LeftSideBar';
import { doc, getDoc, updateDoc } from 'firebase/firestore';



function Settings() {
  const { currentUser } = useUserStore();
  const [goback, setGoBack] = useState(false);
  const [newAvatar, setNewAvatar] = useState(currentUser.avatar || DefaultAvatar);
  const [aboutMe, setAboutMe] = useState('');
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState(currentUser.username || '');


  const aboutInputRef = useRef(null);
  const usernameInputRef = useRef(null);

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

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const newAvatar = reader.result;
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
    // Set timeout to ensure the input is rendered before focusing
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
    // Set timeout to ensure the input is rendered before focusing
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

  return (
    <>
      {goback ? (
        <LeftSideBar />
      ) : (
        <>
          <div className='flex items-center pb-2 p-3 justify-center'>
            <Image onClick={handleBack} src={Back} alt='BackButton' width={20} height={20} className='relative right-20 cursor-pointer'/>
            <p>Settings</p>
          </div>
          <hr className='my-1 border-t-1 border-slate-300'/>
          <div className='flex items-center justify-between pr-4'>
            <Image src={newAvatar} alt='Profile' width={90} height={90} className='p-3 rounded-full'/>
            <div className='flex items-center gap-2'>
              <Image onClick={() => setNewAvatar(DefaultAvatar)} src={Delete} alt='Delete' width={25} height={20} className='bg-white p-1 rounded-lg border cursor-pointer'/>
              <label className='font-normal text-sm flex items-center gap-2 border px-2 py-1 rounded-md cursor-pointer'>
                <Image src={Upload} alt='UploadIcon' width={16} height={16}/>
                Upload
                <input type="file" onChange={handleAvatarChange} style={{ display: 'none' }} />
              </label>
            </div>
          </div>
          <hr className='my-1 border-t-1 border-slate-300 mx-2'/>
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
                  className='text-xs font-medium pl-3 pt-1 text-slate-500 border-none focus:ring-0 focus:outline-none'
                />
              ) : (
                <p className='text-xs font-medium pl-3 pt-1 text-slate-500'>{newUsername}</p>
              )}
            </div>
            <div>
              <Image src={Edit} alt='Edit' width={20} height={20} onClick={handleEditUsernameClick} className='cursor-pointer'/> 
            </div>
          </div>
          <hr className='my-3 border-t-1 border-slate-300 mx-2'/>
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
                  className='text-xs font-medium pl-3 pt-1 text-slate-500 border-none focus:ring-0 focus:outline-none'
                />
              ) : (
                <p className='text-xs font-medium pl-3 pt-1 text-slate-500'>{aboutMe}</p>
              )}
            </div>
            <div>
              <Image src={Edit} alt='Edit' width={20} height={20} onClick={handleEditAboutClick} className='cursor-pointer'/> 
            </div>
          </div>
          <hr className='my-3 border-t-1 border-slate-300 mx-2'/>
          <div className='flex justify-between items-center pr-5'>
            <div>
              <p className='text-sm font-medium pl-3 pt-1'>Email</p>
              <p className='text-xs font-medium pl-3 pt-1 text-slate-500'>{currentUser.email}</p>
            </div>
            <div>
              <Image src={Edit} alt='Edit' width={20} height={20}/> 
            </div>
          </div>
          <hr className='my-3 border-t-1 border-slate-300 mx-2'/>
          <div className='flex justify-between items-center pr-5'>
            <div>
              <p className='text-sm font-medium pl-3 pt-1'>Password</p>
              <p className='text-xs font-medium pl-3 pt-1 py-3 text-slate-500'>********</p>
            </div>
            <div>
              <Image src={Edit} alt='Edit' width={20} height={20}/> 
            </div>
          </div>
          <hr className='border-t-1 border-slate-300 mx-2'/>
          <div className='flex flex-col justify-center items-center mt-[70px]'>
            <button onClick={() => auth.signOut()} className='bg-slate-900 hover:bg-black text-white font-normal py-2 px-4 w-60 mt-8 rounded-md text-sm'>Log out</button>
          </div>
        </>
      )}
    </>
  );
}

export default Settings;
