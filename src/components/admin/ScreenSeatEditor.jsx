import React, { useState, useEffect } from 'react';
import { ScreenApi } from '../apis/screenApi';
import { Button, Select, Input, Checkbox, message } from 'antd';

const { Option } = Select;

const ScreenSeatEditor = ({ screenId }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [layout, setLayout] = useState([]);
  const [screenInfo, setScreenInfo] = useState(null);
  const [config, setConfig] = useState({
    rows: [],
    seatsPerRow: 10,
    rowLabels: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    premiumRows: [],
    vipRows: []
  });

  // Load screen info and current layout
  useEffect(() => {
    const fetchScreenInfo = async () => {
      if (!screenId) return;
      
      try {
        setLoading(true);
        // Get screen details
        const screenResponse = await ScreenApi.getScreenById(screenId);
        if (screenResponse.statusCode === 200 && screenResponse.content) {
          setScreenInfo(screenResponse.content.screen);
        }
        
        // Get current seat layout
        const layoutResponse = await ScreenApi.getScreenSeats(screenId);
        if (layoutResponse.statusCode === 200 && layoutResponse.content) {
          const currentLayout = layoutResponse.content.seatingLayout || [];
          setLayout(currentLayout);
          
          // Extract configuration from existing layout
          if (currentLayout.length > 0) {
            const rowLabels = currentLayout.map(row => row.row).join('');
            const seatsPerRow = currentLayout[0]?.seats.length || 10;
            
            // Detect premium and VIP rows
            const premiumRows = [];
            const vipRows = [];
            
            currentLayout.forEach(row => {
              const rowType = row.seats[0]?.type;
              if (rowType === 'premium') {
                premiumRows.push(row.row);
              } else if (rowType === 'vip') {
                vipRows.push(row.row);
              }
            });
            
            setConfig({
              rows: rowLabels.split(''),
              seatsPerRow,
              rowLabels,
              premiumRows,
              vipRows
            });
          }
        }
      } catch (error) {
        console.error('Error fetching screen data:', error);
        message.error('Failed to load screen information');
      } finally {
        setLoading(false);
      }
    };
    
    fetchScreenInfo();
  }, [screenId]);

  // Generate layout preview based on config
  const generateLayout = () => {
    const newLayout = [];
    const rowLabels = config.rowLabels.slice(0, 26); // Limit to 26 letters
    
    for (let i = 0; i < config.rows.length; i++) {
      const rowLabel = config.rows[i];
      const seats = [];
      
      // Determine seat type for this row
      let seatType = 'standard';
      if (config.vipRows.includes(rowLabel)) {
        seatType = 'vip';
      } else if (config.premiumRows.includes(rowLabel)) {
        seatType = 'premium';
      }
      
      // Generate seats for this row
      for (let j = 1; j <= config.seatsPerRow; j++) {
        seats.push({
          id: `preview-${rowLabel}-${j}`,
          number: j,
          type: seatType,
          status: 'available'
        });
      }
      
      newLayout.push({
        row: rowLabel,
        seats
      });
    }
    
    setLayout(newLayout);
  };

  // Save the layout to the server
  const saveLayout = async () => {
    if (!screenId) {
      message.error('No screen selected');
      return;
    }
    
    try {
      setSaving(true);
      
      // Convert preview layout to the format expected by the API
      const seatsData = layout.flatMap(row => 
        row.seats.map(seat => ({
          row: row.row,
          number: seat.number,
          type: seat.type
        }))
      );
      
      // Send to the server
      const response = await ScreenApi.updateScreenSeats(screenId, seatsData);
      
      if (response.statusCode === 200) {
        message.success('Seat layout updated successfully');
      } else {
        message.error('Failed to update seat layout');
      }
    } catch (error) {
      console.error('Error saving layout:', error);
      message.error('An error occurred while saving the layout');
    } finally {
      setSaving(false);
    }
  };

  // Handle change in the number of rows
  const handleRowsChange = (value) => {
    const rowCount = parseInt(value, 10);
    if (isNaN(rowCount) || rowCount < 1) return;
    
    // Create array of row labels
    const newRows = [];
    for (let i = 0; i < rowCount && i < 26; i++) {
      newRows.push(config.rowLabels[i]);
    }
    
    setConfig(prev => ({ ...prev, rows: newRows }));
  };

  // Handle change in row type (standard, premium, vip)
  const handleRowTypeChange = (rowLabel, type) => {
    setConfig(prev => {
      const newConfig = { ...prev };
      
      // Remove from all type arrays first
      newConfig.premiumRows = newConfig.premiumRows.filter(r => r !== rowLabel);
      newConfig.vipRows = newConfig.vipRows.filter(r => r !== rowLabel);
      
      // Add to the specified type array
      if (type === 'premium') {
        newConfig.premiumRows.push(rowLabel);
      } else if (type === 'vip') {
        newConfig.vipRows.push(rowLabel);
      }
      
      return newConfig;
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-60">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Screen Seat Layout Editor</h2>
      {screenInfo && (
        <div className="mb-4 p-3 bg-gray-100 rounded">
          <h3 className="font-bold">{screenInfo.name}</h3>
          <p>Screen Type: {screenInfo.screenType}</p>
          <p>Capacity: {screenInfo.capacity} seats</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Layout Configuration */}
        <div className="p-4 border rounded">
          <h3 className="font-bold mb-3">Layout Configuration</h3>
          
          <div className="mb-4">
            <label className="block mb-1">Number of Rows:</label>
            <Input 
              type="number"
              value={config.rows.length}
              onChange={e => handleRowsChange(e.target.value)}
              min={1}
              max={26}
            />
          </div>
          
          <div className="mb-4">
            <label className="block mb-1">Seats Per Row:</label>
            <Input 
              type="number" 
              value={config.seatsPerRow}
              onChange={e => setConfig(prev => ({ 
                ...prev, 
                seatsPerRow: parseInt(e.target.value, 10) || 1 
              }))}
              min={1}
              max={40}
            />
          </div>
          
          <Button 
            type="primary"
            onClick={generateLayout}
            className="mb-4"
          >
            Generate Preview
          </Button>
          
          <div>
            <h4 className="font-bold mb-2">Row Types:</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {config.rows.map(rowLabel => (
                <div key={rowLabel} className="flex items-center space-x-2">
                  <span className="font-bold w-6">{rowLabel}</span>
                  <Select 
                    value={
                      config.vipRows.includes(rowLabel) 
                        ? 'vip' 
                        : config.premiumRows.includes(rowLabel) 
                          ? 'premium' 
                          : 'standard'
                    }
                    onChange={(value) => handleRowTypeChange(rowLabel, value)}
                    style={{ width: '100%' }}
                  >
                    <Option value="standard">Standard</Option>
                    <Option value="premium">Premium</Option>
                    <Option value="vip">VIP</Option>
                  </Select>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Layout Preview */}
        <div className="p-4 border rounded">
          <h3 className="font-bold mb-3">Layout Preview</h3>
          
          <div className="w-full py-2 bg-gray-800 text-white font-bold rounded-lg mb-4 text-center">
            SCREEN
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            <div className="flex flex-col items-center">
              {layout.map(row => (
                <div key={row.row} className="flex mb-1 w-full justify-center">
                  <div className="w-6 text-center font-bold pt-1">{row.row}</div>
                  <div className="flex gap-1 flex-wrap justify-center">
                    {row.seats.map(seat => {
                      let borderColor = 'border-green-500';
                      if (seat.type === 'premium') borderColor = 'border-blue-500';
                      if (seat.type === 'vip') borderColor = 'border-purple-500';
                      
                      return (
                        <div
                          key={seat.id}
                          className={`w-6 h-6 rounded flex items-center justify-center text-xs font-medium bg-gray-200 border-2 ${borderColor}`}
                          title={`${row.row}${seat.number} - ${seat.type.toUpperCase()}`}
                        >
                          {seat.number}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="text-right">
        <Button 
          type="primary" 
          onClick={saveLayout}
          loading={saving}
          disabled={layout.length === 0}
        >
          Save Layout
        </Button>
      </div>
      
      {/* Seat type legend */}
      <div className="mt-6 p-3 bg-gray-100 rounded">
        <h3 className="font-bold mb-2">Legend:</h3>
        <div className="flex flex-wrap gap-4">
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
        </div>
      </div>
    </div>
  );
};

export default ScreenSeatEditor;