import '../styles/Home.css';
import { PieChart } from '@mui/x-charts/PieChart';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link, useOutletContext, Navigate } from "react-router-dom";
import { isLoggedIn } from "../classes/Auth";

export default () => {
  const { groupId } = useParams();
  const [points, setPoints] = useState([]);
  const [monthlySteps, setMonthlySteps] = useState([]);
  const [dailySteps, setDailySteps] = useState();
  const [groupInfo, setGroupInfo] = useState('');
  const [tasks, setTasks] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [goals, setGoals] = useState([]);
  const [taskComments, setTaskComments] = useState([]);
  const [commentContent, setCommentContent] = useState('');
  const [challengeParticipants, setChallengeParticipants] = useState({});
  const [totalFieldArea, setTotalFieldArea] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');

    axios.get(`${process.env.REACT_APP_API_BASE_URL}/achievements/points`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
      .then(response => {
        setPoints(response.data);
      })
      .catch(error => {
        console.error('Error fetching points: ', error);
      });
  }, []);


  useEffect(() => {
    const fetchGroupInfo = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/groups/group/${groupId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setGroupInfo(response.data);
      } catch (error) {
        console.error('Error fetching group info:', error);
      }
    };

    const fetchGoals = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/groups/getAllGroupsGoals`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setGoals(response.data.goals);
      } catch (error) {
        console.error('Error fetching goals:', error);
      }
    };

    //fetchGroupInfo();
    fetchTasks();
    //fetchChallenges();
    //fetchGoals();
  }, [groupId]);

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
      const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/tasks`, {
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
      const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/groups/getAllGroupsChallenges`, {
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

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
  
    axios.post(`${process.env.REACT_APP_API_BASE_URL}/rewards/update`, {}, {
    headers: {
      Authorization: `Bearer ${token}`
    }
    })
      .then(response => {

      })
      .catch(error => {
        console.error('Error updating rewards: ', error);
      });
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');

    axios.get(`${process.env.REACT_APP_API_BASE_URL}/activity/monthlySteps`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
      .then(response => {
        setMonthlySteps(response.data);
      })
      .catch(error => {
        console.error('Error fetching steps: ', error);
      });
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');

    axios.get(`${process.env.REACT_APP_API_BASE_URL}/activity/dailysteps`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
      .then(response => {
        setDailySteps(response.data);
      })
      .catch(error => {
        console.error('Error fetching daily steps count: ', error);
      });
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');

    axios.get(`${process.env.REACT_APP_API_BASE_URL}/fields`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
      .then(response => {
        const totalArea = response.data.reduce((sum, field) => sum + field.area, 0);
        setTotalFieldArea(totalArea);
      })
      .catch(error => {
        console.error('Error fetching fields: ', error);
      });
  }, []);

  const getMapsUrl = (loc) => {
    return `https://www.google.com/maps/place/${loc}/`
  }

  const dateDiffToString = (dateWhenString) => {
    let dateWhen = new Date(dateWhenString)
    let dateNow = new Date();
    
    let seconds = Math.floor(((dateNow) - dateWhen)/1000);
    let minutes = Math.floor(seconds/60);
    let hours = Math.floor(minutes/60);
    let days = Math.floor(hours/24);
    
    hours = hours-(days*24);
    minutes = minutes-(days*24*60)-(hours*60);
    seconds = seconds-(days*24*60*60)-(hours*60*60)-(minutes*60);

    if(days) return `${days} days`
    if(hours) return `${hours} hours`
    if(minutes) return `${minutes} minutes`
    return `${seconds} seconds`
  }

  const completedTasksCount = tasks.filter(task => task.status.name === 'Completed').length;
  const totalTasksCount = tasks.length;
  const completedPercentage = totalTasksCount > 0 ? (completedTasksCount / totalTasksCount) * 100 : 0;

  return isLoggedIn() ? (
    <div className='container'>

      <div className='mt-10 flex'>
        <div className='w-full mr-6'>
          <a className='text-[#4edba1] font-bold pb-2 border-b-4 border-[#4edba1]' href="#">All tasks in the farm</a>
          <hr className='mb-3 mt-2' />

          {tasks.length === 0 ? (
              <div className="text-center w-full">
                <p>No tasks.</p>
              </div>
            ) : (
              <div>
                {tasks.map(task => (
                  <div key={task.id} className='flex mb-8 p-4 w-full bg-gray-50 rounded-xl border-[1px] border-gray-100'>
                    <div className="w-24 h-24">
                      <img className="w-full h-full object-cover rounded" src={require("../images/task.png")} alt="Task" />
                    </div>
                    <div className='mx-4 flex-1'>
                    <p className='mb-1 font-bold'>
                      <i className="fa-solid fa-seedling mr-2"></i>
                      <Link to={`/fields/${task.field.id}`} className='text-blue-500 hover:underline'>{task.field.name}</Link>
                    </p>
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
                        {/* <div className='my-auto text-sm text-nowrap'>
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
                        )} */}

                        <Link to={`/tasks/${task.id}`} className='bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded mt-2 '>
                        View Task
                        </Link>
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


          {/* <div>
              {challenges.map(challenge => (
                <div key={challenge.id} className='flex mb-3 p-4 w-full bg-gray-50 rounded-xl border-[1px] border-gray-100'>
                  <img className="my-auto w-24 h-24 object-cover rounded" src="https://media.istockphoto.com/id/1266413326/vector/vector-challenge-sign-pop-art-comic-speech-bubble-with-expression-text-competition-bright.jpg?s=612x612&w=0&k=20&c=eYOQaCn7WvMAEo5ZxVHVVQ-pcNT8HZ-yPeTjueuXi28=" />
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
                  <img className="my-auto w-24 h-24 object-cover rounded" src="https://www.speexx.com/wp-content/uploads/goal-setting-basics.jpg" />
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

          <div className='mb-4 p-4 w-full bg-gray-50 rounded-xl border-[1px] border-gray-100 text-sm text-gray-600'>
            <p className='text-black font-bold'>Tasks</p>
            <p className='mb-3 text-xs text-gray-600'>Percentage of total tasks completed</p>
            <div className='flex my-auto place-items-center'>
              <p className='flex text-center text-gray-500 text-5xl font-bold'>
                {completedPercentage.toFixed(0)} <i className="fa-solid fa-percent"></i>
              </p>
              <PieChart
              slotProps={{ legend: { hidden: true } }}
              series={[
                {
                  data: [
                    { id: 0, value: completedPercentage, color: '#61E9B1', label: 'Completed' },  
                    { id: 1, value: 100 - completedPercentage, color: '#e1e1e1', label: 'Not done' },
                  ],
                  innerRadius: 20,
                  outerRadius: 30,
                  paddingAngle: 0,
                  cornerRadius: 5,
                  startAngle: 0,
                  endAngle: 360,
                  cx: 70,
                }
              ]}
              height={70}
            />
            </div>
          </div>

          {/* <div className='p-4 w-full bg-gray-50 rounded-xl border-[1px] border-gray-100 text-sm text-gray-600'>
            <p className='text-black font-bold'>Steps</p>
            <p className='mb-3 text-xs text-gray-600'>You took this many steps this month:</p>
            <div className='py-4 flex my-auto place-items-center'>
              <p className='flex text-center text-gray-500 text-5xl font-bold'>
                {monthlySteps}
              </p>
            </div>
          </div> */}

          <div className='p-4 w-full bg-gray-50 rounded-xl border-[1px] border-gray-100 text-sm text-gray-600'>
            <p className='text-black font-bold'>Fields</p>
            <p className='mb-3 text-xs text-gray-600'>Total area of all your fields:</p>
            <div className='py-4 flex my-auto place-items-center'>
              <p className='flex text-center text-gray-500 text-5xl font-bold'>
                {totalFieldArea} ha
              </p>
            </div>
          </div>
          
        </div>
      </div>

    </div>
  ) : (
    <Navigate to='/login' />
  );
};
