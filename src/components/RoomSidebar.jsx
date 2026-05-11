import React from 'react';
import './RoomSidebar.css';

const RoomSidebar = ({ rooms, activeRoom, setActiveRoom }) => {
  return (
    <div className="room-sidebar">
      <h2>Rooms</h2>
      <ul>
        {rooms.map(room => (
          <li
            key={room}
            className={`${room === activeRoom ? 'active' : ''}`}
            onClick={() => setActiveRoom(room)}
          >
            #{room}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RoomSidebar;