import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import Search from '@/app/images/Search.png';
import { useUserStore } from '../lib/UserStore';
import { useChatStore } from '../lib/ChatStore';
import DefaultAvatar from '@/app/images/DefaultAvatar.png';
import { CiSearch } from "react-icons/ci";
import Settings from './Settings';
import { doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../lib/Firebase';
import AddUser from './AddUser';
import { useMediaQuery } from 'react-responsive';

interface ChatItem {
  chatId: string;
  receiverId: string;
  updatedAt: number;
  user: any; 
  isSeen: boolean;
  lastMessage: string;
  hidden: boolean;
}

function LeftSideBar() {
  const [openSettings, setOpenSettings] = useState(false);
  const [adduser, setAddUser] = useState(false);
  const { currentUser } = useUserStore();
  const { changeChat } = useChatStore();
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const isDesktop = useMediaQuery({ minWidth: 768 });

  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(doc(db, 'userchats', currentUser.id), async (res) => {
      const items = res.data()?.chats;

      if (!items) {
        setChats([]);
        setLoading(false);
        return;
      }

      const userIds = new Set<string>();
      const uniqueChats = items.filter((item: ChatItem) => {
        if (userIds.has(item.receiverId)) {
          return false; // Skip if already added
        } else {
          userIds.add(item.receiverId);
          return true; // Add to uniqueChats
        }
      });

      const promises = uniqueChats.map(async (item: ChatItem) => {
        const userDocRef = doc(db, 'users', item.receiverId);
        const userDocSnap = await getDoc(userDocRef);
        const user = userDocSnap.data();
        return { ...item, user };
      });

      const chatData = await Promise.all(promises);
      setChats(chatData.sort((a, b) => b.updatedAt - a.updatedAt));
      setLoading(false);
    });

    return () => {
      unsub();
    };
  }, [currentUser.id]);

  const handleSettings = () => {
    setOpenSettings((prev) => !prev);
  };

  const handleSelected = async (chat: ChatItem, event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    // Check if triple click
    if (event.detail === 3) {
      console.log('Double click detected');
      const userChatsRef = doc(db, 'userchats', currentUser.id);
      const updatedChats = chats.map((c) => (c.chatId === chat.chatId ? { ...c, hidden: true } : c));

      try {
        await updateDoc(userChatsRef, {
          chats: updatedChats,
        });

        const remainingChats = updatedChats.filter((c) => !c.hidden);
        if (remainingChats.length > 0) {
          const nextChat = remainingChats[0];
          changeChat(nextChat.chatId, nextChat.user);
        } else {
          changeChat('', null); // Clear the chat if no remaining chats
        }

        setChats(remainingChats);
      } catch (error) {
        console.log(error);
      }

      return;
    }

    // Handle single or double click
    const userChats = chats.map((item) => {
      const { user, ...rest } = item;
      return rest;
    });

    const chatIndex = userChats.findIndex((item) => item.chatId === chat.chatId);
    userChats[chatIndex].isSeen = true;

    const userChatsRef = doc(db, 'userchats', currentUser.id);

    try {
      await updateDoc(userChatsRef, {
        chats: userChats,
      });
      changeChat(chat.chatId, chat.user);
    } catch (error) {
      console.log(error);
    }
  };

  const filteredChats = chats
    .filter((c) => c.user && c.user.username && c.user.username.toLowerCase().includes(query.toLowerCase()))
    .filter((c) => !c.hidden);

  // Sort filtered chats by activity (recently chatted with or received a message)
  filteredChats.sort((a, b) => {
    // If both have been seen or unseen, sort by updatedAt descending
    if (a.isSeen === b.isSeen) {
      return b.updatedAt - a.updatedAt;
    }
    // Otherwise, prioritize unseen chats
    return a.isSeen ? 1 : -1;
  });

  return (
    <div className={`${openSettings ? 'bg-white' : 'bg-[#EDEDED]'} ${!isDesktop && ' w-full h-[710px]'} w-72 h-screen font-semibold  dark:bg-slate-800 dark:text-white`}>
      {openSettings ? (
        <Settings />
      ) : (
        <>
          <div className='flex justify-between items-center  px-5 pt-5 '>
            <p className='font-medium'>Messages</p>
            <Image
              onClick={handleSettings}
              src={currentUser.avatar || DefaultAvatar}
              alt='Profile'
              width={35}
              height={35}
              className='rounded-full cursor-pointer'
            />
          </div>
          <div className='relative p-5'>
            <div className={`relative flex items-center bg-[#E1E1E1] ${!isDesktop && 'py-5'} dark:bg-slate-700  ${!isDesktop && ' w-full'}  rounded-md w-60 h-8`}>
              <CiSearch className='absolute left-3'/>
              <input
                name='SearchBar'
                id='Searchbar'
                placeholder='Search'
                className={`bg-transparent outline-none flex-grow pl-9 pr-3 py-1 dark:placeholder-slate-100 font-normal text-sm placeholder:text-black`}
                autoComplete='off'
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Chatlist */}
          {loading ? (
            <div className='loaderChatList mt-96'></div>
          ) : (
            <div className={`bg-white h-[510px]  ${!isDesktop &&  'h-[570px]'} overflow-auto rounded-bl-md dark:bg-slate-900 dark:text-white`}>
              {filteredChats.map((chat, index) => (
                <div
                  onClick={(e) => handleSelected(chat, e)}
                  key={chat.chatId}
                  className={`w-full  ${chat?.isSeen ? '' : ''} h-14 bg-[#FFFFFF] border border-slate-100 dark:border-slate-800 pl-5 flex items-center cursor-pointer ${!isDesktop && 'h-16'}`}
                  style={{
                    backgroundColor: chat?.isSeen ? 'transparent' : '#6366F1',
                    borderBottom: index !== filteredChats.length - 1 ? '1px solid #E2E8F0 dark:border-gray-900' : 'none',
                  }}
                >
                  <Image
                    src={chat.user.blocked.includes(currentUser.id) ? DefaultAvatar : chat.user.avatar || DefaultAvatar}
                    alt='Profile'
                    width={35}
                    height={35}
                    className='rounded-full'
                  />
                  <div className='ml-3'>
                    <p className='font-medium text-sm'>
                      {chat.user.blocked.includes(currentUser.id) ? 'User' : chat.user.username}
                    </p>
                    <p className='font-normal text-xs line-clamp-1'>{chat.lastMessage}</p>
                  </div>
                </div>     
              ))}
              <span
                onClick={() => setAddUser((prev) => !prev)}
                className={`bg-[#54617F] hover:bg-opacity-90 z-50 text-white px-3 py-1 absolute top-[580px] left-56 font-normal rounded-sm cursor-pointer ${!isDesktop && 'absolute left-[330px] top-[630px]'} `}
              >
                {adduser ? '-' : '+'}
              </span>
            </div>
          )}
        </>
      )}
      {adduser && <AddUser onClose={() => setAddUser(false)} />}
    </div>
  );
}

export default LeftSideBar;
