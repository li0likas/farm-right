import { useOutletContext, Link } from "react-router-dom";
import { useState } from 'react'
import { AlertTypes } from "../styles/modules/AlertStyles";
import '../styles/Home.css';
import axios from 'axios';
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import { PieChart } from '@mui/x-charts/PieChart';
import photo from '../images/logo.png';
import anime from 'animejs/lib/anime.es.js';
import React, { useRef, useEffect } from 'react';

export default () => {
    const animationRef = React.useRef(null);
    React.useEffect(() => {
        var tl = anime.timeline({
        easing: 'linear',
        duration: 750,
        loop: true,
        direction:'alternate'
      });
      tl
      .add({
        targets: '#fly',
        translateX: 40,
      })
      .add({
        targets: '#fly',
        translateX: -40,
      });

      animationRef.current = tl
    })

  return (
    
    <div>
    <NavBar/>
    <div className="container bg-white pt-24 flex h-full">
        <div className="mx-auto flex" id="fly">
          <img src={photo} height={400} width={400} />
        </div>
    </div>
    <div className="container bg-white pt-8 pb-16 text-center mx-auto">
        <div className="mx-auto flex">
        <h2 className="text-4xl flex mx-auto">Page not found</h2>
        </div>
        <div className="mx-auto flex pb-6 pt-3">
        <h2 className="text-xl flex mx-auto font-medium">Looks like you have to plow a little more to unlock this page</h2>
        </div>
        <Link to="/" className="bg-[#388E3C] border-[1px] border-[#61E9B1] hover:bg-[#4edba1] rounded-lg text-black p-3 m-2 text-sm border border-solid border-[#61E9B1]">
        Back to farm
        </Link>
        <div className="mx-auto flex pb-3 pt-12">
        <h2 className="text-xl flex mx-auto font-medium">Or you can also:</h2>
        </div>
        <div className="md:flex">
            <div className="ml-auto mr-auto pl-2 pr-2">
                <div className="mx-auto flex pt-3 pb-6">
                <h2 className="text-xl flex mx-auto">Check your crops</h2>
                </div>
                <p className="pb-6">You can see the crops you are growing and their status</p>
                <Link to="/crops" className="bg-[#388E3C] border-[1px] border-[#61E9B1] hover:bg-[#4edba1] rounded-lg text-black p-3 m-2 text-sm border border-solid border-[#61E9B1]">
                Crops
                </Link>
            </div>
            <div className="ml-auto mr-auto pl-2 pr-2">
                <div className="mx-auto flex md:pt-3 pt-12 pb-6">
                <h2 className="text-xl flex mx-auto">See your tasks</h2>
                </div>
                <p className="pb-6">You can see upcoming and completed farming tasks and their details</p>
                <Link to="/tasks" className="bg-[#388E3C] border-[1px] border-[#61E9B1] hover:bg-[#4edba1] rounded-lg text-black p-3 m-2 text-sm border border-solid border-[#61E9B1]">
                Events
                </Link>
            </div>
            <div className="ml-auto mr-auto pl-2 pr-2">
                <div className="mx-auto flex md:pt-3 pt-12 pb-6">
                <h2 className="text-xl flex mx-auto">View your fields</h2>
                </div>
                <p className="pb-6">You can see your farming fields</p>
                <Link to="/fields" className="bg-[#388E3C] border-[1px] border-[#61E9B1] hover:bg-[#4edba1] rounded-lg text-black p-3 m-2 text-sm border border-solid border-[#61E9B1]">
                Achievements
                </Link>
            </div>
            <div className="ml-auto mr-auto pl-2 pr-2">
                <div className="mx-auto flex md:pt-3 pt-12 pb-6">
                <h2 className="text-xl flex mx-auto">Learn more about us</h2>
                </div>
                <p className="pb-6">You can see information about our farming system and its creators</p>
                <Link to="/about-us" className="bg-[#388E3C] border-[1px] border-[#61E9B1] hover:bg-[#4edba1] rounded-lg text-black p-3 m-2 text-sm border border-solid border-[#61E9B1]">
                About us
                </Link>
            </div>
        </div>
    </div>
    <Footer />
    </div>
  );
};