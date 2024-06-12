import Image from "next/image";
import Alex from '@/app/images/Alex.svg';
import { collection, getDocs, doc, query, serverTimestamp, setDoc, where, arrayUnion, updateDoc } from "firebase/firestore";
import { db } from "../lib/Firebase";
import { useState } from "react";
import { useUserStore } from "../lib/UserStore";

const AddUser = (adduser:any) => {
    const [user, setUser] = useState(null);
    const [userNotFound, setUserNotFound] = useState(false);

    const {currentUser} = useUserStore()

    const handleSearch = async (e:any) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const username = formData.get('username');

        try {
            const userRef = collection(db, "users");
            const q = query(userRef, where("username", "==", username));
            const querySnapShot = await getDocs(q);

            if (!querySnapShot.empty) {
                setUser(querySnapShot.docs[0].data());
                setUserNotFound(false);
            } else {
                setUser(null);
                setUserNotFound(true);
            }
        } catch (error) {
            console.error("Error searching for user:", error);
        }
    };
    const handleAddUser = async () => {

        const chatRef = collection(db, 'chats')
        const userChatsRef = collection(db, 'userchats')

        try {

            const newChatRef = doc(chatRef)

            await setDoc(newChatRef, {
                createdAt: serverTimestamp(),
                messages: []
            })

            await updateDoc(doc(userChatsRef, user.id),{
                chats:arrayUnion({
                    chatId: newChatRef.id,
                    lastMessage: '',
                    receiverId: currentUser.id,
                    updatedAt: Date.now()
                })
            })
            await updateDoc(doc(userChatsRef, currentUser.id),{
                chats:arrayUnion({
                    chatId: newChatRef.id,
                    lastMessage: '',
                    receiverId: user.id,
                    updatedAt: Date.now()
                })
            })
            console.log(newChatRef.id)
            setUser(null)
          
            
            
            
            
        } catch (error) {
            console.log(error)
        }
    }

    return (
        <div className="p-6 bg-white shadow-lg border rounded-md absolute top-40 left-96 m-auto w-80">
            <form onSubmit={handleSearch} className="space-y-4">
                <input 
                    type="text" 
                    placeholder="Search for username" 
                    name="username" 
                    className="w-full p-2 border border-gray-300 text-sm rounded-lg focus:outline-none placeholder:text-sm font-normal"
                    autoComplete="off"
                />
                <button 
                    type="submit" 
                    className="w-full bg-slate-900 text-white py-2 font-normal text-sm rounded-md hover:bg-black transition duration-300"
                >
                    Search
                </button>
                {userNotFound && (
                    <div className="text-slate-800 text-sm text-center">User not found.</div>
                )}
                {user &&
                <div className="user mt-4 p-3 bg-slate-100 rounded flex items-center justify-between">
                    <div className="detail flex items-center space-x-4">
                        <Image src={user.avatar || Alex} alt="User Avatar" width={40} height={40} className="rounded-full" />
                        <span className="font-medium text-gray-700">{user.username}</span>
                    </div>
                    <button 
                        type="button" 
                        onClick={handleAddUser}
                        className="bg-blue-500 text-white py-2 px-4 text-sm font-medium rounded hover:bg-opacity-90 transition duration-300"
                    >
                        Add User
                    </button>
                </div>
                }
            </form>
        </div>
    );
};

export default AddUser;
