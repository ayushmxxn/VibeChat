import Image from "next/image";
import { collection, getDocs, doc, query as firestoreQuery, serverTimestamp, setDoc, updateDoc, onSnapshot, getDoc, arrayUnion, where } from "firebase/firestore";
import { db } from "../lib/Firebase";
import { useState, useEffect, FunctionComponent } from "react";
import { useUserStore } from "../lib/UserStore";
import { useMediaQuery } from 'react-responsive';
import DefaultAvatar from '@/app/images/DefaultAvatar.png';
import VibeChat from '@/app/images/VibeChat.png';
import { toast } from "react-toastify";

type User = {
    id: string;
    username: string;
    avatar?: string;
    password: string;
    email: string;
    about: string;
    deleted?: boolean; 
};

type ChatItem = {
    chatId: string;
    receiverId: string;
    updatedAt: number;
    user: User;
    isSeen: boolean;
    lastMessage: string;
    hidden: boolean;
};

interface AddUserProps {
    onClose: () => void;
}

const AddUser: FunctionComponent<AddUserProps> = ({ onClose }) => {
    const [user, setUser] = useState<User | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [userNotFound, setUserNotFound] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const { currentUser } = useUserStore();
    const [loading, setLoading] = useState(false);
    const [chats, setChats] = useState<ChatItem[]>([]); // State to hold chats
    const isDesktop = useMediaQuery({ minWidth: 768 });

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            try {
                const userRef = collection(db, "users");
                const querySnapshot = await getDocs(userRef);
                let usersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as User[];

                const uniqueUsers = new Map();
                usersList.forEach(user => {
                    if (!user.deleted && user.id !== currentUser.id && !uniqueUsers.has(user.username)) {
                        uniqueUsers.set(user.username, user);
                    }
                });

                setUsers(Array.from(uniqueUsers.values()));
                setLoading(false);
            } catch (error) {
                console.error("Error fetching users:", error);
                setLoading(false);
            }
        };

        const fetchChats = async () => {
            try {
                const userChatsRef = doc(db, 'userchats', currentUser.id);
                const chatSnapshot = await getDoc(userChatsRef);

                if (chatSnapshot.exists()) {
                    const userData = chatSnapshot.data();
                    if (userData) {
                        const chatsData = userData.chats || [];
                        setChats(chatsData);
                    }
                }
            } catch (error) {
                console.error("Error fetching chats:", error);
            }
        };

        fetchUsers();
        fetchChats();
    }, [currentUser.id]);

    const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const username = formData.get('username') as string;

        try {
            const userRef = collection(db, "users");
            const q = firestoreQuery(userRef, where("username", "==", username));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const userData = querySnapshot.docs[0].data() as User;
                if (!userData.deleted && userData.id !== currentUser.id) {
                    setUser(userData);
                    setUserNotFound(false);
                } else {
                    setUser(null);
                    setUserNotFound(true);
                }
            } else {
                setUser(null);
                setUserNotFound(true);
            }
        } catch (error) {
            console.error("Error searching for user:", error);
        }
    };

    const handleAddUser = async (user: User) => {
        const chatRef = collection(db, 'chats');
        const userChatsRef = collection(db, 'userchats');

        // Check if user is already in chats
        const userAlreadyAdded = chats.some(chat => chat.receiverId === user.id);

        if (userAlreadyAdded) {
            toast.error(`${user.username} is already in your chat list.`);
            onClose();
            return;
        }

        try {
            const newChatRef = doc(chatRef);

            await setDoc(newChatRef, {
                createdAt: serverTimestamp(),
                messages: []
            });

            await updateDoc(doc(userChatsRef, user.id), {
                chats: arrayUnion({
                    chatId: newChatRef.id,
                    lastMessage: '',
                    receiverId: currentUser.id,
                    updatedAt: Date.now()
                })
            });

            await updateDoc(doc(userChatsRef, currentUser.id), {
                chats: arrayUnion({
                    chatId: newChatRef.id,
                    lastMessage: '',
                    receiverId: user.id,
                    updatedAt: Date.now()
                })
            });

            toast.success(`${user.username} added to chat list.`);
            onClose(); 
        } catch (error) {
            console.error("Error adding user:", error);
        }
    };

    // Filter users based on search query
    const filteredUsers = users.filter(user => user.username.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className={`p-6 bg-white dark:bg-slate-900 shadow-lg border dark:border-slate-700 rounded-md absolute h-96 overflow-auto top-40 left-1 sm:left-72 m-auto w-96 ${!isDesktop && ''}`}>
            <form onSubmit={handleSearch} className="space-y-4 ">
                <input
                    type="text"
                    placeholder="Search"
                    name="username"
                    className="w-full dark:placeholder-slate-100 pl-3  p-2 border dark:bg-slate-700 border-gray-300 dark:border-slate-700 text-sm rounded-lg focus:outline-none placeholder:text-sm font-normal"
                    autoComplete="off"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                {userNotFound && (
                    <div className="text-slate-800 text-sm text-center dark:text-white">User not found.</div>
                )}
                {user &&
                    <div className="user mt-4 p-3 bg-slate-100 rounded flex items-center justify-between">
                        <div className="detail flex items-center space-x-4">
                            <Image src={user.avatar || DefaultAvatar} alt="User Avatar" width={40} height={40} className="rounded-full" />
                            <span className="font-medium text-gray-700">{user.username}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => handleAddUser(user)}
                            className="bg-blue-500 text-white py-2 px-4 text-sm font-medium rounded hover:bg-opacity-90 transition duration-300"
                        >
                            Add User
                        </button>
                    </div>
                }
            </form>

            <div className="mt-6">
                <div className="flex items-center">
                    <Image src={VibeChat} alt="logo" width={20} height={20}/>
                    <h2 className="text-lg font-medium text-gray-700 ml-2 dark:text-slate-300">{users.length} Vibers</h2>
                </div>
                <hr className='my-3 border-t-1 border-slate-300 dark:border-slate-500 mx-2'/>
                {loading ? (
                    <span className="loaderAuthImage mt-10 ml-36 "></span>
                ) : (
                    <ul className="mt-4 space-y-2">
                        {filteredUsers.map((user) => (
                            <li key={user.id} className="p-2 bg-slate-100 dark:bg-slate-800  overflow-auto  rounded flex items-center justify-between">
                                <div className="detail flex items-center space-x-4">
                                    <Image src={user.avatar || DefaultAvatar} alt="User Avatar" width={40} height={40} className="rounded-full" />
                                    <span className="font-medium text-gray-700 dark:text-white ">{user.username}</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleAddUser(user)}
                                    className="bg-blue-500  text-white py-2 px-4 text-sm font-medium rounded hover:bg-opacity-90 transition duration-300"
                                >
                                    Add
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default AddUser;
