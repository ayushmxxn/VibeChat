'use client'
import React, { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import Call from '@/app/images/Call.png'
import VideoCall from '@/app/images/VideoCall.png'
import Mic from '@/app/images/Mic.svg'
import Send from '@/app/images/Send.png'
import Emoji from '@/app/images/Emoji.png'
import Gallary from '@/app/images/Gallary.png'
import Camera from '@/app/images/Camera.png'
import NoChat from '@/app/images/chatting.png'
import { useUserStore } from '../lib/UserStore'
import { doc, getDoc, onSnapshot, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../lib/Firebase';
import { useChatStore } from '../lib/ChatStore'
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import DefaultAvatar from '@/app/images/DefaultAvatar.png'
import { Timestamp } from 'firebase/firestore';
import { createContext } from 'react';
import LeftSideBar from './LeftSideBar'




// Dynamically import EmojiPicker with no SSR
const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false })
 

const storage = getStorage();

const upload = async (file) => {
  const storageRef = ref(storage, `images/${file.name}`);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return url;
};

function Chat() {

   const {isCurrentUserBlocked, isReceiverBlocked} = useChatStore()

  const { currentUser } = useUserStore()

  const [chat, setchat] = useState()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [image, setImage] = useState({
    file: null,
    url: '',
  })
  const { chatId, user } = useChatStore()

  function handleEmoji(e) {
    setText((prev) => prev + e.emoji)
    setOpen(false)
  }

  const handleImage = async (e) => {
    
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImage({ file, url });

      // Automatically send the image
      try {
        const imgURL = await upload(file);

        const message = {
          senderId: currentUser.id,
          text: '',
          image: imgURL,
          createdAt: Timestamp.now()
        };

        // Update the chat document with the new message
        await updateDoc(doc(db, 'chats', chatId), {
          messages: arrayUnion(message)
        });

        // Update each user's chat metadata
        const userIDs = [currentUser.id, user.id];
        await Promise.all(userIDs.map(async (id) => {
          const userChatsRef = doc(db, 'userchats', id);
          const userChatsSnapshot = await getDoc(userChatsRef);

          if (userChatsSnapshot.exists()) {
            const userChatsData = userChatsSnapshot.data();
            let chatExists = false;

            userChatsData.chats = userChatsData.chats.map((c) => {
              if (c.chatId === chatId) {
                chatExists = true;
                return {
                  ...c,
                  lastMessage: 'Image',
                  isSeen: id === currentUser.id,
                  updatedAt: Timestamp.now(),
                };
              }
              return c;
            });

            if (!chatExists) {
              userChatsData.chats.push({
                chatId,
                lastMessage: 'Image',
                isSeen: id === currentUser.id,
                updatedAt: Timestamp.now(),
                receiverId: id === currentUser.id ? user.id : currentUser.id, // Ensure the correct receiverId
              });
            }

            await updateDoc(userChatsRef, {
              chats: userChatsData.chats,
            });
          }
        }));

        setImage({ file: null, url: '' });

      } catch (error) {
        console.error('Error sending image:', error);
      }
    }
  }

  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  })

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'chats', chatId), (res) => {
      setchat(res.data())
    })

    return () => {
      unsub()
    }
  }, [chatId])

  useEffect(() => {
    return () => {
      if (image.url) {
        URL.revokeObjectURL(image.url);
      }
    };
  }, [image.url]);

  const handleSend = async () => {
    if (text === '') return;

    const message = {
      senderId: currentUser.id,
      text,
      createdAt: Timestamp.now()
    };

    try {
      // Update the chat document with the new message
      await updateDoc(doc(db, 'chats', chatId), {
        messages: arrayUnion(message)
      });

      // Update each user's chat metadata
      const userIDs = [currentUser.id, user.id];
      await Promise.all(userIDs.map(async (id) => {
        const userChatsRef = doc(db, 'userchats', id);
        const userChatsSnapshot = await getDoc(userChatsRef);

        if (userChatsSnapshot.exists()) {
          const userChatsData = userChatsSnapshot.data();
          let chatExists = false;

          userChatsData.chats = userChatsData.chats.map((c) => {
            if (c.chatId === chatId) {
              chatExists = true;
              return {
                ...c,
                lastMessage: text,
                isSeen: id === currentUser.id,
                updatedAt: Timestamp.now(),
              };
            }
            return c;
          });

          if (!chatExists) {
            userChatsData.chats.push({
              chatId,
              lastMessage: text,
              isSeen: id === currentUser.id,
              updatedAt: Timestamp.now(),
              receiverId: id === currentUser.id ? user.id : currentUser.id, // Ensure the correct receiverId
            });
          }

          await updateDoc(userChatsRef, {
            chats: userChatsData.chats,
          });
        }
      }));

      setText('');

    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (event:any) => {
    if (event.key === 'Enter') {
      handleSend();
    }
  };

  function getCurrentTime() {
  const currentTime = new Date();
  let hours = currentTime.getHours();
  const minutes = currentTime.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours %= 12;
  hours = hours ? hours : 12; // Handle midnight (0 hours)
  const timeString = `${hours}:${minutes < 10 ? '0' + minutes : minutes} ${ampm}`;
  return timeString;
}

  
const currentTime = getCurrentTime();

 // Function to filter and extract image URLs
  const getAllImages = () => {
    if (!chat || !chat.messages) return [];

    const imageMessages = chat.messages.filter(message => message.image);
    const imageUrls = imageMessages.map(message => message.image);
    return imageUrls;
  };

  // Call getAllImages() to get all the image URLs
  const allImages = getAllImages();

  
  

  return (
    <div className='bg-white flex-grow flex flex-col justify-between'>
      {/* Topbar */}
      <div className='bg-[#EDEDED] w-full h-12 p-2 pl-4 flex justify-between items-center'>
        <div className='flex items-center'>
          <Image src={user?.avatar || DefaultAvatar} alt='Alex' width={35} height={35} className='rounded-full' />
          <div className='ml-3'>
            <p className='font-medium text-sm'>{user?.username || 'User'}</p>
            <p className='font-normal text-[#525354] text-xs'>{user.about}</p>
          </div>
        </div>
        <div className='flex gap-5 pr-4'>
          <Image src={Call} alt='Call' width={20} />
          <Image src={VideoCall} alt='VideoCall' width={20} />
        </div>
      </div>

      {/* Chats */}
      <div className='bg-white w-[525px] h-[476px] overflow-auto p-5'>
        <div className='flex justify-center items-center mt-10'>
          <Image src={NoChat} alt='NoChat' width={200} height={100}/>
        </div>
      {chat?.messages?.map((message) => (
  <div className={`flex mt-2 ${message.senderId === currentUser?.id ? 'justify-end' : 'flex justify-start flex-col'}`} key={message.createdAt.seconds}>
    <div className={`${message.senderId === currentUser?.id ? 'flex gap-2 items-start' : 'flex gap-2 items-start'}`}>
      {message.senderId !== currentUser?.id && 
        <Image src={user.avatar || DefaultAvatar} alt='Profile' width={35} height={35} className='rounded-full' /> 
      }
      {message.text ? (
        <div className={`${message.senderId === currentUser?.id ? 'flex flex-col' : 'flex flex-col'} `}>
          
          <span className={`${message.senderId === currentUser?.id ? 'bg-blue-500 text-white text-sm rounded-full max-w-80 px-4 py-2' : 'bg-[#EDEDED] text-sm max-w-80 rounded-full px-4 py-2'} ${message.text.length > 40 ? 'rounded-md' : 'rounded-full'} ${message.text.length < 4 ? 'text-center' : ''}`}>
            {message.text}
          </span>
          <span className={`${message.senderId === currentUser?.id ? 'text-xs text-end pr-4 pt-1 text-[#525354]' : 'text-xs pl-4 pt-1 text-[#525354] mb-2'} `}>
            {new Date(message.createdAt.seconds * 1000).toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'})}
          </span>
        </div>
      ) : (
        <div>
          <Image src={message.image} alt='image' width={150} height={150} className='rounded-md' />
          <span className={`${message.senderId === currentUser?.id ? 'text-xs text-end pr-4 pt-1 text-[#525354]' : 'text-xs text-end pr-4 pt-1 text-[#525354]'}`}>
            {new Date(message.createdAt.seconds * 1000).toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'})}
          </span>
        </div>
      )}
      <div>
        {message.senderId === currentUser?.id &&
          <Image src={currentUser.avatar || DefaultAvatar} alt='Profile' width={35} height={35} className='rounded-full' /> 
        }
      </div>
    </div>
  </div>
))}


     
    

        <div ref={endRef}></div>
      </div>

      {/* BottomBar */}
      <div className={`bg-[#EDEDED] w-full h-14 flex p-4 items-center`}>
        <div className={`relative flex items-center w-96 bg-white rounded-full h-8`}>
          <Image src={Mic} alt='Mic' width={18} height={18} className='absolute left-3' />
          <input
            name="SearchBar"
            id="Searchbar"
            onKeyDown={handleKeyPress}
            placeholder= {(isCurrentUserBlocked || isReceiverBlocked) ? 'You cannot text this user' : 'Write a message' }
            className={`bg-transparent w-96 outline-none pl-10 pr-3 py-1 font-normal text-sm placeholder:text-black`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoComplete="off"
            disabled = {isCurrentUserBlocked || isReceiverBlocked}
          />
          
          <Image onClick={handleSend} src={Send} alt='Send' width={20} height={20} className={`absolute right-3 rounded bg-white py-1`} />
          
        </div>
        <div className='flex gap-3 pl-4 items-center'>
          {(isCurrentUserBlocked || isReceiverBlocked) ? <Image src={Emoji} alt='Emoji' width={20} height={20} className={`cursor-not-allowed`} /> : ( // Render emoji picker only if neither user is blocked
            <>
              <Image src={Emoji} alt='Emoji' width={20} height={20} onClick={() => setOpen(prev => !prev)} className={`cursor-pointer`} />
              {open && (
                <div className={`absolute top-24 right-96 emoji-picker ${open ? 'emoji-picker-enter' : 'emoji-picker-exit'}`}>
                  <EmojiPicker onEmojiClick={handleEmoji} />
                </div>
              )}
            </>
          )}
         {isCurrentUserBlocked || isReceiverBlocked?
          <>
          <label htmlFor='file'>
            <Image src={Gallary} alt='Gallary' width={20} height={20} className='cursor-not-allowed' />
          </label>
          <input style={{ display: 'none' }} className='cursor-not-allowed'/> 
          </>
          
          : 
          <>
          <label htmlFor='file'>
            <Image src={Gallary} alt='Gallary' width={20} height={20} className='cursor-pointer' />
          </label>
          <input type='file' name='file' id='file' style={{ display: 'none' }} className='cursor-pointer' onChange={handleImage}/> 
          </>
          }
          <Image src={Camera} alt='Camera' width={22} height={22} />
        </div>
      </div>
    </div>
  )
}

export default Chat
