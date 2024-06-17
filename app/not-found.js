'use client'
import Link from 'next/link'
import Image from "next/image";
import NotFoundIMG from  './images/404.png'
import { useMediaQuery } from 'react-responsive';

 
export default function NotFound() {

    const isDesktop = useMediaQuery({ minWidth: 768 });

  return (
    <div className='flex justify-center bg-slate-950 items-center h-screen flex-col gap-10'>
      <Image src={NotFoundIMG} alt='notfound' className={`${!isDesktop? 'w-72' : 'w-96' }`}/>
      <Link href="/" className='bg-slate-950 border border-slate-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-3 hover:bg-slate-900'>
      Go Back
      </Link>
    </div>
  )
}

