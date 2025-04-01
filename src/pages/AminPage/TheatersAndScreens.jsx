// src/pages/AminPage/TheatersAndScreens.jsx
import React, { useState, useEffect } from 'react';
import { Tabs, Card, Select, Button, Form, Input, InputNumber, message, Spin } from 'antd';
import { ScreenApi } from '../../apis/screenApi';
import { TheaterAPI } from '../../apis/theaterApi';
import TheaterLayout from '../../components/TheaterLayout';

const { TabPane } = Tabs;
const { Option } = Select;

const TheatersAndScreens = () => {
  const [theaters, setTheaters] = useState([]);
  const [screens, setScreens] = useState([]);
  const [selectedTheater, setSelectedTheater] = useState(null);
  const [selectedScreen, setSelectedScreen] = useState(null);
  const [loading, setLoading] = useState(false);
  const [screenForm] = Form.useForm();
  
  useEffect(() => {
    fetchTheaters();
  }, []);
  
  useEffect(() => {
    if (selectedTheater) {
      fetchScreensForTheater(selectedTheater);
    }
  }, [selectedTheater]);
  
  const fetchTheaters = async () => {
    try {
      setLoading(true);
      const response = await TheaterAPI.getAllTheaters();
      
      if (response.statusCode === 200 && response.content?.theaters) {
        setTheaters(response.content.theaters);
        
        if (response.content.theaters.length > 0) {
          setSelectedTheater(response.content.theaters[0]._id);
        }
      }
    } catch (error) {
      console.error('Error fetching theaters:', error);
      message.error('Failed to load theaters');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchScreensForTheater = async (theaterId) => {
    try {
      setLoading(true);
      const response = await TheaterAPI.getTheaterScreens(theaterId);
      
      if (response.statusCode === 200 && response.content?.screens) {
        setScreens(response.content.screens);
        
        if (response.content.screens.length > 0) {
          setSelectedScreen(response.content.screens[0]._id);
          fetchScreenDetails(response.content.screens[0]._id);
        } else {
          setSelectedScreen(null);
        }
      }
    } catch (error) {
      console.error('Error fetching screens:', error);
      message.error('Failed to load screens for this theater');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchScreenDetails = async (screenId) => {
    try {
      setLoading(true);
      const response = await ScreenApi.getScreenById(screenId);
      
      if (response.statusCode === 200 && response.content?.screen) {
        const screen = response.content.screen;
        
        // Set form values
        screenForm.setFieldsValue({
          name: screen.name,
          capacity: screen.capacity,
          screenType: screen.screenType
        });
      }
    } catch (error) {
      console.error('Error fetching screen details:', error);
      message.error('Failed to load screen details');
    } finally {
      setLoading(false);
    }
  };
  
  const handleScreenChange = (screenId) => {
    setSelectedScreen(screenId);
    fetchScreenDetails(screenId);
  };
  
  const handleScreenUpdate = async (values) => {
    try {
      setLoading(true);
      
      const data = {
        ...values,
        theaterId: selectedTheater
      };
      
      let response;
      if (selectedScreen) {
        // Update existing screen
        response = await ScreenApi.updateScreen(selectedScreen, data);
      } else {
        // Create new screen
        response = await ScreenApi.createScreen(data);
      }
      
      if ((response.statusCode === 200 || response.statusCode === 201) && 
          (response.content?.screen)) {
        message.success(selectedScreen ? 'Screen updated successfully' : 'Screen created successfully');
        
        // Refresh screens list
        fetchScreensForTheater(selectedTheater);
      } else {
        message.error(response.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Error updating screen:', error);
      message.error('Failed to update screen');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Theater & Screen Management</h2>
      
      <Tabs defaultActiveKey="1">
        <TabPane tab="Screens & Layouts" key="1">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left sidebar */}
            <div className="md:col-span-1">
              <Card title="Theaters & Screens" className="mb-4">
                <div className="mb-4">
                  <label className="block mb-1 font-medium">Select Theater:</label>
                  <Select 
                    value={selectedTheater} 
                    onChange={setSelectedTheater}
                    style={{ width: '100%' }}
                    loading={loading}
                  >
                    {theaters.map(theater => (
                      <Option key={theater._id} value={theater._id}>{theater.name}</Option>
                    ))}
                  </Select>
                </div>
                
                <div className="mb-4">
                  <div className="flex justify-between mb-1">
                    <label className="font-medium">Select Screen:</label>
                    <Button type="link" onClick={() => {
                      setSelectedScreen(null);
                      screenForm.resetFields();
                    }}>
                      + New Screen
                    </Button>
                  </div>
                  <Select 
                    value={selectedScreen} 
                    onChange={handleScreenChange}
                    style={{ width: '100%' }}
                    loading={loading}
                    disabled={!selectedTheater}
                  >
                    {screens.map(screen => (
                      <Option key={screen._id} value={screen._id}>{screen.name}</Option>
                    ))}
                  </Select>
                </div>
                
                <Form
                  form={screenForm}
                  layout="vertical"
                  onFinish={handleScreenUpdate}
                  disabled={loading}
                >
                  <Form.Item
                    name="name"
                    label="Screen Name"
                    rules={[{ required: true, message: 'Please enter screen name' }]}
                  >
                    <Input placeholder="e.g. Screen 1" />
                  </Form.Item>
                  
                  <Form.Item
                    name="capacity"
                    label="Capacity"
                    rules={[{ required: true, message: 'Please enter capacity' }]}
                  >
                    <InputNumber min={1} style={{ width: '100%' }} />
                  </Form.Item>
                  
                  <Form.Item
                    name="screenType"
                    label="Screen Type"
                    rules={[{ required: true, message: 'Please select screen type' }]}
                    initialValue="standard"
                  >
                    <Select>
                      <Option value="standard">Standard</Option>
                      <Option value="imax">IMAX</Option>
                      <Option value="vip">VIP</Option>
                      <Option value="4dx">4DX</Option>
                    </Select>
                  </Form.Item>
                  
                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading} block>
                      {selectedScreen ? 'Update Screen' : 'Create Screen'}
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            </div>
            
            {/* Main content - Theater layout */}
            <div className="md:col-span-2">
              {loading ? (
                <div className="flex justify-center items-center h-96">
                  <Spin size="large" />
                </div>
              ) : selectedScreen ? (
                <div>
                  <TheaterLayout 
                    editable={true}
                    theaterData={{
                      name: screens.find(s => s._id === selectedScreen)?.name || 'Screen',
                      rows: 9,
                      seatsPerRow: 9,
                      rowLabels: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I']
                    }}
                  />
                  
                  <div className="mt-4 flex justify-end">
                    <Button type="primary">Save Seat Layout</Button>
                  </div>
                </div>
              ) : (
                <Card className="h-96 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <p>No screen selected.</p>
                    <p>Select a screen from the left panel or create a new one.</p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </TabPane>
        
        <TabPane tab="Theater Information" key="2">
          <p>Theater details management interface goes here</p>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default TheatersAndScreens;