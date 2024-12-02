import React from 'react';
import { useOutletContext, Link, Navigate } from "react-router-dom";
import Accordion from '@mui/material/Accordion';
import AccordionActions from '@mui/material/AccordionActions';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';

const Footer = () => {
  return (
  <div>
        <Accordion defaultExpanded className='py-3'>
          <AccordionSummary
            expandIcon={<i className="fa-solid fa-chevron-down"></i>}
            aria-controls="panel1-content"
            id="panel1-header"
          >
            <b>What can I do on Farm Right?</b>
          </AccordionSummary>
          <AccordionDetails>
            You can manage your farm, track crops, and collaborate with other farmers. The platform offers tools for efficient farm operations, including task management, weather tracking, and field analysis.
          </AccordionDetails>
        </Accordion>
        <Accordion className='py-3'>
          <AccordionSummary
            expandIcon={<i className="fa-solid fa-chevron-down"></i>}
            aria-controls="panel2-content"
            id="panel2-header"
          >
            <b>Is the platform free to use?</b>
          </AccordionSummary>
          <AccordionDetails>
            Yes, Farm Right is free to use with no hidden costs.
          </AccordionDetails>
        </Accordion>
        <Accordion className='py-3'>
          <AccordionSummary
            expandIcon={<i className="fa-solid fa-chevron-down"></i>}
            aria-controls="panel2-content"
            id="panel2-header"
          >
            <b>Can I invite others to join my farm management group?</b>
          </AccordionSummary>
          <AccordionDetails>
            Yes, if you are the farm admin or have the necessary permissions, you can invite others to join your farm management group.
          </AccordionDetails>
        </Accordion>
        <Accordion className='py-3'>
          <AccordionSummary
            expandIcon={<i className="fa-solid fa-chevron-down"></i>}
            aria-controls="panel2-content"
            id="panel2-header"
          >
            <b>Why should I join the Farm Right community?</b>
          </AccordionSummary>
          <AccordionDetails>
          To streamline farm management, collaborate with other farmers, and access powerful tools that help increase productivity and sustainability on your farm.
          </AccordionDetails>
        </Accordion>
        <Accordion className='py-3'>
          <AccordionSummary
            expandIcon={<i className="fa-solid fa-chevron-down"></i>}
            aria-controls="panel1-content"
            id="panel1-header"
          >
            <b>Who can create a farm management group?</b>
          </AccordionSummary>
          <AccordionDetails>
            Any user who manages a farm or a team of farmers and wants to collaborate on farm-related tasks and operations.
          </AccordionDetails>
        </Accordion>
  </div>
  );
};

export default Footer;
