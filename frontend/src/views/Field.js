import '../styles/Home.css';
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useOutletContext } from "react-router-dom";
import axios from 'axios';
import { getUser } from '../classes/User';
import { AlertTypes } from '../styles/modules/AlertStyles';
import Alert from '../components/Alert';
import { io } from "socket.io-client";
import { MapContainer, TileLayer, useMap, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import ProfileIcon from '../components/ProfileIcon';

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
        const response = await axios.get(`http://localhost:3333/fields/${fieldId}`, {
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
        const response = await axios.get(`http://localhost:3333/fields/${fieldId}/goals`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setGoals(response.data.goals);
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
      const response = await axios.get(`http://localhost:3333/groups/${challengeId}/challenge-participants`);
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
      const response = await axios.get(`http://localhost:3333/fields/${fieldId}/tasks`, {
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

      sortedTasks.forEach((task) => {
        fetchTaskComments(task.id);
      });
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchChallenges = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`http://localhost:3333/groups/${fieldId}/challenges`, {
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
      const response = await axios.get(`http://localhost:3333/tasks/${taskId}/comments`, {
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
        `http://localhost:3333/tasks/${taskId}/comments`,
        { taskId, content: commentContent },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setTaskComments(prevState => ({
        ...prevState,
        [taskId]: [...(prevState[taskId] || []), response.data.comment],
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
        `http://localhost:3333/groups/${taskId}/task-participate`,
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
        `http://localhost:3333/groups/${challengeId}/challenge-participate`,
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
        `http://localhost:3333/groups/${taskId}/task-cancel-participation`,
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
        `http://localhost:3333/groups/${challengeId}/challenge-cancel-participation`,
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
        `http://localhost:3333/groups/${taskId}/user-task-participation`,
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
        `http://localhost:3333/groups/${taskId}/user-challenge-participation`,
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
        'http://localhost:3333/groups/sendInvitation',
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

  if (fieldInfo)
    return (
      <div className='container'>

        <div className='relative mt-10 mb-20 h-32 w-full bg-gradient-to-b from-gray-100 to-gray-200 rounded-xl'>
          <img className='relative mb-20 h-32 w-full bg-gradient-to-b from-gray-100 to-gray-200 rounded-xl object-cover object-center' src={fieldInfo.banner_url} />
          <img className='absolute left-10 -bottom-10 h-24 w-24 rounded-full outline outline-8 outline-white object-cover bg-white border-[1px] border-gray-50' src={fieldInfo.image_url} />
        </div>

        <div className='flex'>
          <div className='w-full mr-6'>
            <a className='text-[#4edba1] font-bold pb-2 border-b-4 border-[#4edba1]' href="#">Task timeline</a>
            <hr className='mb-3 mt-2' />

            <div>
              {tasks.map(task => (
                <div key={task.id} className='flex mb-8 p-4 w-full bg-gray-50 rounded-xl border-[1px] border-gray-100'>
                  <div className="w-24 h-24">
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
                      {/* <h3 className='my-2 text-sm font-bold'>Comments:</h3>
                      {taskComments[task.id] && taskComments[task.id].map(comment => (
                        <div key={comment.id} className='border border-gray-200 p-3 mb-2 rounded'>
                          <p className='text-gray-600 mb-1'>{comment.content}</p>
                          <p className='text-xs text-gray-400'>{new Date(comment.createdAt).toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })} {comment.createdBy && comment.createdBy.username && (<p>Created by: {comment.createdBy.username}</p>)}</p>
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
                      </div> */}
                    </div>
                  </div>
                    <div className='ml-auto'>
                        <div className='text-[#4edba1] hover:text-[#61E9B1] flex items-center'>
                        {task.status === 'Completed' ? (
                            <>
                            <i className='fa-solid fa-circle-check' style={{ color: 'green' }}></i>
                            <span className='ml-2' style={{ color: 'green' }}>{task.status}</span>
                            </>
                        ) : task.status === 'Pending' ? (
                            <>
                            <i className='fa-solid fa-hourglass-half' style={{ color: 'goldenrod' }}></i>
                            <span className='ml-2' style={{ color: 'goldenrod' }}>{task.status}</span>
                            </>
                        ) : task.status === 'Canceled' ? (
                            <>
                            <i className='fa-solid fa-ban' style={{ color: 'red' }}></i>
                            <span className='ml-2' style={{ color: 'red' }}>{task.status}</span>
                            </>
                        ) : null}
                        </div>
                    </div>
                </div>
              ))}
            </div>

            {/* <div>
              {challenges.map(challenge => (
                <div key={challenge.id} className='flex mb-3 p-4 w-full bg-gray-50 rounded-xl border-[1px] border-gray-100'>
                  <img className="my-auto w-24 h-24 object-cover rounded" src={require("../images/challenge.jpg")} />
                  <div className='mx-4 flex-1'>
                    <div className='mb-1 flex text-xs text-gray-400'>
                      <p>Challenge</p>
                      <span className='mx-2'>|</span>
                      <p>Starts {new Date(challenge.start_date).toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                      <span className='mx-2'>|</span>
                      <p>Ends {new Date(challenge.end_date).toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                    </div>
                    <p className='mb-1 font-bold'>{challenge.title}</p>
                    <p className='mb-3 text-sm text-gray-500'>{challenge.description}</p>
                    <div className='flex ml-auto'>
                      <div className='my-auto text-sm text-nowrap'>
                        Participants:
                        {challengeParticipants[challenge.id] && challengeParticipants[challenge.id].map(participant => (
                          <span key={participant.id} className='mx-2'>{participant.user.username}</span>
                        ))} <i className="fa-solid fa-user-check text-gray-400"></i>
                      </div>
                    </div>
                    {challenge.isParticipating ? (
                      <button
                        className='bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded mt-2'
                        onClick={() => handleChallengeCancelParticipation(challenge.id)}
                      >
                        Cancel Participation
                      </button>
                    ) : (
                      <button
                        className='bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded mt-2'
                        onClick={() => handleChallengeParticipate(challenge.id)}
                      >
                        Participate
                      </button>
                    )}
                    <div className='mt-4 flex text-sm text-gray-400'>
                      <p className='mr-auto'>15</p>
                      <p className='text-xs'>15%</p>
                      <p className='ml-auto'>100</p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mb-4 dark:bg-gray-700">
                      <div className="bg-[#388E3C] h-1.5 rounded-full" style={{ width: "15%" }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div> */}

            {/* <div>
              {goals.map(goal => (
                <div key={goal.id} className='flex mb-3 p-4 w-full bg-gray-50 rounded-xl border-[1px] border-gray-100'>
                  <img className="my-auto w-24 h-24 object-cover rounded" src={require("../images/goal.jpg")} />
                  <div className='mx-4'>

                    <div className='mb-1 flex text-xs text-gray-400'>
                      <p>Goal</p>
                      <span className='mx-2'>|</span>
                      <p>Starts {new Date(goal.start_date).toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                      <span className='mx-2'>|</span>
                      <p>Ends {new Date(goal.end_date).toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                    </div>

                    <p className='mb-1 font-bold'>{goal.title}</p>

                    <p className='mb-3 text-sm text-gray-500'>{goal.description}</p>


                    <div className='flex text-sm text-gray-400'>
                      <p className='mr-auto'>15</p>
                      <p className='text-xs'>15%</p>
                      <p className='ml-auto'>100</p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mb-4 dark:bg-gray-700">
                      <div className="bg-[#388E3C] h-1.5 rounded-full" style={{ width: "15%" }}></div>
                    </div>

                    <div className='flex text-xs text-gray-400'>
                      <p>STATUS: {goal.status.name}</p>
                      <p className='ml-6'>CATEGORY: {goal.category.name}</p>
                    </div>

                  </div>

                  <div className='ml-auto'>
                    <div className='text-gray-400 hover:text-gray-300 cursor-pointer'>
                      <i className="fa-solid fa-circle-check"></i>
                    </div>
                  </div>
                </div>
              ))}
            </div> */}
          </div>
          <div className='w-96 text-sm text-gray-600'>
            {/* {fieldInfo.mentorId == getUser().id ?
              <div className='mb-6 outline outline-2 outline-offset-8 outline-[#88e0ea] rounded-xl'>
                <p className='mb-4 text-black font-bold'>Field management</p>
                <Link to={`/create-challenge/${fieldId}`} className='mb-2 p-4 bg-[#388E3C] hover:bg-[#4edba1] rounded-xl block'>
                  <i className="fa-solid fa-person-walking mr-2"></i> Create challenge
                </Link>

                <Link to={`/create-goal/${fieldId}`} className='mb-2 p-4 bg-[#388E3C] hover:bg-[#4edba1] rounded-xl block'>
                  <i className="fa-solid fa-flag-checkered mr-2"></i> Create goal
                </Link>

                <Link to={`/create-task/${fieldId}`} className='mb-2 p-4 bg-[#388E3C] hover:bg-[#4edba1] rounded-xl block'>
                  <i className="fa-regular fa-calendar-plus mr-2"></i> Create task
                </Link>

                <Link to={`/edit-field/${fieldId}`} className='mb-6 p-4 bg-[#388E3C] hover:bg-[#4edba1] rounded-xl block'>
                  <i className="fa-solid fa-pen-to-square mr-2"></i> Edit field
                </Link>

                <p className='mb-4 text-black font-bold'>Invite member</p>
                <form onSubmit={handleInvite} className='flex'>
                  <input
                    className='p-4 border-2 border-gary-50 rounded-xl'
                    placeholder="Enter member email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <button
                    type="submit"
                    className='ml-2 p-4 bg-[#388E3C] hover:bg-[#4edba1] rounded-xl'
                  >
                    Invite
                  </button>
                </form>
              </div>
              : null}

            <p className='mb-4 text-black font-bold'>Description</p>
            <p>{fieldInfo.description}</p>
            <hr className='my-6' />
            <div className='grid grid-cols-2'>
              <p className='text-right mb-1 mr-5'>Visibility:</p>
              <p>{fieldInfo.visibilityId === 1 ? 'Public' : 'Private'}</p>
            </div>
            <hr className='my-6' />
            <div className='grid grid-cols-3 gap-4 justify-items-center text-center'>
              <div>
                <p>{fieldInfo.fieldMembers.length}</p>
                <i className="fa-solid fa-users"></i>
                <p className='text-xs'>Members</p>
              </div>
              <div>
                <i className="fa-solid fa-trophy"></i>
                <p className='text-xs'>Achievements</p>
              </div>
              <div>
                <p>{tasks.length}</p>
                <i className="fa-solid fa-calendar-days"></i>
                <p className='text-xs'>Tasks</p>
              </div>
            </div>
            <hr className='my-6' />
            <p className='mb-4 text-black font-bold'>Mentor</p>
            <div className='text-center inline-block'>
              <ProfileIcon username={fieldInfo.mentor.username} imageUrl={fieldInfo.mentor.profile_picture} userId={fieldInfo.mentorId} />
              <p className='text-xs'>{fieldInfo.mentor.username}</p>
            </div>
            <hr className='my-6' />
            <p className='mb-4 text-black font-bold'>Field Members</p>
            {fieldInfo.fieldMembers.length === 0 ? (
              <p>No members.</p>
            ) : (
              <div className='grid grid-cols-3 gap-4'>
                {fieldInfo.fieldMembers.map((member) => (
                  <div key={member.user.id} className='text-center'>
                    <img className='mx-auto w-10 h-10 rounded-full' src={member.user.profile_picture} alt={member.user.username} />
                    <p className='text-xs'>{member.user.username}</p>
                  </div>
                ))}
              </div>
            )} */}

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

          </div>
        </div>
      </div>
    );
};

export default InviteForm;