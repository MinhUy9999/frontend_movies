// src/components/TheaterLayout.jsx
import React, { useState } from 'react';
import { Card, Button, Select, Input, Modal } from 'antd';
import { DownCircleOutlined } from '@ant-design/icons';

const { Option } = Select;

const TheaterLayout = ({ theaterData, onSeatClick, readOnly = false, editable = false }) => {
  const [selectedSeatType, setSelectedSeatType] = useState('standard');
  const [isSeatModalVisible, setIsSeatModalVisible] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState(null);
  
  // Default theater layout if none provided
  const defaultLayout = {
    name: 'Screen 1',
    rows: 9,
    seatsPerRow: 9,
    rowLabels: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'],
    seats: []
  };
  
  const layout = theaterData || defaultLayout;
  
  // Generate seats if not provided
  const generateSeats = () => {
    if (layout.seats && layout.seats.length > 0) {
      return layout.seats;
    }
    
    const generatedSeats = [];
    for (let rowIndex = 0; rowIndex < layout.rows; rowIndex++) {
      const rowLabel = layout.rowLabels[rowIndex];
      const row = {
        row: rowLabel,
        seats: []
      };
      
      for (let seatNum = 1; seatNum <= layout.seatsPerRow; seatNum++) {
        let seatType = 'standard';
        // Premium seats in first two rows
        if (rowIndex < 2) {
          seatType = 'premium';
        } 
        // VIP seats in 3rd row
        else if (rowIndex === 2) {
          seatType = 'vip';
        }
        
        row.seats.push({
          id: `${rowLabel}${seatNum}`,
          number: seatNum,
          type: seatType,
          status: 'available'
        });
      }
      
      generatedSeats.push(row);
    }
    
    return generatedSeats;
  };
  
  const seats = generateSeats();
  
  const handleSeatClick = (row, seat) => {
    if (readOnly) return;
    
    if (editable) {
      // In editable mode, show modal to edit seat
      setSelectedSeat({ row, seat });
      setIsSeatModalVisible(true);
    } else {
      // In normal mode, just handle the click event
      if (onSeatClick) {
        onSeatClick(`${row.row}${seat.number}`, seat.status, seat.type);
      }
    }
  };
  
  const handleSeatUpdate = (newType) => {
    // This would update the seat type in editable mode
    // Implementation depends on how you want to update the data
    setIsSeatModalVisible(false);
  };
  
  // Calculate seat color based on type and status
  const getSeatColor = (seat, isSelectedSeat = false) => {
    // Status colors override type colors
    if (seat.status === 'booked') return 'bg-red-500 text-white cursor-not-allowed';
    if (seat.status === 'reserved') return 'bg-yellow-500 text-white cursor-not-allowed';
    if (isSelectedSeat) return 'bg-blue-500 text-white';
    
    // Default colors based on type when available
    return 'bg-gray-200 hover:bg-gray-300';
  };
  
  // Get border color based on seat type
  const getSeatBorder = (seat, rowLabel) => {
    // Sử dụng hàng thay vì seat.type cho nhất quán
    if (['D', 'E', 'F'].includes(rowLabel)) {
      return 'border-blue-500'; // premium
    } else if (['G', 'H', 'I'].includes(rowLabel)) {
      return 'border-purple-500'; // vip
    } else {
      return 'border-green-500'; // standard
    }
  };
  
  return (
    <Card title={`Theater Layout - ${layout.name}`} className="mb-6">
      {/* Control panel for editable mode */}
      {editable && (
        <div className="mb-4 p-3 bg-gray-100 rounded">
          <div className="flex flex-wrap gap-3 items-center">
            <span className="font-medium">Selected Seat Type:</span>
            <Select 
              value={selectedSeatType} 
              onChange={setSelectedSeatType}
              style={{ width: 120 }}
            >
              <Option value="standard">Standard</Option>
              <Option value="premium">Premium</Option>
              <Option value="vip">VIP</Option>
            </Select>
            <span className="text-gray-500 ml-4">Click on a seat to change its type</span>
          </div>
        </div>
      )}
      
      {/* Theater legend */}
      <div className="flex flex-wrap gap-4 justify-center mb-6">
        <div className="flex items-center">
          <div className="w-6 h-6 bg-gray-200 border-2 border-green-500 rounded mr-2"></div>
          <span>Standard</span>
        </div>
        <div className="flex items-center">
          <div className="w-6 h-6 bg-gray-200 border-2 border-blue-500 rounded mr-2"></div>
          <span>Premium</span>
        </div>
        <div className="flex items-center">
          <div className="w-6 h-6 bg-gray-200 border-2 border-purple-500 rounded mr-2"></div>
          <span>VIP</span>
        </div>
        {!editable && (
          <>
            <div className="flex items-center">
              <div className="w-6 h-6 bg-blue-500 rounded mr-2"></div>
              <span>Selected</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 bg-red-500 rounded mr-2"></div>
              <span>Booked</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 bg-yellow-500 rounded mr-2"></div>
              <span>Reserved</span>
            </div>
          </>
        )}
      </div>
      
      {/* Screen */}
      <div className="relative">
        <div className="w-full py-3 bg-gray-800 text-white font-bold rounded-t-lg text-center mb-10">
          SCREEN
        </div>
        
        {/* Seats */}
        <div className="flex flex-col items-center space-y-3">
          {seats.map(row => (
            <div key={row.row} className="flex items-center">
              <div className="w-8 text-center font-bold">{row.row}</div>
              <div className="flex gap-2">
                {row.seats.map(seat => {
                  const isSelected = false; // This would need logic to determine if selected
                  
                  return (
                    <button
                      key={`${row.row}${seat.number}`}
                      className={`w-10 h-10 rounded flex items-center justify-center text-sm font-medium ${getSeatColor(seat, isSelected)} border-2 ${getSeatBorder(seat, row.row)} transition-colors duration-200`}
                      onClick={() => handleSeatClick(row, seat)}
                      disabled={readOnly || (!editable && seat.status !== 'available' && !isSelected)}
                    >
                      {seat.number}
                    </button>
                  );
                })}
              </div>
              <div className="w-8"></div> {/* Spacer for symmetry */}
            </div>
          ))}
        </div>
        
        {/* Theater entrance */}
        <div className="mt-10 text-center">
          <div className="inline-block bg-gray-300 px-10 py-2 rounded">
            <DownCircleOutlined className="mr-2" />
            ENTRANCE
          </div>
        </div>
      </div>
      
      {/* Edit Seat Modal */}
      <Modal
        title="Edit Seat"
        visible={isSeatModalVisible}
        onCancel={() => setIsSeatModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsSeatModalVisible(false)}>
            Cancel
          </Button>,
          <Button key="standard" type="primary" onClick={() => handleSeatUpdate('standard')}>
            Set as Standard
          </Button>,
          <Button key="premium" type="primary" style={{ background: '#1890ff' }} onClick={() => handleSeatUpdate('premium')}>
            Set as Premium
          </Button>,
          <Button key="vip" type="primary" style={{ background: '#722ed1' }} onClick={() => handleSeatUpdate('vip')}>
            Set as VIP
          </Button>
        ]}
      >
        {selectedSeat && (
          <div>
            <p><strong>Row:</strong> {selectedSeat.row.row}</p>
            <p><strong>Seat Number:</strong> {selectedSeat.seat.number}</p>
            <p><strong>Current Type:</strong> {selectedSeat.seat.type.toUpperCase()}</p>
          </div>
        )}
      </Modal>
    </Card>
  );
};

export default TheaterLayout;