'use client';

import React, { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from '@/styles/style.module.css';
import 'bootstrap/dist/css/bootstrap.min.css';

function AvailableRoomContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const hostel = searchParams.get('hostel');

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!hostel) {
      setError('No hostel specified');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    fetch(`/api/rooms?hostel=${encodeURIComponent(hostel)}`)
      .then(async (res) => {
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to fetch rooms');
        }
        return res.json();
      })
      .then((data) => {
        // Show all rooms except those under maintenance
        const filteredRooms = (data.rooms || []).filter(
          (room) => room.status?.toUpperCase() !== 'MAINTENANCE'
        );
        setRooms(filteredRooms);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching room data:', err);
        setError(err.message || 'Failed to load room data');
        setLoading(false);
      });
  }, [hostel]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return 'success';
      case 'PARTIALLY_BOOKED':
        return 'warning';
      case 'FULLY_BOOKED':
        return 'danger';
      case 'MAINTENANCE':
        return 'secondary';
      default:
        return 'primary';
    }
  };

  const getStatusText = (status, occupants, capacity) => {
    switch (status) {
      case 'AVAILABLE':
        return 'Available';
      case 'PARTIALLY_BOOKED':
        return `${occupants}/${capacity} Occupied`;
      case 'FULLY_BOOKED':
        return 'Fully Booked';
      case 'MAINTENANCE':
        return 'Under Maintenance';
      default:
        return status;
    }
  };

  if (!hostel) {
    return (
      <div className="container my-5">
        <div className="alert alert-danger">No hostel specified</div>
      </div>
    );
  }

  return (
    <div className="container my-5">
      <h2 className="text-center mb-4">Available Rooms in {hostel}</h2>

      {loading && (
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="row">
        {rooms.map((room) => (
          <div key={room.id} className="col-md-4 mb-3">
            <div
              className="card h-100 shadow-sm clickable-card"
              onClick={() => router.push(`/booking?room=${room.id}`)}
              style={{ cursor: 'pointer' }}
            >
              <div className="card-body">
                <h5 className="card-title">Room {room.roomNumber}</h5>
                <p className="card-text">
                  <small className="text-muted">Floor {room.floor}</small>
                </p>
                <p className="card-text">
                  Capacity: {room.capacity} people<br />
                  Current occupants: {room.occupants}
                </p>
                <div className={`alert alert-${getStatusColor(room.status)} mb-0`}>
                  {getStatusText(room.status, room.occupants, room.capacity)}
                </div>
              </div>
            </div>
          </div>
        ))}

        {!loading && !error && rooms.length === 0 && (
          <div className="col-12">
            <div className="alert alert-info text-center">
              No rooms found in this hostel.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AvailableRoomPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AvailableRoomContent />
    </Suspense>
  );
}
