import React, { useState } from 'react';

const TaskDescription = ({ isOpen, onClose, onSubmit, user }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    const taskData = { title, description };
    onSubmit(taskData); // Call the onSubmit function with the taskData
  };

  return (
    <div className={`popup-overlay ${isOpen ? 'show' : ''}`}>
      <div className="popup-container">
        <h2 className="popup-header">Add New Task</h2>
        <form className="popup-form" onSubmit={handleSubmit}>
          <div>
            <label>Title:</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div>
            <label>Description:</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} required />
          </div>
          <div className="popup-actions">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit">Submit</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskDescription;