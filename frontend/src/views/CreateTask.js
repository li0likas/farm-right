import { useOutletContext, Navigate, useParams } from "react-router-dom";
import { useState, useEffect } from 'react';
import { AlertTypes } from "../styles/modules/AlertStyles";
import axios from 'axios';
import NavBar from "../components/NavBar";
import { Link } from "react-router-dom";
import { isLoggedIn } from "../classes/Auth";

export default () => {
  const { setAlert } = useOutletContext();
  const { fieldId } = useParams();

  const [taskName, setTaskName] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskStatus, setTaskStatus] = useState('');
  const [taskFieldOptions, setTaskFieldOptions] = useState([]);
  const [taskField, setTaskField] = useState(fieldId || '');
  const [taskTypeOptions, setTaskTypeOptions] = useState([]);
  const [taskType, setTaskType] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [completionDate, setCompletionDate] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    axios.get('http://localhost:3333/fields', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then(response => {
        setTaskFieldOptions(response.data);
      })
      .catch(error => {
        console.error('Error fetching field options:', error);
      });

    axios.get('http://localhost:3333/task-type-options', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then(response => {
        setTaskTypeOptions(response.data);
      })
      .catch(error => {
        console.error('Error fetching task type options:', error);
      });
  }, []);

  const validate = () => {
    if (!taskName || !taskDescription || !taskStatus || !taskField || !taskType) {
      setAlert({ text: 'There are empty fields', type: AlertTypes.warning });
      return false;
    }
    return true;
  }

  const createTask = () => {
    if (!validate()) return;

    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      return;
    }
    const formData = {
      name: taskName,
      description: taskDescription,
      status: taskStatus,
      fieldId: parseInt(taskField),
      typeId: parseInt(taskType),
      dueDate: dueDate ? new Date(dueDate) : null,
      completionDate: completionDate ? new Date(completionDate) : null,
    };

    axios.post('http://localhost:3333/tasks', formData, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })
      .then(response => {
        console.log(response);
        setAlert({ text: 'Task created successfully', type: AlertTypes.success });
      })
      .catch(error => {
        console.error(error);
        setAlert({ text: 'Error creating task', type: AlertTypes.error });
      });
  }

  return isLoggedIn() ? (
    <div className="w-full">
      <div className="container sm:flex pt-12">
        <div className="w-3/6 sm:mx-8 mx-auto">
          <h1 className="text-2xl text-center font-medium">Create a Task</h1>
          <hr className="my-6" />

          <div className="mb-3">
            <div className="text-base mb-2">Task Name</div>
            <input value={taskName} onChange={(e) => setTaskName(e.target.value)} type="text" placeholder="Task name" className="w-full p-3 border-[1px] border-gray-400 rounded-lg hover:border-[#61E9B1]" />
          </div>

          <div className="mb-3">
            <div className="text-base mb-2">Description</div>
            <textarea value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} placeholder="Description" className="w-full p-3 border-[1px] border-gray-400 rounded-lg hover:border-[#61E9B1]" />
          </div>

          <div className="mb-3">
            <div className="text-base mb-2">Status</div>
            <input value={taskStatus} onChange={(e) => setTaskStatus(e.target.value)} type="text" placeholder="Status" className="w-full p-3 border-[1px] border-gray-400 rounded-lg hover:border-[#61E9B1]" />
          </div>

          <div className="mb-3">
            <div className="text-base mb-2">Field</div>
            <select value={taskField} onChange={(e) => setTaskField(e.target.value)} className="w-full p-3 border-[1px] border-gray-400 rounded-lg bg-white hover:border-[#61E9B1]">
              <option value="">Select field</option>
              {taskFieldOptions.map(option => (
                <option key={option.id} value={option.id}>{option.name.charAt(0).toUpperCase() + option.name.slice(1)}</option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <div className="text-base mb-2">Task Type</div>
            <select value={taskType} onChange={(e) => setTaskType(e.target.value)} className="w-full p-3 border-[1px] border-gray-400 rounded-lg bg-white hover:border-[#61E9B1]">
              <option value="">Select task type</option>
              {taskTypeOptions.map(option => (
                <option key={option.id} value={option.id}>{option.name.charAt(0).toUpperCase() + option.name.slice(1)}</option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <div className="text-base mb-2">Due Date</div>
            <input value={dueDate} onChange={(e) => setDueDate(e.target.value)} type="date" className="w-full p-3 border-[1px] border-gray-400 rounded-lg hover:border-[#61E9B1]" />
          </div>

          <div className="mb-3">
            <div className="text-base mb-2">Completion Date</div>
            <input value={completionDate} onChange={(e) => setCompletionDate(e.target.value)} type="date" className="w-full p-3 border-[1px] border-gray-400 rounded-lg hover:border-[#61E9B1]" />
          </div>

          <hr className="my-9 mt-12" />

          <button onClick={createTask} className="w-full mb-3 p-3 bg-[#388E3C] border-[1px] border-[#61E9B1] rounded-lg hover:bg-[#4edba1]">
            <i className="fa-solid fa-seedling"></i> Create Task
          </button>
          <Link to="/tasks" className="w-full mb-3 p-3 bg-gray-300 border-[1px] border-gray-300 rounded-lg hover:bg-gray-400 text-center block">
            <i className="fa-solid fa-arrow-left"></i> Back to Tasks
          </Link>
        </div>
        <div className="w-3/6 sm:mx-8 mx-auto">
          <h2 className="pb-3 pt-1 font-semibold text-xl">Why are tasks important?</h2>
          <p>Tasks represent specific activities to be performed in the fields, providing an organized way to manage agricultural operations.</p>
          <h2 className="pb-3 pt-6 font-semibold text-xl">Who can create a task?</h2>
          <p>Any registered user involved in agricultural activities can create tasks to manage their operations effectively.</p>
        </div>
      </div>
    </div>
  ) : (
    <Navigate to='/login' />
  );
};