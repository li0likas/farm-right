import '../styles/Home.css';
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useOutletContext, useNavigate } from "react-router-dom";
import axios from 'axios';
import { getUser } from '../classes/User';
import { AlertTypes } from '../styles/modules/AlertStyles';
import Alert from '../components/Alert';
import { io } from "socket.io-client";
import { MapContainer, TileLayer, useMap, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import ProfileIcon from '../components/ProfileIcon';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


const getMapsUrl = (loc) => {
  return `https://www.google.com/maps/place/${loc}/`
};

const InviteForm = () => {
  const { setAlert } = useOutletContext();
  const { fieldId } = useParams();
  const [email, setEmail] = useState('');
  const [fieldInfo, setFieldInfo] = useState('');
  const [tasks, setTasks] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [goals, setGoals] = useState([]);
  const [taskComments, setTaskComments] = useState([]);
  const [commentContent, setCommentContent] = useState('');
  const [challengeParticipants, setChallengeParticipants] = useState({});
  const navigate = useNavigate();

  const [userLocations, setUserLocations] = useState([]);

  useEffect(() => {
    // Darant mapa, detalesne user info parodymui galima gaut is groupInfo.groupMembers
    // Also yra endpointas su lastSeen informacija - users/:userId/last-seen
    const accessToken = localStorage.getItem('accessToken');
    const socket = io('http://192.168.1.101:3333', {
      transportOptions: {
        polling: {
          extraHeaders: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      }
    });

    socket.on("connect", () => {
      //console.log(socket.id);
    });

    socket.onAny((task, ...args) => {
      //console.log(`got ${task}`);
    });

    socket.on('userLocation', (data) => {
      if (data.field == fieldId) {
        console.log("Received userLocation:", data.field, fieldId);

        setUserLocations((prevState) => ({
          ...prevState,
          [data.userId]: {
            latitude: data.location.latitude,
            longitude: data.location.longitude,
          },
        }));

      }
    });

    socket.on('leave', (data) => {
      setUserLocations((prevState) => {
        const updatedLocations = { ...prevState };
        delete updatedLocations[data.userId];
        return updatedLocations;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [fieldId]);

  useEffect(() => {
    const fetchFieldInfo = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/fields/${fieldId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setFieldInfo(response.data);
      } catch (error) {
        console.error('Error fetching field info:', error);
      }
    };

    const fetchGoals = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/fields/${fieldId}/goals`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setGoals(response.data);
      } catch (error) {
        console.error('Error fetching goals:', error);
      }
    };

    fetchFieldInfo();
    fetchTasks();
    //fetchChallenges();
    //fetchGoals();
  }, [fieldId]);

  const handleShowChallengeParticipants = async (challengeId) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/groups/${challengeId}/challenge-participants`);
      setChallengeParticipants((prevState) => ({
        ...prevState,
        [challengeId]: response.data,
      }));
    } catch (error) {
      console.error(error);
    }
  };

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/fields/${fieldId}/tasks`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

    //   const tasksWithParticipation = await Promise.all(
    //     response.data.tasks.map(async (task) => {
    //       const isParticipating = await userIsParticipatingInTask(task.id);
    //       return { ...task, isParticipating };
    //     })
    //   );

    const sortedTasks = response.data.sort((a, b) => {
        const dateA = a.dueDate || a.completionDate;
        const dateB = b.dueDate || b.completionDate;
        return new Date(dateB) - new Date(dateA);
      });

      setTasks(sortedTasks);

      // sortedTasks.forEach((task) => {
      //   fetchTaskComments(task.id);
      // });
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchChallenges = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/groups/${fieldId}/challenges`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const challengesWithParticipation = await Promise.all(
        response.data.challenges.map(async (chal) => {
          handleShowChallengeParticipants(chal.id);
          const isParticipating = await userIsParticipatingInChallenge(chal.id);
          return { ...chal, isParticipating };
        })
      );

      setChallenges(challengesWithParticipation);
      //setChallenges(response.data.challenges);
    } catch (error) {
      console.error('Error fetching challenges:', error);
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
      fetchTasks();
    } catch (error) {
      console.error('Error posting comment:', error);
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
      fetchTasks();
    } catch (error) {
      console.error('Error participating:', error);
    }
  };

  const handleChallengeParticipate = async (challengeId) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/groups/${challengeId}/challenge-participate`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      fetchChallenges();
      handleShowChallengeParticipants(challengeId);
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
      fetchTasks();
    } catch (error) {
      console.error('Error canceling participation:', error);
    }
  };

  const handleChallengeCancelParticipation = async (challengeId) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/groups/${challengeId}/challenge-cancel-participation`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      fetchChallenges();
      handleShowChallengeParticipants(challengeId);
    } catch (error) {
      console.error('Error canceling participation:', error);
    }
  };

  const userIsParticipatingInTask = async (taskId) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/groups/${taskId}/user-task-participation`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data.isParticipating;
    } catch (error) {
      console.error('Error checking participation:', error);
      return false;
    }
  };

  const userIsParticipatingInChallenge = async (taskId) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/groups/${taskId}/user-challenge-participation`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data.isParticipating;
    } catch (error) {
      console.error('Error checking participation:', error);
      return false;
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!fieldId) {
      console.error('Field ID is not available.');
      return;
    }
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        console.error('User is not logged in.');
        return;
      }

      const response = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/groups/sendInvitation`,
        {
          groupId: parseInt(fieldId),
          userEmail: email,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      console.log(response.data);
      setEmail('');
      setAlert({ text: 'Invitation sent successfully!', type: AlertTypes.success });
    } catch (error) {
      console.error('Failed to send invitation:', error);
      if (error.response && error.response.data) {
        setAlert({ text: error.response.data.message, type: AlertTypes.error });
      } else {
        setAlert({ text: 'Failed to send invitation', type: AlertTypes.error });
      }
    }
  };

  const [map, setMap] = useState(null)
  const [position, setPosition] = useState(() => null)

  const onMove = useCallback(() => {
    setPosition(map.getCenter())
  }, [map])

  useEffect(() => {
    if (!map) return
    map.on('move', onMove)
    return () => {
      map.off('move', onMove)
    }
  }, [map, onMove])

  const ResizeMap = () => {
    const map = useMap();
    map._onResize();
    return null;
  };

  const handleDeleteField = async () => {
    const confirmDelete = window.confirm('Are you sure you want to delete this field?');
    if (!confirmDelete) return;
  
    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${process.env.REACT_APP_API_BASE_URL}/fields/${fieldId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      navigate('/fields', { state: { showToast: true, toastMessage: 'Field deleted successfully' } });
    } catch (error) {
      console.error('Error deleting field:', error);
      toast.error('Error deleting field');
    }
  };

  if (fieldInfo)
    return (
      <div className='container'>
        <ToastContainer />

        <div className='relative mt-10 mb-20 h-32 w-full bg-gradient-to-b from-gray-100 to-gray-200 rounded-xl'>
          <img className='relative mb-20 h-32 w-full bg-gradient-to-b from-gray-100 to-gray-200 rounded-xl object-cover object-center' src={fieldInfo.banner_url} />
          <img className='absolute left-10 -bottom-10 h-24 w-24 rounded-full outline outline-8 outline-white object-cover bg-white border-[1px] border-gray-50' src={fieldInfo.image_url} />
        </div>

        <div className='flex flex-col md:flex-row'>
          <div className='w-full md:w-2/3 mr-0 md:mr-6'>
            <a className='text-[#4edba1] font-bold pb-2 border-b-4 border-[#4edba1]' href="#">Task timeline</a>
            <hr className='mb-3 mt-2' />

            <div className="text-right mb-4">
              <Link to={`/create-task/${fieldId}`} className='bg-[#388E3C] hover:bg-[#4edba1] text-white font-bold py-2 px-4 rounded'>
                Create Task
              </Link>
            </div>

            {tasks.length === 0 ? (
              <div className="text-center w-full">
                <p>No tasks.</p>
              </div>
            ) : (
              <div>
                {tasks.map(task => (
                  <div key={task.id} className='flex flex-col md:flex-row mb-8 p-4 w-full bg-gray-50 rounded-xl border-[1px] border-gray-100'>
                    <div className="w-full md:w-24 h-24">
                      <img className="w-full h-full object-cover rounded" src={require("../images/task.png")} alt="Task" />
                    </div>
                    <div className='mx-4 flex-1'>
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
                        <a href={getMapsUrl(task.location)} target="_blank" rel="noopener noreferrer" className='text-[#74cfda]'>
                          <i className="fa-solid fa-location-dot"></i> {task.location}
                        </a>
                      </div>
                      <p className='mb-1 font-bold'>{task.type.name}</p>
                      <p className='mb-3 text-sm text-gray-500'>{task.description}</p>
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

                        <Link to={`/tasks/${task.id}`} className='bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded mt-2 ml-4'>
                          View Task
                        </Link>
                      </div>
                    </div>
                    <div className='ml-auto'>
                      <div className='text-[#4edba1] hover:text-[#61E9B1] flex items-center'>
                        {task.status.name === 'Completed' ? (
                          <>
                            <i className='fa-solid fa-circle-check' style={{ color: 'green' }}></i>
                            <span className='ml-2' style={{ color: 'green' }}>{task.status.name}</span>
                          </>
                        ) : task.status.name === 'Pending' ? (
                          <>
                            <i className='fa-solid fa-hourglass-half' style={{ color: 'goldenrod' }}></i>
                            <span className='ml-2' style={{ color: 'goldenrod' }}>{task.status.name}</span>
                          </>
                        ) : task.status.name === 'Canceled' ? (
                          <>
                            <i className='fa-solid fa-ban' style={{ color: 'red' }}></i>
                            <span className='ml-2' style={{ color: 'red' }}>{task.status.name}</span>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className='w-full md:w-1/3 text-sm text-gray-600'>
            <div className='relative mt-10 mb-20'>
              <h2 className='mb-4 text-black font-bold'>Field Location</h2>
              <div className=''>

                {/* position ?
                  <>latitude: {position.lat.toFixed(4)}, longitude: {position.lng.toFixed(4)}{' '}</>
                  : null
                */}

                <MapContainer
                  className="markercluster-map w-full h-60 z-0 rounded-xl border-[1px] border-gray-100 overflow-auto"
                  center={[55.1663, 23.8513]}
                  zoom={6}
                  
                  ref={setMap}
                  zoomControl={false}
                  //dragging={false}
                >
                  <ResizeMap />
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                  />

                  {Object.entries(userLocations).map(([userId, location]) => (
                    <Marker className='cursor-none' position={[location.latitude, location.longitude]} icon={new L.Icon({
                      iconUrl: require('../images/mapIcon.png'),
                      iconSize: [22, 22],
                    })}>
                      <Popup>
                        <p>User ID: {userId}</p>
                      </Popup>
                    </Marker>
                  ))}

                </MapContainer>

                {/* 
                {Object.entries(userLocations).map(([userId, location]) => (
                  <div key={userId} className='p-4 bg-gray-100 rounded-lg'>
                    <p>User ID: {userId}</p>
                    <p>
                      Location: {location.latitude}, {location.longitude}
                    </p>
                  </div>
                ))}
                */}
              </div>
            </div>
              <button onClick={handleDeleteField} className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded mt-2">
                Delete Field
              </button>
          </div>
        </div>
      </div>
    );
};

export default InviteForm;
