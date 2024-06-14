import Image from "next/image";
import Alex from '@/app/images/Alex.svg';
import { collection, getDocs, doc, query as firestoreQuery, serverTimestamp, setDoc, where, arrayUnion, updateDoc } from "firebase/firestore";
import { db } from "../lib/Firebase";
import { useState, useEffect } from "react";
import { useUserStore } from "../lib/UserStore";
import { useMediaQuery } from 'react-responsive';
import DefaultAvatar from '@/app/images/DefaultAvatar.png';
import VibeChat from '@/app/images/VibeChat.png';

type User = {
    id: string;
    username: string;
    avatar?: string;
    password: string;
    email: string;
    about: string;
    deleted?: boolean; 
};

const AddUser = () => {
    const [user, setUser] = useState<User | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [userNotFound, setUserNotFound] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const { currentUser } = useUserStore();
    const isDesktop = useMediaQuery({ minWidth: 768 });

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const userRef = collection(db, "users");
                const querySnapshot = await getDocs(userRef);
                let usersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as User[];

                const uniqueUsers = new Map();
                usersList.forEach(user => {
                    if (!user.deleted && !uniqueUsers.has(user.username)) {
                        uniqueUsers.set(user.username, user);
                    }
                });

                setUsers(Array.from(uniqueUsers.values()));
            } catch (error) {
                console.error("Error fetching users:", error);
            }
        };

        fetchUsers();
    }, []);

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
                if (!userData.deleted) {
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

            console.log(newChatRef.id);
            setUser(null);
        } catch (error) {
            console.error("Error adding user:", error);
        }
    };

    // Filter users based on search query
    const filteredUsers = users.filter(user => user.username.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className={`p-6 bg-white shadow-lg border rounded-md absolute h-96 overflow-auto top-40 left-72 m-auto w-96 ${!isDesktop && 'absolute top-52 left-0 w-60 '}`}>
            <form onSubmit={handleSearch} className="space-y-4 ">
                <input
                    type="text"
                    placeholder="Search"
                    name="username"
                    className="w-full  p-2 border border-gray-300 text-sm rounded-lg focus:outline-none placeholder:text-sm font-normal"
                    autoComplete="off"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                {userNotFound && (
                    <div className="text-slate-800 text-sm text-center">User not found.</div>
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
                    <h2 className="text-lg font-medium text-gray-700 ml-2">All Vibers</h2>
                </div>
                <ul className="mt-4 space-y-2">
                    {filteredUsers.map((user) => (
                        <li key={user.id} className="p-2 bg-slate-100 rounded flex items-center justify-between">
                            <div className="detail flex items-center space-x-4">
                                <Image src={user.avatar || DefaultAvatar} alt="User Avatar" width={40} height={40} className="rounded-full" />
                                <span className="font-medium text-gray-700">{user.username}</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleAddUser(user)}
                                className="bg-blue-500 text-white py-2 px-4 text-sm font-medium rounded hover:bg-opacity-90 transition duration-300"
                            >
                                Add
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default AddUser;
