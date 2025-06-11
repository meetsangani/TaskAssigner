import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import {
  Card,
  Select,
  Space,
  Table,
  Button,
  DatePicker,
  Tabs,
} from 'antd';
import { format, isSunday, eachDayOfInterval, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useNavigate } from 'react-router-dom';
import welcomeImage from './welcome.jpg';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

ChartJS.register(ArcElement, Tooltip, Legend);

const HrDashboard = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({ present: 0, absent: 0 });
  const [learningNotes, setLearningNotes] = useState([]);
  const navigate = useNavigate();

  // Fetch users and tasks
  useEffect(() => {
    fetchUsers();
    fetchTasks();
  }, []);

  // Update attendance stats when user or month changes
  useEffect(() => {
    if (selectedUser) {
      updateAttendanceStats();
    }
  }, [selectedUser, currentMonth, tasks]);

  // Add this new fetch function
  const fetchLearningNotes = async () => {
    if (selectedUser) {
      try {
        const response = await axios.get('http://localhost:8000/api/tasks');
        const userTasks = response.data.filter(task => task.user === selectedUser);
        // Sort tasks by date in descending order (latest first)
        const sortedTasks = userTasks.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        setLearningNotes(sortedTasks);
      } catch (error) {
        console.error('Error fetching learning notes:', error);
      }
    }
  };

  // Update useEffect to fetch learning notes when user changes
  useEffect(() => {
    if (selectedUser) {
      fetchLearningNotes();
      updateAttendanceStats();
    }
  }, [selectedUser, currentMonth, tasks]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/getAllUsers');
      setUsers(response.data.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/tasks');
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const holidays = [
    '2025-01-14', // Makar Sankranti
    '2025-01-26', // Republic Day',
    // ... (બાકીની holidays તમારી existing list માંથી)
  ];

  const isHoliday = (date) => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    const holiday = holidays.find(h => h === formattedDate);
    
    if (holiday) {
      const holidayNames = {
        '2025-01-14': 'Makar Sankranti',
        '2025-01-26': 'Republic Day',
        // ... (બાકીના holiday names તમારી existing list માંથી)
      };
      return holidayNames[holiday];
    }
    return null;
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
        return { date, status: holidayName, startTime: null, endTime: null };
      } else if (isSunday(date)) {
        return { date, status: 'Sunday', startTime: null, endTime: null };
      } else {
        const taskForDay = tasks.find(task =>
          format(new Date(task.createdAt), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd') && 
          task.user === selectedUser
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

  const updateAttendanceStats = () => {
    const monthAttendance = getMonthAttendance();
    const present = monthAttendance.filter(record => 
      record.status === 'Present' || 
      record.status === 'Sunday' || 
      holidays.includes(format(record.date, 'yyyy-MM-dd'))
    ).length;
    const absent = monthAttendance.filter(record => record.status === 'Absent').length;
    setAttendanceStats({ present, absent });
  };

  // Calculate duration between start and end time
  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return 'N/A';
    const pad = (s) => s.length === 2 ? s : s.padStart(2, '0');
    const [sh, sm] = startTime.split(':');
    const [eh, em] = endTime.split(':');
    const start = new Date(1970, 0, 1, Number(pad(sh)), Number(pad(sm)), 0);
    const end = new Date(1970, 0, 1, Number(pad(eh)), Number(pad(em)), 0);
    let diff = (end - start) / (1000 * 60); // minutes
    if (diff < 0) return 'N/A';
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    return `${hours} Hour${hours !== 1 ? 's' : ''} ${minutes} Minute${minutes !== 1 ? 's' : ''}`;
  };

  // Calculate total present days and total hours for the month
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
          let diff = (end - start) / (1000 * 60); // minutes
          if (diff > 0) totalMinutes += diff;
        }
      }
    });
    const totalHours = Math.floor(totalMinutes / 60);
    const totalRemMinutes = totalMinutes % 60;
    return { totalPresent, totalHours, totalRemMinutes };
  };

  const pieChartData = {
    labels: ['Present', 'Absent'],
    datasets: [{
      data: [attendanceStats.present, attendanceStats.absent],
      backgroundColor: ['#2E7D32', '#FF5722'],
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

  const downloadPDF = () => {
    if (!selectedUser) {
      alert('Please select a user to generate the report.');
      return;
    }

    const doc = new jsPDF();
    const selectedUserName = users.find(u => u._id === selectedUser)?.name || 'Unknown User';
    const reportTitle = `Attendance Report for ${selectedUserName} (${format(currentMonth, 'MMMM yyyy')})`;

    doc.setFontSize(18);
    doc.text(reportTitle, 14, 20);

    const summaryYPosition = 30;
    doc.setFontSize(12);
    doc.text("Summary:", 14, summaryYPosition);

    // Add total present and total hours
    const { totalPresent, totalHours, totalRemMinutes } = getAttendanceSummary();
    doc.text(`- Present: ${attendanceStats.present}`, 14, summaryYPosition + 10);
    doc.text(`- Absent: ${attendanceStats.absent}`, 14, summaryYPosition + 20);
    doc.text(`- Total Present Days: ${totalPresent}`, 14, summaryYPosition + 30);
    doc.text(`- Total Working Hours: ${totalHours} Hours ${totalRemMinutes} Minutes`, 14, summaryYPosition + 40);

    const tableData = getMonthAttendance().map(record => [
      format(record.date, 'dd-MM-yyyy'),
      record.status,
      record.startTime || 'N/A',
      record.endTime || 'N/A',
      record.status === 'Present' && record.startTime && record.endTime
        ? calculateDuration(record.startTime, record.endTime)
        : 'N/A'
    ]);

    doc.autoTable({
      startY: summaryYPosition + 50,
      head: [['Date', 'Status', 'Start Time', 'End Time', 'Duration']],
      body: tableData,
      styles: { cellPadding: 3, fontSize: 10 },
      headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
      bodyStyles: { lineColor: [200, 200, 200], lineWidth: 0.1 },
    });

    doc.save(`Attendance_Report_${selectedUserName}.pdf`);
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => format(date, 'dd-MM-yyyy'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <span style={{
          backgroundColor:
            status === 'Present' ? '#2E7D32' :
            status === 'Absent' ? '#FF5722' :
            '#FFB74D',
          color: 'white',
          padding: '3px 8px',
          borderRadius: '3px'
        }}>
          {status}
        </span>
      ),
    },
    {
      title: 'Start Time',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (time, record) => record.status === 'Present' ? (time || 'N/A') : 'N/A',
    },
    {
      title: 'End Time',
      dataIndex: 'endTime',
      key: 'endTime',
      render: (time, record) => record.status === 'Present' ? (time || 'N/A') : 'N/A',
    },
    {
      title: 'Duration',
      key: 'duration',
      render: (_, record) =>
        record.status === 'Present' && record.startTime && record.endTime
          ? calculateDuration(record.startTime, record.endTime)
          : 'N/A',
    },
  ];

  // Add new columns for learning notes table
  const learningColumns = [
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => format(new Date(date), 'dd-MM-yyyy'),
    },
    {
      title: 'Learning Notes',
      dataIndex: 'learning',
      key: 'learning',
    },
    {
      title: 'Time Slots',
      dataIndex: 'timeSlots',
      key: 'timeSlots',
      render: (timeSlots) => (
        <div>
          {timeSlots?.map((slot, index) => (
            <div key={index}>
              <strong>{slot.startTime} - {slot.endTime}</strong>
              <p>{slot.notes}</p>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <span style={{
          backgroundColor:
            status === 'Completed' ? '#2E7D32' :
            status === 'In Progress' ? '#FFB74D' :
            '#FF5722',
          color: 'white',
          padding: '3px 8px',
          borderRadius: '3px'
        }}>
          {status}
        </span>
      ),
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/'); // Redirect to login page
  };

  return (
    <Card 
      title="HR Dashboard" 
      style={{ margin: 20, backgroundColor: '#f0f0f0' }}
      extra={
        <Button 
          type="primary" 
          danger 
          onClick={handleLogout}
        >
          Logout
        </Button>
      }
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Space>
          <Select
            style={{ width: 200 }}
            placeholder="Select a User"
            onChange={setSelectedUser}
            value={selectedUser}
          >
            <Option value="">--Select a User--</Option>
            {users.map(user => (
              <Option key={user._id} value={user._id}>{user.name}</Option>
            ))}
          </Select>

          <Button 
            type="primary"
            onClick={downloadPDF}
            disabled={!selectedUser}
          >
            Download Attendance Report
          </Button>
        </Space>

        {selectedUser ? (
          <Tabs defaultActiveKey="1">
            <TabPane tab="Attendance Overview" key="1">
              <div style={{ display: 'flex', gap: '20px' }}>
                <Card style={{ flex: 1 }}>
                  <h3>Attendance Overview</h3>
                  <div style={{ height: 300 }}>
                    <Pie data={pieChartData} options={pieChartOptions} />
                  </div>
                </Card>

                <Card style={{ flex: 2 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <Button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                      Previous Month
                    </Button>
                    <span>{format(currentMonth, 'MMMM yyyy')}</span>
                    <Button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                      Next Month
                    </Button>
                  </div>
                  <Table 
                    columns={columns} 
                    dataSource={getMonthAttendance()}
                    rowKey={(record) => format(record.date, 'yyyy-MM-dd')}
                    pagination={false}
                  />
                </Card>
              </div>
            </TabPane>

            <TabPane tab="Learning Notes" key="2">
              <Card>
                <Table
                  columns={learningColumns}
                  dataSource={learningNotes}
                  rowKey="_id"
                  pagination={{
                    pageSize: 10,
                    showTotal: (total) => `Total ${total} entries`,
                  }}
                />
              </Card>
            </TabPane>
          </Tabs>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '50px 20px',
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            margin: '20px 0'
          }}>
            <img 
              src={welcomeImage} // Add your welcome image here
              alt="Welcome"
              style={{
                width: '200px',
                marginBottom: '20px'
              }}

            />
            <h1 style={{
              fontSize: '24px',
              color: '#1890ff',
              marginBottom: '16px'
            }}>
              Welcome to HR Dashboard
            </h1>
            <p style={{
              fontSize: '16px',
              color: '#666',
              maxWidth: '600px',
              margin: '0 auto 20px'
            }}>
              Please select a user from the dropdown menu above to:
            </p>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '40px',
              flexWrap: 'wrap'
            }}>
              <div style={{
                background: '#f6ffed',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #b7eb8f',
                width: '200px'
              }}>
                <h3 style={{ color: '#52c41a' }}>View Attendance</h3>
                <p>Track daily attendance and view monthly statistics</p>
              </div>
              <div style={{
                background: '#e6f7ff',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #91d5ff',
                width: '200px'
              }}>
                <h3 style={{ color: '#1890ff' }}>Learning Progress</h3>
                <p>Monitor learning activities and daily tasks</p>
              </div>
              <div style={{
                background: '#fff7e6',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #ffd591',
                width: '200px'
              }}>
                <h3 style={{ color: '#fa8c16' }}>Generate Reports</h3>
                <p>Download detailed attendance reports in PDF format</p>
              </div>
            </div>
          </div>
        )}
      </Space>
    </Card>
  );
};

export default HrDashboard;