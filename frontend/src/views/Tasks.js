import { useState, useEffect } from 'react';
import { Navigate, Link } from "react-router-dom";
import axios from 'axios';
import { isLoggedIn } from "../classes/Auth";
import taskImage from '../images/taskImage.png';
import '../styles/Home.css';

export default () => {
  const [tasks, setTasks] = useState([]);
  const [points, setPoints] = useState([]);
  const [activeTab, setActiveTab] = useState("upcoming");

  useEffect(() => {
    const token = localStorage.getItem('accessToken');

    axios.get('http://localhost:3333/tasks', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(response => setTasks(response.data))
      .catch(error => console.error('Error fetching tasks:', error));
  }, []);

  const percentage = (points.userPoints / points.totalPoints) * 100;

  const data = [
    { id: 0, value: percentage, color: '#388E3C' },
    { id: 1, value: 100 - percentage, color: '#f9fafb' },
  ];

  const filteredTasks = tasks.filter(task => {
    if (activeTab === "upcoming") {
      return task.status === "Pending";
    }
    if (activeTab === "canceled") {
      return task.status === "Canceled";   
    }
    else {
      return task.status === "Completed";
    }
  });

  return isLoggedIn() ? (
    <div>
      <div className="container bg-white pt-12">
        <div className="text-[#388E3C]">
          <h2 className="text-center text-2xl mb-4">Tasks</h2>
        </div>
        {/* <div className="mt-4 mb-4 mr-7 text-right">
          <p>My points: {getUser().points}</p>
        </div> */}
       
        <div className="text-center mb-4">
          <button
            className={`px-4 py-2 rounded-lg mx-2 ${activeTab === "upcoming" ? "bg-[#388E3C] text-black" : "bg-gray-300 text-gray-800"}`}
            onClick={() => setActiveTab("upcoming")}
          >
            Upcoming Tasks
          </button>
          <button
            className={`px-4 py-2 rounded-lg mx-2 ${activeTab === "completed" ? "bg-[#388E3C] text-black" : "bg-gray-300 text-gray-800"}`}
            onClick={() => setActiveTab("completed")}
          >
            Completed Tasks
          </button>
          <button
            className={`px-4 py-2 rounded-lg mx-2 ${activeTab === "canceled" ? "bg-[#388E3C] text-black" : "bg-gray-300 text-gray-800"}`}
            onClick={() => setActiveTab("canceled")}
          >
            Canceled Tasks
          </button>
        </div>

        {filteredTasks.length === 0 ? (
              <div className="text-center w-full">
                <p>No tasks.</p>
              </div>
            ) : (
          <div className="md:flex">
            <div className="w-full grid md:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-4 pl-5 pr-5">
              {filteredTasks.map((task) => (
                <div key={task.id} className="h-[420px] rounded-xl mt-3 text-center pt-5 pb-5 bg-gray-50 border border-solid border-[#61E9B1]">
                  <div className="rounded-4xl pb-3 pt-2 flex justify-center items-center">
                      <img id="taskImg" style={{ width: '200px', height: '200px' }} className="my-auto" src={taskImage} alt="Task" />
                  </div>
                  <div>
                    <div className="max-w-64">
                      <h2 className="font-semibold pb-1">{task.title}</h2>
                      <p className="text-sm"><i className="fa-solid fa-layer-group"></i> Field: {task.field.name}</p>
                      <p className="text-sm"><i className="fa-solid fa-check-circle"></i> Status: {task.status}</p>
                    </div>
                    <hr className="mt-4 mb-4 mx-8" />
                    <div>
                      {task.dueDate && <p className="text-sm">Due Date: {new Date(task.dueDate).toLocaleDateString('en-CA')}</p>}
                      {task.completionDate && <p className="text-sm">Completed Date: {new Date(task.completionDate).toLocaleDateString('en-CA')}</p>}
                    </div>
                  </div>
                  <div className="flex">
                    <Link to={`/tasks/${task.id}`} className="mx-auto bg-[#388E3C] hover:bg-[#4edba1] rounded-lg text-black p-3 md:my-6 text-sm">
                      View Task
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
          )}
      </div>
    </div>
  ) : (
    <Navigate to='/login' />
  );
};
