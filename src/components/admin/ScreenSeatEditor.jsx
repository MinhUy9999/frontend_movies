// src/components/admin/ScreenSeatEditor.jsx
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { ScreenApi } from '../apis/screenApi';
import { Button, Select, Input, message } from 'antd';

const { Option } = Select;

// Component cho phép chỉnh sửa bố cục ghế ngồi trong phòng chiếu
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

  // Tải thông tin phòng chiếu và bố cục hiện tại
  useEffect(() => {
    const fetchScreenInfo = async () => {
      if (!screenId) return;

      try {
        setLoading(true);
        // Lấy thông tin chi tiết phòng chiếu
        const screenResponse = await ScreenApi.getScreenById(screenId);
        if (screenResponse.statusCode === 200 && screenResponse.content) {
          setScreenInfo(screenResponse.content.screen);
        }

        // Lấy bố cục ghế hiện tại
        const layoutResponse = await ScreenApi.getScreenSeats(screenId);
        if (layoutResponse.statusCode === 200 && layoutResponse.content) {
          const currentLayout = layoutResponse.content.seatingLayout || [];
          setLayout(currentLayout);

          // Trích xuất cấu hình từ bố cục hiện có
          if (currentLayout.length > 0) {
            const extractedRowLabels = currentLayout.map(row => row.row).join('');
            const seatsPerRow = currentLayout[0]?.seats.length || 10;

            // Phát hiện hàng cao cấp và VIP
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
              rows: extractedRowLabels.split(''),
              seatsPerRow,
              rowLabels: config.rowLabels,
              premiumRows,
              vipRows
            });
          }
        }
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu phòng chiếu:', error);
        message.error('Không thể tải thông tin phòng chiếu');
      } finally {
        setLoading(false);
      }
    };

    fetchScreenInfo();
  }, [screenId, config.rowLabels]);

  // Tạo bản xem trước bố cục dựa trên cấu hình
  const generateLayout = () => {
    const newLayout = [];

    for (let i = 0; i < config.rows.length; i++) {
      const rowLabel = config.rows[i];
      const seats = [];

      // Xác định loại ghế cho hàng này
      let seatType = 'standard';
      if (config.vipRows.includes(rowLabel)) {
        seatType = 'vip';
      } else if (config.premiumRows.includes(rowLabel)) {
        seatType = 'premium';
      }

      // Tạo ghế cho hàng này
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

  // Lưu bố cục lên máy chủ
  const saveLayout = async () => {
    if (!screenId) {
      message.error('Chưa chọn phòng chiếu');
      return;
    }

    try {
      setSaving(true);

      // Chuyển đổi bố cục xem trước sang định dạng mà API mong đợi
      const seatsData = layout.flatMap(row =>
        row.seats.map(seat => ({
          row: row.row,
          number: seat.number,
          type: seat.type
        }))
      );

      // Gửi lên máy chủ
      const response = await ScreenApi.updateScreenSeats(screenId, seatsData);

      if (response.statusCode === 200) {
        message.success('Bố cục ghế đã được cập nhật thành công');
      } else {
        message.error('Không thể cập nhật bố cục ghế');
      }
    } catch (error) {
      console.error('Lỗi khi lưu bố cục:', error);
      message.error('Đã xảy ra lỗi khi lưu bố cục');
    } finally {
      setSaving(false);
    }
  };

  // Xử lý thay đổi số lượng hàng
  const handleRowsChange = (value) => {
    const rowCount = parseInt(value, 10);
    if (isNaN(rowCount) || rowCount < 1) return;

    // Tạo mảng các nhãn hàng
    const newRows = [];
    for (let i = 0; i < rowCount && i < 26; i++) {
      newRows.push(config.rowLabels[i]);
    }

    setConfig(prev => ({ ...prev, rows: newRows }));
  };

  // Xử lý thay đổi loại hàng (thường, cao cấp, vip)
  const handleRowTypeChange = (rowLabel, type) => {
    setConfig(prev => {
      const newConfig = { ...prev };

      // Đầu tiên, loại bỏ khỏi tất cả các mảng loại
      newConfig.premiumRows = newConfig.premiumRows.filter(r => r !== rowLabel);
      newConfig.vipRows = newConfig.vipRows.filter(r => r !== rowLabel);

      // Thêm vào mảng loại được chỉ định
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
      <h2 className="text-2xl font-bold mb-4">Chỉnh sửa bố cục ghế phòng chiếu</h2>
      {screenInfo && (
        <div className="mb-4 p-3 bg-gray-100 rounded">
          <h3 className="font-bold">{screenInfo.name}</h3>
          <p>Loại phòng chiếu: {screenInfo.screenType}</p>
          <p>Sức chứa: {screenInfo.capacity} ghế</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Cấu hình bố cục */}
        <div className="p-4 border rounded">
          <h3 className="font-bold mb-3">Cấu hình bố cục</h3>

          <div className="mb-4">
            <label className="block mb-1">Số lượng hàng:</label>
            <Input
              type="number"
              value={config.rows.length}
              onChange={e => handleRowsChange(e.target.value)}
              min={1}
              max={26}
            />
          </div>

          <div className="mb-4">
            <label className="block mb-1">Số ghế mỗi hàng:</label>
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
            Tạo bản xem trước
          </Button>

          <div>
            <h4 className="font-bold mb-2">Loại hàng:</h4>
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
                    <Option value="standard">Thường</Option>
                    <Option value="premium">Cao cấp</Option>
                    <Option value="vip">VIP</Option>
                  </Select>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Xem trước bố cục */}
        <div className="p-4 border rounded">
          <h3 className="font-bold mb-3">Xem trước bố cục</h3>

          <div className="w-full py-2 bg-gray-800 text-white font-bold rounded-lg mb-4 text-center">
            MÀN HÌNH
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
                          title={`${row.row}${seat.number} - ${seat.type === 'standard' ? 'THƯỜNG' :
                              seat.type === 'premium' ? 'CAO CẤP' : 'VIP'
                            }`}
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
          Lưu bố cục
        </Button>
      </div>

      {/* Chú thích loại ghế */}
      <div className="mt-6 p-3 bg-gray-100 rounded">
        <h3 className="font-bold mb-2">Chú thích:</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center">
            <div className="w-6 h-6 bg-gray-200 border-2 border-green-500 rounded mr-2"></div>
            <span>Thường</span>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-6 bg-gray-200 border-2 border-blue-500 rounded mr-2"></div>
            <span>Cao cấp</span>
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

// Định nghĩa PropTypes để xác thực props
ScreenSeatEditor.propTypes = {
  screenId: PropTypes.string
};

export default ScreenSeatEditor;