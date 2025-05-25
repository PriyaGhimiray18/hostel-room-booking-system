'use client';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Footer from '@/app/component/footer';
import styles from '@/styles/style.module.css';
import 'bootstrap/dist/css/bootstrap.min.css';


export default function RoomAdminPage() {
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    roomNumber: '',
    floor: '',
    capacity: '',
    status: 'available',
    occupants: 0,
    hostelId: '',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [currentHostelId, setCurrentHostelId] = useState('');

  // Fetch hostels (with rooms)
  const fetchHostels = async () => {
    try {
      const res = await fetch('/api/hostels');
      const data = await res.json();

      if (data.hostels && Array.isArray(data.hostels)) {
        setHostels(data.hostels);
      } else if (Array.isArray(data)) {
        setHostels(data);
      } else {
        setHostels([]);
      }
    } catch (err) {
      console.error('Error fetching hostels:', err);
      setHostels([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHostels();
  }, []);

  // Auto-select first hostel after loading hostels
  useEffect(() => {
    if (!loading && hostels.length > 0 && !currentHostelId) {
      setCurrentHostelId(hostels[0].id);
      setFormData(prev => ({ ...prev, hostelId: hostels[0].id }));
    }
  }, [loading, hostels, currentHostelId]);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: ['capacity', 'floor', 'occupants'].includes(name) ? Number(value) : value,
    });
  };

  // Handle hostel selector change
  const handleHostelChange = (e) => {
    const selectedId = e.target.value;
    setCurrentHostelId(selectedId);
    setFormData({
     roomNumber: '',
      floor: '',
      capacity: '',
      status: 'available',
      occupants: 0,
      hostelId: selectedId,
    });
    setIsEditing(false);
    setEditIndex(null);
  };

  // Submit room add/update
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentHostelId) {
      alert('Please select a hostel first!');
      return;
    }

    const hostelIndex = hostels.findIndex(h => h.id === currentHostelId);
    if (hostelIndex === -1) {
      alert('Selected hostel not found!');
      return;
    }

    const updatedHostels = [...hostels];
    const rooms = [...(updatedHostels[hostelIndex].rooms || [])];

    if (isEditing) {
      rooms[editIndex] = {
        roomNumber: formData.roomNumber,
        floor: formData.floor,
        capacity: formData.capacity,
        status: formData.status,
        occupants: formData.occupants,
        hostelId: currentHostelId,
      };
    } else {
      rooms.push({
        roomNumber: formData.roomNumber,
        floor: formData.floor,
        capacity: formData.capacity,
        status: formData.status,
        occupants: formData.occupants,
        hostelId: currentHostelId,
      });
    }

    updatedHostels[hostelIndex].rooms = rooms;

    try {
      // Send only updated rooms + hostelId
      await fetch('/api/hostels', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostelId: currentHostelId,
          rooms,
        }),
      });

      setHostels(updatedHostels);
      setFormData({
        roomNumber: '',
        floor: '',
        capacity: '',
        status: 'available',
        occupants: 0,
        hostelId: currentHostelId,
      });
      setIsEditing(false);
      setEditIndex(null);
    } catch (error) {
      alert('Failed to update rooms. Try again!');
      console.error('Update error:', error);
    }
  };

  // Edit room
  const handleEdit = (hostelId, index) => {
    const hostel = hostels.find(h => h.id === hostelId);
    if (!hostel) return;

    const room = (hostel.rooms && hostel.rooms[index]) || null;
    if (!room) return;

    setFormData({
      roomNumber: room.roomNumber,
      floor: room.floor,
      capacity: room.capacity,
      status: room.status,
      occupants: room.occupants,
      hostelId: hostelId,
    });
    setCurrentHostelId(hostelId);
    setIsEditing(true);
    setEditIndex(index);
  };

  // Delete room
  const handleDelete = async (hostelId, index) => {
    if (!confirm('Are you sure you want to delete this room?')) return;

    const updatedHostels = [...hostels];
    const hostelIndex = updatedHostels.findIndex(h => h.id === hostelId);
    if (hostelIndex === -1) return;

    updatedHostels[hostelIndex].rooms = updatedHostels[hostelIndex].rooms || [];
    updatedHostels[hostelIndex].rooms.splice(index, 1);

    try {
      // Send only updated rooms + hostelId
      await fetch('/api/hostels', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostelId,
          rooms: updatedHostels[hostelIndex].rooms,
        }),
      });

      setHostels(updatedHostels);
    } catch (error) {
      alert('Failed to delete room. Try again!');
      console.error('Delete error:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center text-gray-500">
        Loading hostels...
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Manage Rooms</h1>

      {/* Hostel selector */}
      <div className="hostel-selector-container">
        <label className="block mb-2 font-semibold">Select Hostel:</label>
        <select
          value={currentHostelId}
          onChange={handleHostelChange}
          className="w-full border px-3 py-2 rounded"
        >
          <option value="">-- Choose a hostel --</option>
          {Array.isArray(hostels) &&
            hostels.map(h => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
        </select>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-4 rounded shadow mb-6 space-y-4"
      >
        <input
          type="number"
          name="roomNumber"
          placeholder="Room Number"
          value={formData.roomNumber}
          onChange={handleChange}
          required
          className="w-full border px-3 py-2 rounded"
        />
        <input
          type="number"
          name="floor"
          placeholder="Floor Number"
          value={formData.floor}
          onChange={handleChange}
          required
          className="w-full border px-3 py-2 rounded"
        />
        <input
          type="number"
          name="capacity"
          placeholder="Capacity"
          value={formData.capacity}
          onChange={handleChange}
          required
          min={1}
          className="w-full border px-3 py-2 rounded"
        />
        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
        >
          <option value="available">Available</option>
          <option value="occupied">Occupied</option>
          <option value="maintenance">Maintenance</option>
        </select>
        <input
          type="number"
          name="occupants"
          placeholder="Number of Occupants"
          value={formData.occupants}
          onChange={handleChange}
          min={0}
          max={formData.capacity || 10}
          className="w-full border px-3 py-2 rounded"
        />
        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          {isEditing ? 'Update Room' : 'Add Room'}
        </button>
      </form>

      {/* Rooms List */}
      {!currentHostelId ? (
        <p className="text-center text-gray-500">
          Select a hostel to view its rooms.
        </p>
      ) : (
        <table className="w-full table-auto bg-white rounded shadow">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3 text-left">Room Number</th>
              <th className="p-3 text-left">Floor</th>
              <th className="p-3 text-left">Capacity</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Occupants</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {hostels
              .find(h => h.id === currentHostelId)
              ?.rooms?.map((room, idx) => (
                <tr key={`${room.roomNumber}-${idx}`} className="border-t">
                  <td className="p-3">{room.roomNumber}</td>
                  <td className="p-3">{room.floor}</td>
                  <td className="p-3">{room.capacity}</td>
                  <td className="p-3 capitalize">{room.status}</td>
                  <td className="p-3">{room.occupants}</td>
                  <td className="p-3 flex gap-2 justify-center">
                    <button
                      onClick={() => handleEdit(currentHostelId, idx)}
                      className="bg-yellow-400 text-white px-3 py-1 rounded hover:bg-yellow-500"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(currentHostelId, idx)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              )) || (
              <tr>
                <td colSpan="6" className="p-4 text-center text-gray-500">
                  No rooms found for this hostel.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
