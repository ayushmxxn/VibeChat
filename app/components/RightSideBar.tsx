import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../lib/Firebase';
import DefaultAvatar from '@/app/images/DefaultAvatar.png';
import { useChatStore } from '../lib/ChatStore';
import { useUserStore } from '../lib/UserStore';
import Link from 'next/link';
import EmptyMediaIcon from '@/app/images/EmptyMedia.png';

function RightSideBar() {
  const { user, isCurrentUserBlocked, isReceiverBlocked, changeBlock, chatId } = useChatStore();
  const { currentUser } = useUserStore();
  const [chat, setChat] = useState<any | null>(null);
  const [allImages, setAllImages] = useState<string[]>([]);

  useEffect(() => {
    // Fetch chat data on chatId change
    const unsub = onSnapshot(doc(db, 'chats', chatId), (res) => {
      setChat(res.data());
    });

    return () => {
      unsub(); // Cleanup the snapshot listener
    };
  }, [chatId]);

  useEffect(() => {
    // Update allImages when chat updates
    if (chat) {
      const imageUrls = chat.messages ? chat.messages.filter((message: any) => message.image).map((message: any) => message.image) : [];
      setAllImages(imageUrls);
    }
  }, [chat]);

  const handleBlock = async () => {
    if (!user) return;

    const userDocRef = doc(db, 'users', currentUser.id);

    try {
      let blockedArray: string[] = [];
      if (isReceiverBlocked) {
        blockedArray = user.blocked ? user.blocked.filter((id: string) => id !== user.id) : [];
      } else {
        blockedArray = user.blocked ? [...user.blocked, user.id] : [user.id];
      }

      await updateDoc(userDocRef, { blocked: blockedArray });
      changeBlock();
      console.log('User blocked Successfully');
    } catch (error) {
      console.error('Error updating user block status:', error);
    }
  };
 
  return (
    <div className={`bg-white dark:bg-slate-900 dark:text-white w-72 h-screen`}>
      <div className='flex flex-col bg-slate-800 h-44 items-center'>
        <Image src={user?.avatar || DefaultAvatar} alt='Profile' width={80} height={80} className={`rounded-full mt-5 ${!user?.about && 'mt-8'}`}/>
        <p className='mt-2 font-semibold'>{user?.username || 'User'}</p>
        <p className='text-sm  text-center  text-slate-500 dark:text-slate-400'>{user?.about}</p>
      </div>
      
      <hr className='border-t-1 border-slate-200 dark:border-slate-500 ' />
      <div className='flex justify-between mt-1 p-6'>
        <span className='text-sm font-medium'>Shared Media</span>
      </div>
      <div className='grid grid-cols-2  gap-3 w-full overflow-y-auto pl-6 h-52'>
        {allImages.length > 0 ? (
          allImages.map((imageUrl, index) => (
            <div key={index}> {/* Ensure each item in map has a unique key */}
              <Link href={imageUrl} target='_blank'>
                <Image src={imageUrl} alt='Media' width={100} height={50} className='rounded hover:opacity-90' />
              </Link>
            </div>
          ))
        ) : (
          <div className='flex flex-col  justify-center items-center w-60 h-full'>
            <Image src={EmptyMediaIcon} alt='No Media' width={100} height={50} className='rounded' />
          </div>
        )}
      </div>
      <div className={`flex justify-center dark:bg-slate-900  ${user?.about? 'mt-[122px]' : 'mt-[122px]'}`}>
        <div className='flex flex-col gap-2 mt-3'>
          <button onClick={handleBlock} className='bg-slate-900 hover:bg-black dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white py-2 px-4 w-60 rounded-md text-sm font-normal'>
            {isCurrentUserBlocked ? 'You are Blocked' : isReceiverBlocked ? 'UnBlock' : 'Block User'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default RightSideBar;
