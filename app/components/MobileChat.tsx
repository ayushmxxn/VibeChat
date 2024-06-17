'use client'
import React, { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import Mic from '@/app/images/Mic.svg'
import Send from '@/app/images/Send.png'
import Emoji from '@/app/images/Emoji.png'
import Gallary from '@/app/images/Gallary.png'
import { useUserStore } from '../lib/UserStore'
import { doc, getDoc, onSnapshot, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../lib/Firebase';
import { useChatStore } from '../lib/ChatStore'
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import DefaultAvatar from '@/app/images/DefaultAvatar.png'
import { Timestamp } from 'firebase/firestore';
import { MdEmojiEmotions } from "react-icons/md";
import { FaRegImage } from "react-icons/fa6";
import { IoMicOutline } from "react-icons/io5";

const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false })

const storage = getStorage();

const upload = async (file: File) => {
  const storageRef = ref(storage, `images/${file.name}`);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return url;
};

interface Message {
  senderId: string;
  text?: string;
  image?: string;
  createdAt: Timestamp;
}

interface ChatData {
  messages: Message[];
}

interface User {
  id: string;
  username: string;
  avatar: string;
  about: string;
}

function MobileChat() {
  const { isCurrentUserBlocked, isReceiverBlocked, chatId, user } = useChatStore();
  const { currentUser } = useUserStore();
  const [chat, setChat] = useState<ChatData | null>(null);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [image, setImage] = useState<{ file: File | null; url: string }>({ file: null, url: '' });
  const endRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  

  const handleEmoji = (e: any) => {
    setText((prev) => prev + e.emoji);
    setOpen(false);
  };

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoading(true)
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImage({ file, url });

      try {
        const imgURL = await upload(file);

        const message: Message = {
          senderId: currentUser.id,
          text: '',
          image: imgURL,
          createdAt: Timestamp.now(),
        };

        await updateDoc(doc(db, 'chats', chatId), {
          messages: arrayUnion(message),
        });

        const userIDs = [currentUser.id, user.id];
        await Promise.all(
          userIDs.map(async (id) => {
            const userChatsRef = doc(db, 'userchats', id);
            const userChatsSnapshot = await getDoc(userChatsRef);

            if (userChatsSnapshot.exists()) {
              const userChatsData = userChatsSnapshot.data() as { chats: any[] };
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
                  receiverId: id === currentUser.id ? user.id : currentUser.id,
                });
              }

              await updateDoc(userChatsRef, {
                chats: userChatsData.chats,
              });
            }
          })
        );

        setImage({ file: null, url: '' });
        setLoading(false)
      } catch (error) {
        console.error('Error sending image:', error);
      }
    }
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  useEffect(() => {
    if (!chatId) return; 
    const unsub = onSnapshot(doc(db, 'chats', chatId), (res) => {
      setChat(res.data() as ChatData);
    });

    return () => {
      unsub();
    };
  }, [chatId]);

  useEffect(() => {
    return () => {
      if (image.url) {
        URL.revokeObjectURL(image.url);
      }
    };
  }, [image.url]);

  const handleSend = async () => {
    if (text === '') return;

    const message: Message = {
      senderId: currentUser.id,
      text,
      createdAt: Timestamp.now(),
    };

    try {
      await updateDoc(doc(db, 'chats', chatId), {
        messages: arrayUnion(message),
      });

      const userIDs = [currentUser.id, user.id];
      await Promise.all(
        userIDs.map(async (id) => {
          const userChatsRef = doc(db, 'userchats', id);
          const userChatsSnapshot = await getDoc(userChatsRef);

          if (userChatsSnapshot.exists()) {
            const userChatsData = userChatsSnapshot.data() as { chats: any[] };
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
                receiverId: id === currentUser.id ? user.id : currentUser.id,
              });
            }

            await updateDoc(userChatsRef, {
              chats: userChatsData.chats,
            });
          }
        })
      );

      setText('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
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
    hours = hours ? hours : 12;
    const timeString = `${hours}:${minutes < 10 ? '0' + minutes : minutes} ${ampm}`;
    return timeString;
  }

  const currentTime = getCurrentTime();

  const getAllImages = () => {
    if (!chat || !chat.messages) return [];
    const imageMessages = chat.messages.filter((message) => message.image);
    const imageUrls = imageMessages.map((message) => message.image!);
    return imageUrls;
  };

  const allImages = getAllImages();
  console.log(allImages);

  console.log()

  return (
    <div className={`bg-white dark:bg-slate-900 w-full h-[685px] flex-grow flex flex-col justify-between`}>
      {/* Topbar */}
      <div className='bg-[#EDEDED] dark:bg-slate-800 dark:text-white w-full h-12 p-2 pl-4 flex justify-between items-center'>
        <div className='flex items-center'>
          <Image src={user?.avatar || DefaultAvatar} alt='Avatar' width={35} height={35} className='rounded-full' />
          <div className='ml-3'>
            <p className='font-medium text-sm'>{user?.username || 'User'}</p>
            <p className='font-normal text-[#525354] text-xs dark:text-slate-400'>{user?.about}</p>
          </div>
        </div>
      </div>

      {/* Chats */}
      <div className='bg-white dark:bg-slate-900  w-full h-[476px] overflow-auto p-5'>
        <div className='flex justify-center items-center mt-5 mb-10'>
          <Image src={user?.avatar || DefaultAvatar} alt='NoChat' width={200} height={100}  className='rounded-full' />
        </div>
        {chat?.messages?.map((message) => (
          <div className={`flex mt-2 ${message.senderId === currentUser?.id ? 'justify-end' : 'flex justify-start flex-col'}`} key={message.createdAt.seconds}>
            <div className={`${message.senderId === currentUser?.id ? 'flex gap-2 items-start' : 'flex gap-2 items-start'}`}>
              {message.senderId !== currentUser?.id && (
                <Image src={user.avatar || DefaultAvatar} alt='Profile' width={35} height={35} className='rounded-full' />
              )}
              {message.text ? (
                <div className={`${message.senderId === currentUser?.id ? 'flex flex-col' : 'flex flex-col'}`}>
                  <span className={`${message.senderId === currentUser?.id ? 'bg-blue-500 dark:bg-blue-500  text-white text-sm rounded-full max-w-80 px-4 py-2' : 'bg-[#EDEDED] dark:bg-slate-700 dark:text-white text-sm max-w-80 rounded-full px-4 py-2'} ${message.text.length > 40 ? 'rounded-md' : 'rounded-full'} ${message.text.length < 4 ? 'text-center' : ''}`}>
                    {message.text}
                  </span>
                  <span className={`${message.senderId === currentUser?.id ? 'text-xs text-end pr-4 pt-1 text-[#525354] dark:text-slate-400' : 'text-xs dark:text-slate-400 pl-4 pt-1 text-[#525354] mb-2'}`}>
                    {new Date(message.createdAt.seconds * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                  </span>
                </div>
              ) : (
                <div>
                  {loading?
                  <span className='loaderAuthImage'></span>
                  :
                  <div>
                    <Image src={message.image!} alt='image' width={200} height={250} className='rounded-md' />
                  <span className={`${message.senderId === currentUser?.id ? 'text-xs text-end pr-4 pt-1 text-[#525354] dark:text-slate-400' : 'text-xs dark:text-slate-400 text-end pr-4 pt-1 text-[#525354]'}`}>
                    {new Date(message.createdAt.seconds * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                  </span>
                  </div>
                  } 
                </div>
              )}
              <div>
                {message.senderId === currentUser?.id && <Image src={currentUser.avatar || DefaultAvatar} alt='Profile' width={35} height={35} className='rounded-full' />}
              </div>
            </div>
          </div>
        ))}

        <div ref={endRef}></div>
      </div>

      {/* BottomBar */}
      <div className={`bg-[#EDEDED] dark:bg-slate-800 w-full justify-between  h-14 flex p-4 items-center`}>
        <div className={`relative flex items-center w-72 bg-white rounded-full h-8 dark:bg-slate-700`}>
          <IoMicOutline size={20} className='absolute left-3 dark:text-slate-300' />
          
          <input
            name='SearchBar'
            id='Searchbar'
            onKeyDown={handleKeyPress}
            placeholder={(isCurrentUserBlocked || isReceiverBlocked) ? 'You cannot text this user' : 'Write a message'}
            className={`bg-transparent dark:text-slate-100 dark:bg-slate-700 dark:placeholder-slate-300 rounded-full w-full text-sm outline-none pl-10 pr-3 py-2 font-normal  placeholder:text-black`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoComplete='off'
            disabled={isCurrentUserBlocked || isReceiverBlocked}
          />
          <Image onClick={handleSend} src={Send} alt='Send' width={20} height={20} className={`absolute right-3 rounded bg-white py-1 dark:bg-slate-700 `} />
        </div>
        <div className='flex gap-3 pl-4 items-center'>
          {(isCurrentUserBlocked || isReceiverBlocked) ? (
            <>
            <MdEmojiEmotions size={25}  className={`cursor-not-allowed dark:text-slate-400`} />
              <label htmlFor='file'>
                <FaRegImage size={20} className='cursor-not-allowed dark:text-slate-400' />
              </label>
              <input style={{ display: 'none' }} className='cursor-not-allowed' />
            </>
          ) : (
            <>
            <MdEmojiEmotions size={25} onClick={() => setOpen((prev) => !prev)} className={`cursor-pointer dark:text-slate-400`} />
              {open && (
                <div className={`absolute top-[850px] left-5 emoji-picker ${open ? 'emoji-picker-enter' : 'emoji-picker-exit'}`}>
                  <EmojiPicker onEmojiClick={handleEmoji} autoFocusSearch={false}/>
                </div>
              )}
              <label htmlFor='file'>
                <FaRegImage size={20} className='cursor-pointer dark:text-slate-400'/>
              </label>
              <input type='file' name='file' id='file' style={{ display: 'none' }} className='cursor-pointer' onChange={handleImage} />
            </>
          )}
          
        </div>
      </div>
    </div>
  );
}

export default MobileChat;
