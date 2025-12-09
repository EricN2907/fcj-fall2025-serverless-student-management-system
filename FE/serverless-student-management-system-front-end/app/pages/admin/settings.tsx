import React, { useState } from 'react';
import { Save, Bell, Globe, Database, Server, Calendar, Type } from 'lucide-react';

const AdminSettings: React.FC = () => {
  const [systemName, setSystemName] = useState('Serverless Student Management System');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [allowRegistration, setAllowRegistration] = useState(true);
  const [currentTerm, setCurrentTerm] = useState('2024-2025-HK1');

  return (
    <div className="max-w-5xl mx-auto pb-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Cài đặt Hệ thống</h1>
        <p className="text-slate-500 mt-2">Cấu hình các tham số vận hành chung cho LMS.</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* General Settings */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-100">
             <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Globe size={20} />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Thông tin chung</h3>
             </div>
             <p className="text-sm text-slate-500 ml-11">Các thông tin cơ bản hiển thị trên toàn hệ thống.</p>
          </div>
          
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <Type size={16} className="text-slate-400" />
                    Tên hệ thống
                  </label>
                  <input 
                    type="text" 
                    value={systemName}
                    onChange={(e) => setSystemName(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#dd7323]/20 focus:border-[#dd7323] outline-none text-slate-700 transition-all placeholder-slate-400 shadow-sm"
                    placeholder="Nhập tên hệ thống..."
                  />
                  <p className="text-xs text-slate-400 mt-2">Tên này sẽ hiển thị trên tiêu đề tab trình duyệt và trang đăng nhập.</p>
               </div>

               <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <Calendar size={16} className="text-slate-400" />
                    Học kỳ hiện tại
                  </label>
                  <div className="relative">
                    <select 
                      value={currentTerm}
                      onChange={(e) => setCurrentTerm(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#dd7323]/20 focus:border-[#dd7323] outline-none text-slate-700 transition-all appearance-none shadow-sm cursor-pointer"
                    >
                      <option value="2024-2025-HK1">Năm học 2024-2025, Học kỳ 1</option>
                      <option value="2024-2025-HK2">Năm học 2024-2025, Học kỳ 2</option>
                      <option value="2024-2025-HK3">Năm học 2024-2025, Học kỳ Hè</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                       <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">Dữ liệu mặc định sẽ được lọc theo học kỳ này.</p>
               </div>
            </div>
          </div>
        </section>

        {/* System Control */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200">
           <div className="p-6 border-b border-slate-100">
             <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                  <Server size={20} />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Kiểm soát hệ thống</h3>
             </div>
             <p className="text-sm text-slate-500 ml-11">Quản lý quyền truy cập và các tính năng cốt lõi.</p>
          </div>

          <div className="p-8 space-y-6">
            <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:border-slate-200 transition-colors">
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Chế độ bảo trì</h4>
                <p className="text-xs text-slate-500 mt-1">Khi bật, chỉ Admin mới có thể truy cập hệ thống. Người dùng khác sẽ thấy trang bảo trì.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={maintenanceMode} onChange={() => setMaintenanceMode(!maintenanceMode)} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#dd7323]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:border-slate-200 transition-colors">
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Cho phép đăng ký học phần</h4>
                <p className="text-xs text-slate-500 mt-1">Sinh viên có thể tự do đăng ký hoặc hủy học phần trong thời gian này.</p>
              </div>
               <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={allowRegistration} onChange={() => setAllowRegistration(!allowRegistration)} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
          </div>
        </section>

         {/* Advanced */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200">
             <div className="p-6 border-b border-slate-100 flex items-center gap-3">
               <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                <Bell size={20} />
               </div>
               <div>
                  <h3 className="font-bold text-slate-700">Thông báo Email (SES)</h3>
               </div>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">Cấu hình gửi email tự động từ hệ thống thông qua Amazon SES. Quản lý template cho các loại email: Reset Password, Thông báo lớp học...</p>
              <button className="text-sm font-bold text-[#dd7323] hover:text-orange-700 flex items-center gap-1 transition-colors">
                Quản lý mẫu Email <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </button>
            </div>
          </section>

           <section className="bg-white rounded-2xl shadow-sm border border-slate-200">
             <div className="p-6 border-b border-slate-100 flex items-center gap-3">
               <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <Database size={20} />
               </div>
               <div>
                 <h3 className="font-bold text-slate-700">Sao lưu dữ liệu</h3>
               </div>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                 <span className="text-sm text-slate-500">Lần sao lưu cuối</span>
                 <span className="text-sm font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">02:00 AM hôm nay</span>
              </div>
              <button className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2">
                <Database size={16} /> Sao lưu thủ công ngay
              </button>
            </div>
          </section>
        </div>

        <div className="flex justify-end pt-4 sticky bottom-4">
           <div className="bg-white/80 backdrop-blur-md p-2 rounded-2xl shadow-lg border border-slate-200 flex gap-3">
             <button className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-colors text-sm">
               Hủy thay đổi
             </button>
             <button className="flex items-center gap-2 px-6 py-2.5 bg-[#dd7323] text-white font-bold rounded-xl hover:bg-[#c2621a] transition-all shadow-md shadow-orange-200 text-sm">
               <Save size={18} />
               <span>Lưu cấu hình</span>
             </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
