import React, { useState, useEffect } from 'react';
import { Plus, Trash } from 'react-feather';
import settingImage from './settingimage.jpg';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import TaskDescription from './TaskDescription';
import img from './imbuesoft.jpg';

const TaskManager = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [selectedTask, setSelectedTask] = useState('');
  const [learningNotes, setLearningNotes] = useState('');
  const [timeBlocks, setTimeBlocks] = useState([
    { id: 1, time: '8:00:00 to 9:00:00', description: '' },
    { id: 2, time: '9:00:00 to 10:00:00', description: '' },
    { id: 3, time: '10:00:00 to 11:00:00', description: '' },
  ]);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [selectedTaskDescription, setSelectedTaskDescription] = useState({ title: '', description: '', status: 'Pending' });
  const [taskDescriptions, setTaskDescriptions] = useState([]);
  const [loggedInUser, setLoggedInUser] = useState({});
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchTaskDescriptions = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/descriptions');
        setTaskDescriptions(response.data);
      } catch (error) {
        console.error('Error fetching task descriptions:', error);
      }
    };

    if (token) {
      fetchTaskDescriptions();
    }
  }, [token]);

  useEffect(() => {
    const fetchLoggedInUser = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/user-details', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setLoggedInUser(response.data.data);
      } catch (error) {
        console.error('API Error:', error.message);
      }
    };

    if (token) {
      fetchLoggedInUser();
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); 
    setSuccess(false);
  
    if (!startTime || !endTime) {
      alert('Please start and stop the timer before submitting');
      setLoading(false);
      return;
    }
  
    if (!selectedTask) {
      alert('Please select a task from the assigned tasks');
      setLoading(false);
      return;
    }
  
    const taskData = {
      learning: learningNotes,
      startTime: startTime,
      endTime: endTime,
      user: loggedInUser._id, 
      descriptionId: selectedTask,
      timeSlots: timeBlocks.map((block) => ({
        startTime: block.time.split(' to ')[0],
        endTime: block.time.split(' to ')[1],
        notes: block.description,
      })),
      status: selectedTaskDescription.status,
    };
  
    console.log("Sending task data:", taskData);
  
    try {
      const response = await axios.post('http://localhost:8000/api/tasks', taskData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      
      setSuccess(true);
      setLearningNotes('');
      setTimeBlocks([
        { id: 1, time: '8:00:00 to 9:00:00', description: '' },
        { id: 2, time: '9:00:00 to 10:00:00', description: '' },
        { id: 3, time: '10:00:00 to 11:00:00', description: '' },
      ]);
      setTimer(0);
      setStartTime(null);
      setEndTime(null);
      setSelectedTask('');
      
      alert('Task saved successfully!');
    } catch (error) {
      console.error('Error saving task:', error);
      alert('Error saving task: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (taskData) => {
    try {
      const response = await axios.post('http://localhost:8000/api/descriptions', {
        ...taskData,
        user: loggedInUser._id,
      });
      setTaskDescriptions([...taskDescriptions, response.data]);
      setIsPopupOpen(false);
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const updateTimeBlock = (id, description) => {
    setTimeBlocks(
      timeBlocks.map((block) =>
        block.id === id ? { ...block, description } : block
      )
    );
  };

  const removeTimeBlock = (id) => {
    setTimeBlocks(timeBlocks.filter((block) => block.id !== id));
  };

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setTimer(prevTimer => prevTimer + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const handleStart = () => {
    setIsRunning(true);
    setStartTime(new Date().toISOString());
  };

  const handleStop = () => {
    setIsRunning(false);
    setEndTime(new Date().toISOString());
  };

  const formatTime = (time) => {
    const hours = String(Math.floor(time / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((time % 3600) / 60)).padStart(2, '0');
    const seconds = String(time % 60).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  const handleAddBlock = () => {
    let nextStart, nextEnd;

    if (timeBlocks.length === 0) {
      nextStart = new Date('1970-01-01T08:00:00');
      nextEnd = new Date(nextStart);
      nextEnd.setHours(nextEnd.getHours() + 1);
    } else {
      const [, end] = timeBlocks[timeBlocks.length - 1].time.split(' to ');
      nextStart = new Date(`1970-01-01T${end}`);
      nextStart.setSeconds(0);
      nextEnd = new Date(nextStart);
      nextEnd.setHours(nextEnd.getHours() + 1);
    }

    const newBlock = {
      id: timeBlocks.length + 1,
      time: `${nextStart.toTimeString().split(' ')[0]} to ${nextEnd.toTimeString().split(' ')[0]}`,
      description: '',
      startTime: nextStart.toTimeString().split(' ')[0],
      endTime: nextEnd.toTimeString().split(' ')[0]
    };

    setTimeBlocks([...timeBlocks, newBlock]);
  };

  const handleTaskSelect = (taskId) => {
    setSelectedTask(taskId);
    const selectedTaskData = taskDescriptions.find(task => task._id === taskId);
    setSelectedTaskDescription({ 
      title: selectedTaskData?.title || '', 
      description: selectedTaskData?.description || '', 
      status: selectedTaskData?.status || 'Pending' 
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const handlePopupClose = () => {
    setIsPopupOpen(false);
  };

  const assignedTasks = taskDescriptions.filter(task => task.user === loggedInUser._id);
  const filteredTasks = statusFilter 
    ? assignedTasks.filter(task => task.status === statusFilter)
    : assignedTasks;

  const handleStatusChange = (taskId, e) => {
    e.stopPropagation(); 
    const newStatus = e.target.value;
    setTaskDescriptions((prev) =>
      prev.map((task) =>
        task._id === taskId ? { ...task, status: newStatus } : task
      )
    );
    if (selectedTask === taskId) {
      setSelectedTaskDescription((prev) => ({ ...prev, status: newStatus }));
    }
  };

  return (
    <div style={styles.container}>
      <nav style={styles.nav}>
        <img src={img} style={{ height: '50px' }} alt="Logo" />
        <div style={styles.navLinks}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div
              style={{ ...styles.activeLink, cursor: 'pointer' }}
              onClick={() => console.log('Navigate to HOME')}>HOME</div>
            <div
              style={{ ...styles.link, cursor: 'pointer' }}
              onClick={() => console.log('Navigate to ABOUT ME')}>ABOUT ME</div>
            <div
              style={{ ...styles.link, cursor: 'pointer' }}
              onClick={() => console.log('Navigate to PROJECT')}>PROJECT</div>
          </div>
        </div>

        <button style={styles.logoutButton} onClick={handleLogout}>
          Logout
        </button>
      </nav>

      <div style={styles.content}>
        <div style={styles.taskSection}>
          <h2>Welcome, {loggedInUser.name}</h2>
          <div style={styles.learningNotesContainer}>
            <h3 style={styles.sectionTitle}>Learning Notes:</h3>
            <textarea
              placeholder="Type here...."
              value={learningNotes}
              onChange={(e) => setLearningNotes(e.target.value)}
              style={styles.textarea}
            />
          </div>

          <div style={styles.assignedTasksContainer}>
            <h2>Assigned Tasks</h2>
            
            <div style={styles.filterButtons}>
              <button 
                onClick={() => setStatusFilter('')} 
                style={{...styles.filterButton, backgroundColor: !statusFilter ? '#007bff' : '#f0f0f0'}}
              >
                All
              </button>
              <button 
                onClick={() => setStatusFilter('Pending')} 
                style={{...styles.filterButton, backgroundColor: statusFilter === 'Pending' ? '#FF5722' : '#f0f0f0'}}
              >
                Pending
              </button>
              <button 
                onClick={() => setStatusFilter('In Progress')} 
                style={{...styles.filterButton, backgroundColor: statusFilter === 'In Progress' ? '#FFB74D' : '#f0f0f0'}}
              >
                In Progress
              </button>
              <button 
                onClick={() => setStatusFilter('Completed')} 
                style={{...styles.filterButton, backgroundColor: statusFilter === 'Completed' ? '#2E7D32' : '#f0f0f0'}}
              >
                Completed
              </button>
            </div>
            
            <div style={styles.scrollableTaskList}>
              {filteredTasks.length > 0 ? (
                filteredTasks.slice().reverse().map((task) => (
                  <div 
                    key={task._id} 
                    style={{
                      ...styles.descriptionSection,
                      cursor: 'pointer',
                      border: selectedTask === task._id ? '3px solid #007bff' : '1px solid #ccc',
                      backgroundColor: selectedTask === task._id ? '#f8f9fa' : 'white',
                    }}
                    onClick={() => handleTaskSelect(task._id)}
                  >
                    <div style={styles.taskContent}>
                      <div style={styles.taskDetails}>
                        <p style={styles.dateText}>{new Date(task.createdAt).toLocaleDateString()}</p>
                        <h3 style={styles.sectionTitle}><b>Title:</b> {task.title}</h3>
                        <p style={styles.descriptionText}><b>Description:</b> {task.description}</p>
                        <p style={styles.descriptionText}>
                          <b>Status:</b> 
                          <select 
                            value={task.status || 'Pending'} 
                            onChange={(e) => handleStatusChange(task._id, e)}
                            onClick={(e) => e.stopPropagation()}
                            style={{marginLeft: '10px'}}
                          >
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                          </select>
                        </p>
                        {selectedTask === task._id && (
                          <div style={{color: '#007bff', fontWeight: 'bold', marginTop: '10px'}}>
                            ✓ Selected for submission
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{textAlign: 'center', margin: '20px 0'}}>No assigned tasks found</p>
              )}
            </div>
          </div>
        </div>

        <div style={styles.timeSection}>
          <div style={styles.timeControls}>
            <div style={styles.timer}>{formatTime(timer)}</div>
            <div style={styles.timeButtons}>
              <button style={styles.timeButton} onClick={handleStart} disabled={isRunning}>
                TIME START
              </button>
              <button style={styles.timeButton} onClick={handleStop} disabled={!isRunning}>
                TIME END
              </button>
            </div>
          </div>

          {selectedTask ? (
            <div style={{
              padding: '10px',
              backgroundColor: '#e8f4ff',
              borderRadius: '5px',
              marginBottom: '15px',
            }}>
              <h4 style={{margin: '0 0 5px 0'}}>Selected Task:</h4>
              <p style={{margin: '0'}}><b>{selectedTaskDescription.title}</b></p>
            </div>
          ) : (
            <div style={{
              padding: '10px',
              backgroundColor: '#fff4e5',
              borderRadius: '5px',
              marginBottom: '15px',
            }}>
              Please select a task from the Assigned Tasks section
            </div>
          )}

          {success && (
            <div style={{
              padding: '10px',
              backgroundColor: '#d4edda',
              color: '#155724',
              borderRadius: '5px',
              marginBottom: '15px'
            }}>
              Task submitted successfully!
            </div>
          )}

          {loading && (
            <div style={{
              padding: '10px',
              backgroundColor: '#cce5ff',
              color: '#004085',
              borderRadius: '5px',
              marginBottom: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <div className="spinner"></div> Submitting your task...
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {timeBlocks.map((block) => (
              <div key={block.id} style={styles.timeBlock}>
                <div style={styles.timeHeader}>
                  <span style={styles.timeIcon}>⏰</span>
                  <span style={styles.timeText}>{block.time}</span>
                  <button
                    type="button"
                    onClick={() => removeTimeBlock(block.id)}
                    style={styles.removeButton}
                  >
                    <Trash size={16} />
                  </button>
                </div>
                <div style={styles.timeContent}>
                  <textarea
                    placeholder="Type here...."
                    value={block.description}
                    onChange={(e) => updateTimeBlock(block.id, e.target.value)}
                    style={styles.textarea}
                  />
                </div>
              </div>
            ))}

            <div style={styles.submitSection}>
              <button
                type="button"
                style={styles.addButton}
                onClick={handleAddBlock}
              >
                <Plus size={24} />
              </button>
              <button 
                type="submit" 
                style={{
                  ...styles.submitButton,
                  opacity: (!selectedTask || !startTime || !endTime) ? 0.6 : 1
                }}
                disabled={!selectedTask || !startTime || !endTime}
              >
                SUBMIT
              </button>
            </div>
          </form>
        </div>
        {isPopupOpen && (
          <TaskDescription
            isOpen={isPopupOpen}
            onClose={handlePopupClose}
            onSubmit={handleAddTask}
            user={loggedInUser}
          />
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    backgroundImage: `url(${settingImage})`,
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
    fontFamily: 'Arial, sans-serif'
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    padding: '1rem 2rem',
    backgroundColor: 'white',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    justifyContent: 'space-between'
  },
  navLinks: {
    display: 'flex',
    gap: '2rem',
    justifyContent: 'center',
    flex: 1
  },
  logo: {
    width: '36px',
    height: '36px',
    backgroundColor: '#007bff',
    borderRadius: '50%',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    flexShrink: 0
  },
  link: {
    textDecoration: 'none',
    color: '#666',
    fontSize: '14px',
    cursor: 'pointer'
  },
  activeLink: {
    textDecoration: 'none',
    color: '#007bff',
    fontSize: '14px',
    cursor: 'pointer'
  },
  searchButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#666'
  },
  logoutButton: {
    marginLeft: 'auto',
    padding: '0.5rem 1rem',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  content: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
    maxWidth: '1400px',
    margin: '15px auto'
  },
  taskSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  learningNotesContainer: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginBottom: '2rem',
  },
  assignedTasksContainer: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  scrollableTaskList: {
    maxHeight: '500px',
    overflowY: 'auto',
  },
  descriptionSection: {
    backgroundColor: 'white',
    alignItems: 'center',
    padding: '1.5rem',
    borderRadius: '8px',
    marginTop: '2rem',
    width: '90%',
    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
    transition: 'all 0.2s ease'
  },
  sectionTitle: {
    fontSize: '16px',
    marginBottom: '1rem',
    fontWeight: 'normal'
  },
  descriptionText: {
    fontSize: '14px',
    color: '#444',
    lineHeight: '1.5',
  },
  timeSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem'
  },
  timeControls: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  timer: {
    padding: '0.5rem 1rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    backgroundColor: 'white'
  },
  timeButtons: {
    display: 'flex',
    gap: '1rem'
  },
  timeButton: {
    padding: '0.5rem 1rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    backgroundColor: 'white',
    cursor: 'pointer'
  },
  timeBlock: {
    backgroundColor: '#DADADA',
    borderRadius: '8px',
    overflow: 'hidden',
    marginBottom: '1rem'
  },
  timeHeader: {
    padding: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  timeIcon: {
    fontSize: '16px'
  },
  timeText: {
    fontSize: '14px'
  },
  timeContent: {
    backgroundColor: 'white',
    padding: '1rem'
  },
  textarea: {
    width: '95%',
    minHeight: '50px',
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    resize: 'vertical'
  },
  submitSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '2rem'
  },
  addButton: {
    width: '48px',
    height: '48px',
    borderRadius: ' 50%',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
    transition: 'background-color 0.3s ease'
  },
  submitButton: {
    padding: '0.75rem 2rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  removeButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#dc3545',
    marginLeft: 'auto'
  },
  taskContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  taskDetails: {
    flex: 1,
  },
  dateText: {
    marginLeft: '20px',
    textAlign: 'right',
  },
  filterButtons: {
    display: 'flex',
    gap: '10px',
    marginBottom: '15px',
  },
  filterButton: {
    padding: '8px 15px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'background-color 0.2s ease',
  }
};

export default TaskManager;