import React, { useEffect, useState } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { AlertTypes } from "../styles/modules/AlertStyles";
import axios from 'axios';

const Task = () => {
  const { taskId } = useParams();
  const { setAlert } = useOutletContext();
  const [task, setTaskInfo] = useState({});
  const [taskComments, setTaskComments] = useState([]);
  const [commentContent, setCommentContent] = useState('');
  const [loading, setLoading] = useState(true); // Add loading state

  useEffect(() => {
    fetchTaskInfo();
  }, [taskId]);
  

  const fetchTaskInfo = async () => {
    const token = localStorage.getItem('accessToken');
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/tasks/${taskId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

      setTaskInfo(response.data);
      setLoading(false);
      fetchTaskComments(taskId);

      } catch (error) {
      console.error('Error fetching task:', error);
    }
  };

  const fetchTaskComments = async (taskId) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/tasks/${taskId}/comments`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setTaskComments(prevState => ({
        ...prevState,
        [taskId]: response.data,
      }));
    } catch (error) {
      console.error(`Error fetching comments for task ${taskId}:`, error);
    }
  };

  const handlePostComment = async (taskId) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/tasks/${taskId}/comments`,
        { taskId, content: commentContent },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setTaskComments(prevState => ({
        ...prevState,
        [taskId]: [...(prevState[taskId] || []), response.data],
      }));
      setCommentContent('');
      fetchTaskInfo();
    } catch (error) {
      console.error('Error posting comment:', error);
    }
  };

  const handleDeleteComment = async (commentId) => {
    const token = localStorage.getItem('accessToken');
    try {
      await axios.delete(`${process.env.REACT_APP_API_BASE_URL}/tasks/${taskId}/comments/${commentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      //setTaskComments(taskComments.filter(comment => comment.id !== commentId));
      window.location.reload(); // Reload the page
    } catch (error) {
      console.error('Error deleting comment:', error);
      setAlert({ text: 'Error deleting comment', type: AlertTypes.error });
    }
  };

  const handleTaskParticipate = async (taskId) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/groups/${taskId}/task-participate`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      fetchTaskInfo();
    } catch (error) {
      console.error('Error participating:', error);
    }
  };

  const handleTaskCancelParticipation = async (taskId) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/groups/${taskId}/task-cancel-participation`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      fetchTaskInfo();
    } catch (error) {
      console.error('Error canceling participation:', error);
    }
  };

  const handleCancelTask = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.patch(
        `${process.env.REACT_APP_API_BASE_URL}/tasks/${taskId}`,
        { statusId: 3 }, // Set task status to 3 (Canceled)
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      fetchTaskInfo();
    } catch (error) {
      console.error('Error canceling task:', error);
      setAlert({ text: 'Error canceling task', type: AlertTypes.error });
    }
  };

  const handleUncancelTask = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.patch(
        `${process.env.REACT_APP_API_BASE_URL}/tasks/${taskId}`,
        { statusId: 2 }, // Set task status to 2 (Pending)
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      fetchTaskInfo();
    } catch (error) {
      console.error('Error uncanceling task:', error);
      setAlert({ text: 'Error uncanceling task', type: AlertTypes.Error });
    }
  };

  if (loading) {
    return <div>Loading...</div>; // Show loading indicator
  }

  return (
    <div className="container bg-white pt-12">
      <h1 className='text-2xl font-bold mb-4'>Task Details</h1>
      <div className='bg-gray-50 p-4 rounded-xl border border-gray-100'>
        <p className='mb-1 font-bold'>
          <i className="fa-solid fa-seedling mr-2"></i>
          <span>{task.field.name}</span>
        </p>
        <p className='mb-1 font-bold'>{task.type.name}</p>
        <p className='mb-3 text-sm text-gray-500'>{task.description}</p>
        <div className='mb-1 flex text-xs text-gray-400'>
          <p>Task</p>
          <span className='mx-2'>|</span>
          {task.completionDate && (
            <>
              <p>{new Date(task.completionDate).toLocaleString('lt-LT', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
              <span className='mx-2'>|</span>
            </>
          )}
          {task.dueDate && (
            <>
              <p>{new Date(task.dueDate).toLocaleString('lt-LT', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
              <span className='mx-2'>|</span>
            </>
          )}
          {/* <a href={getMapsUrl(task.location)} target="_blank" rel="noopener noreferrer" className='text-[#74cfda]'>
            <i className="fa-solid fa-location-dot"></i> {task.location}
          </a> */}
        </div>
        <div className='mt-4'>
          <div className='my-auto text-sm text-nowrap'>
            Participants:
            {task.participants && task.participants.map(participant => (
              <span key={participant.id} className='mx-2'>{participant.username} </span>
            ))} <i className="fa-solid fa-user-check text-gray-400"></i>
          </div>
          {task.isParticipating ? (
            <button
              className='bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded mt-2'
              onClick={() => handleTaskCancelParticipation(task.id)}
            >
              Cancel Participation
            </button>
          ) : (
            <button
              className='bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded mt-2'
              onClick={() => handleTaskParticipate(task.id)}
            >
              Participate
            </button>
          )}

          {task.statusId === 2 && ( // Show the button only if the task status is 2 (Pending)
              <button
                className='bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded mt-2 ml-4'
                onClick={handleCancelTask}
              >
                Cancel Task
              </button>
            )}
            {task.statusId === 3 && ( // Show the button only if the task status is 3 (Canceled)
              <button
                className='bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-3 rounded mt-2 ml-4'
                onClick={handleUncancelTask}
              >
                Uncancel Task
              </button>
            )}

            <h3 className='my-2 text-sm font-bold'>Comments:</h3>
            {taskComments[task.id] && taskComments[task.id].map(comment => (
                <div key={comment.id} className='border border-gray-200 p-3 mb-2 rounded'>
                <p className='text-gray-600 mb-1'>{comment.content}</p>
                <p className='text-xs text-gray-400'>{new Date(comment.createdAt).toLocaleString('lt-LT', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })} {comment.createdBy && comment.createdBy.username && (<p>Created by: {comment.createdBy.username}</p>)}</p>
                <button
                    className='top-2 right-2 text-red-500 hover:text-red-700'
                    onClick={() => handleDeleteComment(comment.id)}
                >
                    <i className="fa-solid fa-times"></i>
                </button>
                </div>
            ))}
            <div className='mt-4'>
                <textarea
                className='w-full border border-gray-200 rounded p-2 mb-2 text-sm'
                placeholder='Write your comment here...'
                rows={3}
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                />
                <button
                className='bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded'
                onClick={() => handlePostComment(task.id)}
                >
                Post
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Task;