import React, { useState, useEffect } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import axios from 'axios';
import { format, isSunday, eachDayOfInterval, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import TaskDescription from './TaskDescription.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const TaskDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({ present: 0, absent: 0 });
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [taskDescriptions, setTaskDescriptions] = useState([]);
  const [user, setUser] = useState({});
  const [statusFilter, setStatusFilter] = useState('');
  const [showTaskDescriptions, setShowTaskDescriptions] = useState(false); 

  useEffect(() => {
    let userFilteredTasks = tasks;

    if (selectedUser) {
      userFilteredTasks = userFilteredTasks.filter(task => task.user === selectedUser);
    }

    if (statusFilter) {
      userFilteredTasks = userFilteredTasks.filter(task => task.status === statusFilter);
    }

    setFilteredTasks(userFilteredTasks);
  }, [selectedUser, tasks, statusFilter]);

  const fetchTasks = () => {
    axios.get('http://localhost:8000/api/tasks')
      .then((response) => {
        setTasks(response.data);
        setFilteredTasks(response.data);
      })
      .catch((err) => console.log(err));
  };

  const handleAddTask = (taskData) => {
    if (!selectedUser) {
      console.error('User  ID is not defined');
      return;
    }

    axios.post('http://localhost:8000/api/descriptions', { ...taskData, user: selectedUser })
      .then((response) => {
        setIsPopupOpen(false);
        setTaskDescriptions([...taskDescriptions, response.data]);
        fetchTasks(); 
      })
      .catch((err) => console.log(err));
  };

  useEffect(() => {
    fetchTasks();

    axios.get('http://localhost:8000/api/getAllUsers')
      .then((response) => {
        setUsers(response.data.data);
        setUser(response.data.data[0]);
      })
      .catch((err) => console.log(err));

    axios.get('http://localhost:8000/api/descriptions')
      .then((response) => {
        setTaskDescriptions(response.data);
        console.log(response.data);
      })
      .catch((err) => console.log(err));
  }, []);

  useEffect(() => {
    updateAttendanceStats();
  }, [selectedUser, tasks, currentMonth]);

  const pieChartData = {
    labels: ['Present', 'Absent'],
    datasets: [{
      data: [attendanceStats.present, attendanceStats.absent],
      backgroundColor: ['#2E7D32', '#98FB98'],
      borderWidth: 0,
    }],
  };

  const pieChartOptions = {
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  const holidays = [
    '2025-01-14',
    '2025-01-26',
    '2025-02-26',
    '2025-03-14',
    '2025-03-31',
    '2025-04-10',
    '2025-04-14',
    '2025-04-18',
    '2025-04-29',
    '2025-06-07',
    '2025-08-15',
    '2025-08-16',
    '2025-08-27',
    '2025-10-02',
    '2025-10-21',
    '2025-10-22',
    '2025-10-27',
    '2025-11-19',
    '2025-12-25',
  ];

  const isHoliday = (date) => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    const holiday = holidays.find(h => h === formattedDate);

    if (holiday) {
      const holidayNames = {
        '2025-01-14': 'Makar Sankranti',
        '2025-01-26': 'Republic Day',
        '2025-02-26': 'Maha Shivaratri',
        '2025-03-14': 'Holi',
        '2025-03-31': 'Ramjan-Eid (Eid-Ul-Fitra)',
        '2025-04-10': 'Mahavir Janma Kalyanak',
        '2025-04-14': 'Dr. B.R. Ambedkar Jayanti',
        '2025-04-18': 'Good Friday',
        '2025-04-29': 'Bhagvan Shree Parshuram Jayanti',
        '2025-06-07': 'Eid-Ul-Adha (Bakri-Eid)',
        '2025-08-15': 'Independence Day',
        '2025-08-16': 'Janmashtami',
        '2025-08-27': 'Ganesh Chaturthi',
        '2025-10-02': 'Gandhi Jayanti',
        '2025-10-21': 'Diwali',
        '2025-10-22': 'Govardhan Puja',
        '2025-10-27': 'Chhat Puja',
        '2025-11-19': 'Guru Nanak Jayanti',
        '2025-12-25': 'Christmas Day'
      };

      return holidayNames[holiday];
    }
    return null;
  };

  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return 'N/A';
    const pad = (s) => s.length === 2 ? s : s.padStart(2, '0');
    const [sh, sm] = startTime.split(':');
    const [eh, em] = endTime.split(':');
    const start = new Date(1970, 0, 1, Number(pad(sh)), Number(pad(sm)), 0);
    const end = new Date(1970, 0, 1, Number(pad(eh)), Number(pad(em)), 0);
    let diff = (end - start) / (1000 * 60); 
    if (diff < 0) return 'N/A';
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    return `${hours} Hour${hours !== 1 ? 's' : ''} ${minutes} Minute${minutes !== 1 ? 's' : ''}`;
  };

  const getAttendanceSummary = () => {
    const monthAttendance = getMonthAttendance();
    let totalPresent = 0;
    let totalMinutes = 0;
    monthAttendance.forEach(record => {
      if (record.status === 'Present') {
        totalPresent++;
        if (record.startTime && record.endTime) {
          const pad = (s) => s.length === 2 ? s : s.padStart(2, '0');
          const [sh, sm] = record.startTime.split(':');
          const [eh, em] = record.endTime.split(':');
          const start = new Date(1970, 0, 1, Number(pad(sh)), Number(pad(sm)), 0);
          const end = new Date(1970, 0, 1, Number(pad(eh)), Number(pad(em)), 0);
          let diff = (end - start) / (1000 * 60); 
          if (diff > 0) totalMinutes += diff;
        }
      }
    });
    const totalHours = Math.floor(totalMinutes / 60);
    const totalRemMinutes = totalMinutes % 60;
    return { totalPresent, totalHours, totalRemMinutes };
  };

  const downloadPDF = () => {
    if (!selectedUser) {
      alert('Please select a user to generate the report.');
      return;
    }

    const doc = new jsPDF();
    const userName = getUserById(selectedUser);
    const reportTitle = `Attendance Report for ${userName} (${format(currentMonth, 'MMMM yyyy')})`;

    doc.setFontSize(18);
    doc.text(reportTitle, 14, 20);

    const summaryYPosition = 30;
    doc.setFontSize(12);
    doc.text("Summary:", 14, summaryYPosition);

    const { totalPresent, totalHours, totalRemMinutes } = getAttendanceSummary();
    doc.text(`- Present: ${attendanceStats.present}`, 14, summaryYPosition + 10);
    doc.text(`- Absent: ${attendanceStats.absent}`, 14, summaryYPosition + 20);
    doc.text(`- Total Present Days: ${totalPresent}`, 14, summaryYPosition + 30);
    doc.text(`- Total Working Hours: ${totalHours} Hours ${totalRemMinutes} Minutes`, 14, summaryYPosition + 40);

    let yPosition = doc.autoTable({
      startY: summaryYPosition + 50,
      styles: { cellPadding: 3, fontSize: 10 },
      headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
      bodyStyles: { lineColor: [200, 200, 200], lineWidth: 0.1 },
      tableWidth: 'wrap',
      margin: { horizontal: 10 },
    }).finalY || summaryYPosition + 60;

    const tableDataWithTime = getMonthAttendance().map((record) => {
      let duration = 'N/A';
      if (record.status === 'Present' && record.startTime && record.endTime) {
        duration = calculateDuration(record.startTime, record.endTime);
      }
      return [
        format(record.date, 'dd-MM-yyyy'),
        record.status,
        record.status === 'Present' ? record.startTime || 'N/A' : 'N/A',
        record.status === 'Present' ? record.endTime || 'N/A' : 'N/A',
        duration
      ];
    });

    doc.autoTable({
      startY: yPosition + 10,
      head: [['Date', 'Status', 'Start Time', 'End Time', 'Duration']],
      body: tableDataWithTime,
      styles: { cellPadding: 3, fontSize: 10 },
      headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
      bodyStyles: { lineColor: [200, 200, 200], lineWidth: 0.1 },
    });

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.text(`Page ${i} of ${pageCount}`, 200, 290, { align: 'right' });
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 290);
    }

    doc.save(`Attendance_Report_${userName}.pdf`);
  };

  const getUserById = (_id) => {
    const user = users.find(user => user._id === _id);
    return user ? user.name : 'User  NA';
  };

  const updateAttendanceStats = () => {
    const monthAttendance = getMonthAttendance();
    const present = monthAttendance.filter(record => record.status === 'Present' || record.status === 'Sunday' || record.status === 'Holiday').length;
    const absent = monthAttendance.filter(record => record.status === 'Absent').length;
    setAttendanceStats({ present, absent });
  };

  const getMonthAttendance = () => {
    const firstDayOfMonth = startOfMonth(currentMonth);
    const lastDayOfMonth = endOfMonth(currentMonth);

    const daysInMonth = eachDayOfInterval({
      start: firstDayOfMonth,
      end: lastDayOfMonth,
    });

    return daysInMonth.map(date => {
      const holidayName = isHoliday(date);

      if (holidayName) {
        return { date, status: `${holidayName}`, startTime: null, endTime: null };
      } else if (isSunday(date)) {
        return { date, status: 'Sunday', startTime: null, endTime: null };
      } else {
        const taskForDay = tasks.find(task =>
          format(new Date(task.createdAt), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd') && task.user === selectedUser
        );
        return {
          date,
          status: taskForDay ? 'Present' : 'Absent',
          startTime: taskForDay ? format(new Date(taskForDay.startTime), 'HH:mm:ss') : null,
          endTime: taskForDay ? format(new Date(taskForDay.endTime), 'HH:mm:ss') : null,
        };
      }
    });
  };

  const previousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  return (
    <div style={styles.container}>
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <form>
          <div className="search-bar">
            <input type="text" placeholder="Search By Task Name..." />
            <button type="submit" className="submit-button">SUBMIT</button>
          </div>
        </form>

        <div>
          {/* Status Filter Buttons */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <button
              onClick={() => setStatusFilter('Pending')}
              style={{ backgroundColor: '#FF5722', color: 'white', padding: '10px 15px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
            >
              Pending
            </button>
            <button
              onClick={() => setStatusFilter('In Progress')}
              style={{ backgroundColor: '#FFB74D', color: 'black', padding: '10px 15px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
            >
              In Progress
            </button>
            <button
              onClick={() => setStatusFilter('Completed')}
              style={{ backgroundColor: '#2E7D32', color: 'white', padding: '10px 15px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
            >
              Completed
            </button>
            <button
              onClick={() => setStatusFilter('')}
              style={{ backgroundColor: 'gray', color: 'black', padding: '10px 15px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
            >
              Show All
            </button>
          </div>

          {/* User Selection and Task Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <select
              id="user-select"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              style={styles.dropdown}
            >
              <option value="">--Select a User--</option>
              {users.map(user => (
                <option key={user._id} value={user._id}>{user.name}</option>
              ))}
            </select>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={() => setIsPopupOpen(true)}
                style={{
                  backgroundColor: 'green',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  padding: '10px 15px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  transition: 'background-color 0.3s ease',
                }}
                onMouseEnter={(e) => (e.target.style.backgroundColor = 'darkgreen')}
                onMouseLeave={(e) => (e.target.style.backgroundColor = 'green')}
              >
                {isPopupOpen ? 'Add Task' : '+'}
              </button>
            </div>

            <TaskDescription
              isOpen={isPopupOpen}
              onClose={() => setIsPopupOpen(false)}
              onSubmit={handleAddTask}
              user={user}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '20px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ border: '1px solid #ccc', borderRadius: '5px', backgroundColor: 'white' }}>
              <div className="card-container">
                {filteredTasks.length > 0 ? (
                  filteredTasks.map((task, index) => {
                    return (
                      <div className="card" key={index}>
                        <h4 style={{ fontSize: '20px' }}>{format(new Date(task.createdAt), 'dd-MM-yyyy')}</h4>
                        <hr />
                        <h3><strong>Title :</strong>{task.descriptions ? task.descriptions.title : 'No Title'}</h3>
                        <p><strong>Description :</strong>{task.descriptions ? task.descriptions.description : 'No Description'}</p> 
                        <p><strong>Assigned User:</strong> {getUserById(task.user)}</p>
                        <p><strong>Learning:</strong> {task.learning}</p>
                        <p><strong>Duration:</strong> {format(new Date(task.startTime), 'HH:mm:ss')} - {format(new Date(task.endTime), 'HH:mm:ss')}</p>
                        <div>
                          <strong>Time Slots:</strong>
                          <ul>
                            {task.timeSlots.map((slot, index) => (
                              <li key={index}>
                                {slot.startTime} - {slot.endTime} <br /><strong>Work:</strong> {slot.notes}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p>
                            <strong>Status: </strong>
                            <span style={{
                              backgroundColor:
                                task.status === 'Pending' ? '#FF5722' :
                                  task.status === 'In Progress' ? '#FFEB3B' :
                                    task.status === 'Completed' ? '#2E7D32' : '#FFB74D',
                              color: 'white',
                              padding: '3px 8px',
                              borderRadius: '3px',
                              fontSize: '0.9em'
                            }}>
                              {task.status}
                            </span>
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p>No tasks found matching your search.</p>
                )}
              </div>
            </div>
          </div>

          {selectedUser && (
            <div style={{ flex: 0.5 }}>
              <div style={{ border: '1px solid #ccc', borderRadius: '5px', padding: '15px', backgroundColor: 'white' }}>
                <div style={{ marginBottom: '20px', maxWidth: '400px' }}>
                  <center><Pie data={pieChartData} options={pieChartOptions} /></center>
                </div>
              </div>

              <div style={{ border: '1px solid #ccc', borderRadius: '5px', padding: '15px', marginTop: '10px', backgroundColor: 'white' }}>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <h3>{selectedUser ? `Attendance for ${getUserById(selectedUser)}` : 'My Attendance'}</h3>
                  <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <button
                      onClick={downloadPDF}
                      style={{
                        ...styles.button,
                        backgroundColor: selectedUser ? '#28a745' : '#ccc',
                        cursor: selectedUser ? 'pointer' : 'not-allowed',
                      }}
                      disabled={!selectedUser}
                    >
                      Download Attendance Report
                    </button>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                    <button onClick={previousMonth} style={styles.button}>Previous</button>
                    <span>{format(currentMonth, 'MMMM yyyy')}</span>
                    <button onClick={nextMonth} style={styles.button}>Next</button>
                  </div>
                </div>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {selectedUser ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr>
                          <th style={{ padding: '10px', border: '1px solid #ccc' }}>Date</th>
                          <th style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'center' }}>Status</th>
                          <th style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'center' }}>Start Time</th>
                          <th style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'center' }}>End Time</th>
                          <th style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'center' }}>Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getMonthAttendance().map((record, index) => (
                          <tr key={index}>
                            <td style={{ padding: '10px', border: '1px solid #ccc' }}>{format(record.date, 'dd-MM-yyyy')}</td>
                            <td style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'center' }}>
                              <span style={{
                                backgroundColor:
                                  record.status === 'Present' ? '#2E7D32' :
                                    record.status === 'Absent' ? '#FF5722' :
                                      record.status === 'Holiday' ? '#40C4FF' :
                                        '#FFB74D',
                                color: 'white',
                                padding: '3px 8px',
                                borderRadius: '3px'
                              }}>
                                {record.status}
                              </span>
                            </td>
                            <td style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'center' }}>
                              {record.status === 'Present' ? record.startTime || 'N/A' : 'N/A'}
                            </td>
                            <td style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'center' }}>
                              {record.status === 'Present' ? record.endTime || 'N/A' : 'N/A'}
                            </td>
                            <td style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'center' }}>
                              {record.status === 'Present' && record.startTime && record.endTime
                                ? calculateDuration(record.startTime, record.endTime)
                                : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p style={{ textAlign: 'center' }}>Please select a user to view their attendance.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* New Section for Task Descriptions */}
        <div style={{ marginTop: '20px' }}>
          <button
            onClick={() => setShowTaskDescriptions(!showTaskDescriptions)}
            style={{
              padding: '10px 15px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            {showTaskDescriptions ? 'Hide Task Descriptions' : 'Show Task Descriptions'}
          </button>

          <div style={{ border: '1px solid #ccc', borderRadius: '5px', backgroundColor: 'white', marginTop: '20px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', padding: '20px' }}>
              {showTaskDescriptions && (
                <>
                  <h3 style={{ width: '100%', textAlign: 'center', marginBottom: '20px' }}>Assigned Task Descriptions</h3>
                  {taskDescriptions.length > 0 ? (
                    taskDescriptions.map((desc, index) => (
                      <div
                        className="card"
                        key={index}
                        style={{
                          flex: '1 1 calc(33.333% - 20px)',
                          border: '1px solid #ccc',
                          borderRadius: '5px',
                          backgroundColor: 'white',
                          padding: '10px',
                          boxSizing: 'border-box',
                        }}
                      >
                        <p style={styles.dateText}>{new Date(desc.createdAt).toLocaleDateString()}</p>
                        <h3><strong>{desc.title}</strong></h3>
                        <b>Assigned to:</b> {getUserById(desc.user)}<br />
                        <p><b>Description: </b>{desc.description}</p>
                      </div>
                    ))
                  ) : (
                    <p style={{ width: '100%', textAlign: 'center' }}>No task descriptions available.</p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    backgroundImage: `url('/images/setting-image.jpg')`,
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
    fontFamily: 'Arial, sans-serif'
  },
  dropdown: {
    width: '30%',
    padding: '10px',
    border: '1px solid #ccc',
    margin: '10px 0',
    backgroundColor: 'white',
    fontSize: '16px'
  },
  button: {
    padding: '8px 16px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  dateText: {
    marginLeft: '20px',
    textAlign: 'right',
  },
};

export default TaskDashboard;