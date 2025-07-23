import { useState } from 'react';

const Navbar = () => {

  return (
    <nav className='bg-gray-800'>
      <div className='mx-auto max-w-7xl px-6'>
        <div className='flex h-16 items-center justify-between'>
          <div className='flex items-center'>
            <img
              src='https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500'
              alt='Your Company'
              className='h-8 w-auto'
            />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
