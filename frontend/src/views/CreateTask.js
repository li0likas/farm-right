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

  const [taskDescription, setTaskDescription] = useState('');
  const [taskStatus, setTaskStatus] = useState('');
  const [taskFieldOptions, setTaskFieldOptions] = useState([]);
  const [taskField, setTaskField] = useState(fieldId || '');
  const [taskTypeOptions, setTaskTypeOptions] = useState([]);
  const [taskStatusOptions, setTaskStatusOptions] = useState([]);
  const [taskType, setTaskType] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [completionDate, setCompletionDate] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');

    if (!fieldId) {
    axios.get(`${process.env.REACT_APP_API_BASE_URL}/fields`, {
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
    }

    axios.get(`${process.env.REACT_APP_API_BASE_URL}/task-type-options`, {
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

    axios.get(`${process.env.REACT_APP_API_BASE_URL}/task-status-options`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then(response => {
      setTaskStatusOptions(response.data);
    })
    .catch(error => {
      console.error('Error fetching task status options:', error);
    });
  }, []);

  const validate = () => {
    if (!taskDescription || !taskStatus || !taskField || !taskType) {
      setAlert({ text: 'There are empty fields', type: AlertTypes.warning });
      return false;
    }
    if (taskStatus == 2 && !dueDate) {
      setAlert({ text: 'Due Date is required', type: AlertTypes.warning });
      return false;
    }
    if (taskStatus == 1 && !completionDate) {
      setAlert({ text: 'Completion Date is required', type: AlertTypes.warning });
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
      description: taskDescription,
      statusId: parseInt(taskStatus),
      fieldId: parseInt(taskField),
      typeId: parseInt(taskType),
    };

    if (dueDate) {
      formData.dueDate = new Date(dueDate);
    }

    if (completionDate) {
      formData.completionDate = new Date(completionDate);
    }

    axios.post(`${process.env.REACT_APP_API_BASE_URL}/tasks`, formData, {
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

  const handleTaskStatusChange = (e) => {
    const status = e.target.value;
    setTaskStatus(status);
    if (status == 1) {
      setDueDate(null);
    } else if (status == 2) {
      setCompletionDate(null);
    }
  };

  return isLoggedIn() ? (
    <div className="w-full">
      <div className="container sm:flex pt-12">
        <div className="w-3/6 sm:mx-8 mx-auto">
          <h1 className="text-2xl text-center font-medium">Create a Task</h1>
          <hr className="my-6" />

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
            <div className="text-base mb-2">Description</div>
            <textarea value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} placeholder="Description" className="w-full p-3 border-[1px] border-gray-400 rounded-lg hover:border-[#61E9B1]" />
          </div>

          <div className="mb-3">
            <div className="text-base mb-2">Status</div>
            <select value={taskStatus} onChange={handleTaskStatusChange} className="w-full p-3 border-[1px] border-gray-400 rounded-lg bg-white hover:border-[#61E9B1]">
              <option value="">Select task status</option>
              {taskStatusOptions
                .filter(option => option.name.toLowerCase() !== 'canceled')
                .map(option => (
                  <option key={option.id} value={option.id}>{option.name.charAt(0).toUpperCase() + option.name.slice(1)}</option>
                ))}
            </select>
          </div>

          {!fieldId && (
            <div className="mb-3">
              <div className="text-base mb-2">Field</div>
              <select value={taskField} onChange={(e) => setTaskField(e.target.value)} className="w-full p-3 border-[1px] border-gray-400 rounded-lg bg-white hover:border-[#61E9B1]">
                <option value="">Select field</option>
                {taskFieldOptions.map(option => (
                  <option key={option.id} value={option.id}>{option.name.charAt(0).toUpperCase() + option.name.slice(1)}</option>
                ))}
              </select>
            </div>
          )}

          {taskStatus == 2 && (
            <div className="mb-3">
              <div className="text-base mb-2">Due Date</div>
              <input value={dueDate} onChange={(e) => setDueDate(e.target.value)} type="date" className="w-full p-3 border-[1px] border-gray-400 rounded-lg hover:border-[#61E9B1]" />
            </div>
          )}

          {taskStatus == 1 && (
            <div className="mb-3">
              <div className="text-base mb-2">Completion Date</div>
              <input value={completionDate} onChange={(e) => setCompletionDate(e.target.value)} type="date" className="w-full p-3 border-[1px] border-gray-400 rounded-lg hover:border-[#61E9B1]" />
            </div>
          )}

          <hr className="my-9 mt-12" />

          <button onClick={createTask} className="w-full mb-3 p-3 bg-[#388E3C] border-[1px] border-[#61E9B1] rounded-lg hover:bg-[#4edba1]">
            <i className="fa-solid fa-seedling"></i> Create Task
          </button>
          {!fieldId ? (
            <Link to="/tasks" className="w-full mb-3 p-3 bg-gray-300 border-[1px] border-gray-300 rounded-lg hover:bg-gray-400 text-center block">
              <i className="fa-solid fa-arrow-left"></i> Back to Tasks
            </Link>
          ) : (
            <Link to={`/fields/${taskField}`} className="w-full mb-3 p-3 bg-gray-300 border-[1px] border-gray-300 rounded-lg hover:bg-gray-400 text-center block">
            <i className="fa-solid fa-arrow-left"></i> Back to Field
          </Link>
          )}
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