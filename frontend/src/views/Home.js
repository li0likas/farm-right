import '../styles/Home.css';

// Images
import intro from '../images/farming_intro.png'; // Update with farming-related image
import platformView from '../images/farming_platform.png'; // Update with farming platform image
import smartphone from '../images/smartphone.png';
import browser from '../images/browser.png';
import taskManagement from '../images/taskManagement.png'; // New image for task management
import cropMonitoring from '../images/cropMonitoring.png'; // New image for crop monitoring
import collaboration from '../images/collaboration.png'; // New image for collaboration

import Accordion from '@mui/material/Accordion';
import AccordionActions from '@mui/material/AccordionActions';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Button from '@mui/material/Button';
import { Link } from 'react-router-dom';
import React from 'react';
import { isLoggedIn } from '../classes/Auth';
import Questions from "../components/Questions";

export default () => {
  return (
    <div className='mt-14' style={{ backgroundColor: '#F5F5F5' }}>

      <div className='flex' style={{ background: 'linear-gradient(235deg, rgba(188,238,187,1) 0%, rgba(245, 245, 245, 1) 100%)' }}>
        <div className='container'>
          <div className='flex my-36'>
            <div className='my-auto'>
              <p className='text-7xl font-semibold'>Cultivate Your Farm's Success</p>
              <p className='my-10 text-2xl'>A comprehensive platform for efficient farm management</p>
              <Link to={isLoggedIn() ? '/' : '/register'} className="mb-3 p-3 px-12 bg-[#388E3C] border-[1px] border-[#61E9B1] rounded-lg hover:bg-[#4CAF50] text-lg">
                Get started <i className="fa-solid fa-arrow-right"></i>
              </Link>
            </div>
            <div className='min-w-[400px] pl-24'>
              <img id="introImg" className='my-auto' src={intro} alt="Farming Intro" />
            </div>
          </div>
        </div>
      </div>

      <div className='container flex py-20'>
        <div className='w-1/2'>
          <img className='' src={platformView} alt="Farming Platform View" />
        </div>
        <div className='w-1/2 my-auto pl-12'>
          <p className='mb-5 text-5xl font-semibold'>About <span className='text-[#4CAF50]'>Farm Right</span></p>
          <p className='text-lg'>Farm Right is designed to help you document agricultural fields, record activities, and optimize farm operations. Join a growing community of farmers leveraging technology to enhance productivity.</p>
        </div>
      </div>

      <div className='container pb-20'>
        <p className='mb-16 text-5xl text-center font-semibold'>What you can <span className='text-[#4CAF50]'>do</span> with <span className='text-[#4CAF50]'>Farm Right</span>?</p>
        <div className="grid grid-cols-3 gap-4">

          <div className='text-center p-8'>
            <img className='mb-5 mx-auto h-64 object-contain' src={taskManagement} alt="Task Management" />
            <p className='mb-5 text-[#4CAF50] text-3xl'>Manage Tasks</p>
            <p className='text-lg'>Easily create and manage tasks for sowing, spraying, and harvesting to ensure timely agricultural operations.</p>
          </div>

          <div>
            <div className="w-full">
              <div className="p-8 h-full w-full bg-white rounded-xl mt-3 text-center bg-gray-50 border border-solid border-green-400">
                <img className='mb-5 mx-auto h-64 object-contain' src={collaboration} alt="Collaboration" />
                <p className='mb-5 text-[#4CAF50] text-3xl'>Real-Time Collaboration</p>
                <p className='text-lg'>Work together with workers and agronomists to optimize tasks and share valuable insights.</p>
              </div>
            </div>
          </div>

          <div className='text-center p-8'>
            <img className='mb-5 mx-auto h-64 object-contain' src={cropMonitoring} alt="Crop Monitoring" />
            <p className='mb-5 text-[#4CAF50] text-3xl'>Crop Monitoring</p>
            <p className='text-lg'>Utilize advanced tools for monitoring crop health and managing agricultural activities effectively.</p>
          </div>

        </div>
      </div>

      <div className='bg-green-50 mb-20 py-20'>
        <div className='container'>
          <p className='mb-16 text-5xl text-center font-semibold'>Seamless Management</p>
          <div className="flex">

            {/* <div className='text-center p-16 pb-0'>
              <img className='mb-5 h-56 mx-auto' src={smartphone} alt="Smartphone App" />
              <p className='mb-5 text-[#4CAF50] text-3xl'>Mobile App</p>
              <p className='text-lg'>Manage your farm on-the-go with our user-friendly mobile app that provides all essential functionalities.</p>
            </div> */}

            <div className='text-center p-16 pb-0'>
              <img className='mb-5 h-56 mx-auto object-contain' src={browser} alt="Web Platform" />
              <p className='mb-5 text-[#4CAF50] text-3xl'>Web Platform</p>
              <p className='text-lg'>Access detailed analytics, manage tasks, and collaborate with your team through our comprehensive web platform.</p>
            </div>

          </div>
        </div>
      </div>

      <div className="container md:flex mx-auto pt-8">
        <div className='container pb-20 mx-auto'>
          <p className='mb-16 text-5xl text-center font-semibold'>FAQ</p>
          <Questions />
        </div>
      </div>

      <div className='container pb-20'>
        <p className='mb-16 text-5xl text-center font-semibold'>Join now and cultivate your farm's potential</p>
        <div className='flex'>
          <Link to={isLoggedIn() ? '/' : '/register'} className="mb-3 mx-auto p-3 px-12 bg-[#388E3C] border-[1px] border-[#61E9B1] rounded-lg hover:bg-[#4CAF50] text-lg">
            Get started <i className="fa-solid fa-arrow-right"></i>
          </Link>
        </div>
      </div>

    </div>
  );
};
