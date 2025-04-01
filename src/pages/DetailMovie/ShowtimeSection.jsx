// src/pages/DetailMovie/ShowtimeSection.jsx
import React, { useState } from 'react';
import { Card, Tabs, DatePicker, Button, Modal } from 'antd';
import { CalendarOutlined, ClockCircleOutlined } from '@ant-design/icons';
import TheaterLayout from '../../components/TheaterLayout';

const { TabPane } = Tabs;

const ShowtimeSection = ({ showtimes, onShowtimeSelect }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTheater, setSelectedTheater] = useState(null);
  const [isLayoutModalVisible, setIsLayoutModalVisible] = useState(false);
  const [selectedShowtime, setSelectedShowtime] = useState(null);
  
  // Group showtimes by theater
  const showtimesByTheater = showtimes.reduce((acc, theater) => {
    acc[theater.theaterId] = theater;
    return acc;
  }, {});
  
  // Filter showtimes by selected date
  const filterShowtimesByDate = (showtimes, date) => {
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);
    
    return showtimes.filter(showtime => {
      const showtimeDate = new Date(showtime.startTime);
      showtimeDate.setHours(0, 0, 0, 0);
      return showtimeDate.getTime() === selectedDate.getTime();
    });
  };
  
  const handleDateChange = (date) => {
    if (date) {
      setSelectedDate(date.toDate());
    }
  };
  
  const handleShowtimeClick = (showtime) => {
    // Basic seat preview
    setSelectedShowtime(showtime);
    setIsLayoutModalVisible(true);
  };
  
  const handleShowtimeSelect = (showtimeId) => {
    if (onShowtimeSelect) {
      onShowtimeSelect(showtimeId);
    }
  };
  
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Get theater names for tabs
  const theaterIds = Object.keys(showtimesByTheater);
  
  return (
    <Card 
      title="Showtimes" 
      extra={
        <DatePicker 
          onChange={handleDateChange} 
          format="DD/MM/YYYY"
          placeholder="Select date"
          allowClear={false}
          className="w-40"
        />
      }
    >
      {theaterIds.length > 0 ? (
        <Tabs
          defaultActiveKey={theaterIds[0]}
          onChange={setSelectedTheater}
          tabPosition="left"
        >
          {theaterIds.map(theaterId => {
            const theater = showtimesByTheater[theaterId];
            const filteredShowtimes = filterShowtimesByDate(theater.showtimes, selectedDate);
            
            return (
              <TabPane 
                tab={
                  <div className="py-2 px-1">
                    <div className="font-medium">{theater.theaterName}</div>
                    <div className="text-xs text-gray-500">{theater.location?.city}</div>
                  </div>
                } 
                key={theaterId}
              >
                <div className="p-2">
                  <h3 className="text-lg font-semibold mb-3">{theater.theaterName}</h3>
                  <p className="text-gray-600 mb-4">
                    {theater.location?.address}, {theater.location?.city}
                  </p>
                  
                  {filteredShowtimes.length > 0 ? (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center">
                        <CalendarOutlined className="mr-2" />
                        {new Date(selectedDate).toLocaleDateString(undefined, { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </h4>
                      
                      <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mb-4">
                        {filteredShowtimes.map(showtime => (
                          <div key={showtime.id} className="flex flex-col">
                            <Button
                              onClick={() => handleShowtimeClick(showtime)}
                              className="mb-1 flex items-center justify-center"
                            >
                              <ClockCircleOutlined className="mr-1" />
                              {formatTime(showtime.startTime)}
                            </Button>
                            <div className="text-xs text-gray-500 text-center">
                              {showtime.screenName}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-500 py-4 text-center">
                      No showtimes available for the selected date
                    </div>
                  )}
                </div>
              </TabPane>
            );
          })}
        </Tabs>
      ) : (
        <div className="text-gray-500 py-4 text-center">
          No showtimes available for this movie
        </div>
      )}
      
      {/* Theater Layout Modal */}
      <Modal
        title="Seat Preview"
        visible={isLayoutModalVisible}
        onCancel={() => setIsLayoutModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsLayoutModalVisible(false)}>
            Close
          </Button>,
          <Button 
            key="book" 
            type="primary" 
            onClick={() => {
              setIsLayoutModalVisible(false);
              handleShowtimeSelect(selectedShowtime?.id);
            }}
          >
            Select Seats & Book
          </Button>
        ]}
        width={800}
      >
        {selectedShowtime && (
          <div>
            <div className="mb-4 text-center">
              <h3 className="font-semibold">{selectedShowtime.screenName}</h3>
              <p>{formatTime(selectedShowtime.startTime)}</p>
            </div>
            
            <TheaterLayout readOnly={true} />
            
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Pricing:</h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 bg-gray-100 rounded">
                  <div className="font-medium">Standard</div>
                  <div>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedShowtime.prices.standard)}</div>
                </div>
                <div className="text-center p-2 bg-gray-100 rounded">
                  <div className="font-medium">Premium</div>
                  <div>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedShowtime.prices.premium)}</div>
                </div>
                <div className="text-center p-2 bg-gray-100 rounded">
                  <div className="font-medium">VIP</div>
                  <div>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedShowtime.prices.vip)}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </Card>
  );
};

export default ShowtimeSection;