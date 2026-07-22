'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, doc, updateDoc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function AdminOrdersPage() {
  const router = useRouter();
  const firestore = useFirestore();
  const activeDateRef = useRef<HTMLDivElement>(null);

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toLocaleString('default', { month: 'long' })
  );
  const [selectedDate, setSelectedDate] = useState<number>(new Date().getDate());
  // এই লাইনটি যোগ করুন
  const [filterMode, setFilterMode] = useState<'date' | 'week' | 'month'>('date');

  const ordersQuery = useMemo(() => (firestore ? collection(firestore, 'orders') : null), [firestore]);
  const { data: orders, loading } = useCollection<any>(ordersQuery);

  // 💡 ১. আজকের তারিখটি স্ক্রিনবারের একদম মাঝখানে (Center) নিয়ে আসার লজিক
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeDateRef.current) {
        activeDateRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [loading]); 

  // এই কোডটুকু দিয়ে আগের filteredOrders ব্লকটি প্রতিস্থাপন (Replace) করুন
const filteredOrders = useMemo(() => {
  if (!orders) return [];
  const now = new Date();
  
  return orders.filter((order: any) => {
    if (!order.orderDate) return false;
    const orderSeconds = order.orderDate.seconds || order.orderDate._seconds;
    if (!orderSeconds) return false;
    const date = new Date(orderSeconds * 1000);

    // This Month ফিল্টার
    if (filterMode === 'month') {
      return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
    }

    // This Week ফিল্টার (গত ৭ দিন)
    if (filterMode === 'week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      return date >= oneWeekAgo && date <= now;
    }

    // ডিফল্ট নির্দিষ্ট দিনের ফিল্টার
    const orderYear = date.getFullYear().toString();
    const orderMonth = date.toLocaleString('default', { month: 'long' });
    const orderDay = date.getDate();

    return (
      orderYear === selectedYear &&
      orderMonth === selectedMonth &&
      orderDay === selectedDate
    );
  });
}, [orders, selectedYear, selectedMonth, selectedDate, filterMode]);


  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    if (!firestore) return;
    try {
      const orderRef = doc(firestore, 'orders', orderId);
      await updateDoc(orderRef, { status: newStatus });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // এই ফাংশনে এখন আমরা শুধু booksData না দিয়ে পুরো order অবজেক্টটি পাঠাবো
const getBooksList = (order: any): any[] => {
  if (!order) return [];

  // ১. যদি ডাটাবেজে সঠিক নিয়মে 'books' ফিল্ড থাকে
  if (order.books) {
    if (Array.isArray(order.books)) return order.books;
    if (order.books.title || order.books.id) return [order.books];
    return Object.values(order.books).filter(
      (item: any) => typeof item === 'object' && item !== null
    );
  }
  
  // ২. আপনার ডাটাবেজের স্ক্রিনশট অনুযায়ী, বইয়ের ডাটা সরাসরি অর্ডারের মূল (Root) ফিল্ডে আছে
  if (order.title || order.id) {
    return [order]; // পুরো অর্ডারটিকেই একটি একক বইয়ের অবজেক্ট হিসেবে ধরে নেবে
  }
  
  return [];
};


  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const years = Array.from({ length: 5 }, (_, i) => (currentYear - 2 + i).toString());

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading orders...</div>;
  }

  return (
    
    <div className="p-6 max-w-6xl mx-auto bg-white min-h-screen text-black">
      {/* এই বাটনটি ঠিক এখানে পেস্ট করুন */}
    <Button 
      onClick={() => router.push('/dashboard/admin')} 
      variant="ghost" 
      size="sm" 
      className="text-gray-500 hover:text-black mb-4 flex items-center gap-2 p-0 bg-transparent hover:bg-transparent font-medium"
    >
      ← Back to Admin Panel
    </Button>
<div className="flex flex-wrap items-center justify-between gap-4 mb-6">
  
  {/* ড্রপডাউন দুটির জন্য ইনলাইন র্যাপার গ্রুপ */}
  <div className="flex gap-4">
    <Select value={selectedYear} onValueChange={(val) => { setSelectedYear(val); setFilterMode('date'); }}>
      <SelectTrigger className="w-[120px] bg-white border border-gray-200">
        <SelectValue placeholder="Year" />
      </SelectTrigger>
      <SelectContent className="bg-white border border-gray-200">
        {years.map((year) => (
          <SelectItem key={year} value={year}>{year}</SelectItem>
        ))}
      </SelectContent>
    </Select>

    <Select value={selectedMonth} onValueChange={(val) => { setSelectedMonth(val); setFilterMode('date'); }}>
      <SelectTrigger className="w-[120px] bg-white border border-gray-200">
        <SelectValue placeholder="Month" />
      </SelectTrigger>
      <SelectContent className="bg-white border border-gray-200">
        {months.map((month) => (
          <SelectItem key={month} value={month}>{month}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>

  {/* ৩ নম্বর ধাপের নতুন ফাংশনাল বাটন দুটি এখানে যুক্ত হলো */}
  <div className="flex gap-2">
    <Button
      type="button"
      variant={filterMode === 'week' ? 'default' : 'outline'}
      className={cn(
        "text-xs px-4 py-2 font-medium h-9 transition-all",
        filterMode === 'week' ? "bg-blue-600 text-white border-blue-600 shadow-sm" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
      )}
      onClick={() => setFilterMode('week')}
    >
      This Week
    </Button>
    <Button
      type="button"
      variant={filterMode === 'month' ? 'default' : 'outline'}
      className={cn(
        "text-xs px-4 py-2 font-medium h-9 transition-all",
        filterMode === 'month' ? "bg-blue-600 text-white border-blue-600 shadow-sm" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
      )}
      onClick={() => setFilterMode('month')}
    >
      This Month
    </Button>
  </div>
</div>


      {/* তারিখের অনুভূমিক স্লাইডার (Auto-Centers Today) */}
      <div className="mb-6">
        <div className="flex gap-2 overflow-x-auto pb-4 scroll-smooth">
          {[...Array(30)].map((_, i) => {
            const day = i + 1;
            const isToday = day === new Date().getDate();
            const isSelected = day === selectedDate;
            return (
              <div
                key={day}
                ref={isToday ? activeDateRef : null}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  "p-3 min-w-[44px] h-12 flex items-center justify-center border rounded-md cursor-pointer flex-shrink-0 transition-all",
                  isSelected 
                    ? "bg-blue-600 text-white font-bold border-blue-600 shadow-sm" 
                    : isToday 
                    ? "bg-blue-50 text-blue-600 font-bold border-blue-200" 
                    : "bg-white text-gray-700 hover:bg-gray-50"
                )}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>

      <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-black">📦 Books Orders</h2>

      <Accordion type="single" collapsible className="w-full space-y-3">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order: any) => (
            <AccordionItem key={order.id} value={order.id} className="border rounded-lg bg-white overflow-hidden shadow-sm border-gray-200">
              <AccordionTrigger className="hover:no-underline p-4 bg-gray-50/50">
                <div className="flex justify-between items-center w-full pr-4 text-left">
                  <div>
                    <p className="font-bold text-black text-base">User Name: {order.customerName || 'Unknown User'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">User ID: {order.userId || 'N/A'}</p>
                  </div>
                  <span className={cn(
                    "text-xs px-2.5 py-1 rounded-full font-semibold uppercase",
                    order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  )}>
                    {order.status || 'Paid'}
                  </span>
                </div>
              </AccordionTrigger>

              <AccordionContent className="pt-0 pb-4 px-4 border-t border-gray-100 bg-white">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* অর্ডার করা বইয়ের তালিকা */}
                 {/* অর্ডার করা বইয়ের তালিকা */}
                  <div className="mt-4 p-4 bg-gray-50 border border-dashed rounded-lg border-gray-300">
                    <p className="font-bold mb-3 text-left text-black text-sm">Order</p>
                    
                    {(() => {
                     const books = getBooksList(order);
                      
                      if (books.length > 0) {
                        return books.map((book: any, idx: number) => (
                          <div key={book.id || idx} className="mb-3 last:mb-0 text-left pl-2">
                            <p className="text-sm text-black">
                              <strong>{idx + 1}. Book:</strong>{' '}
                              <span className="font-medium text-gray-800">
                                {book.title || 'Unknown Book'}
                              </span>
                            </p>
                            <p className="text-sm text-gray-600 mt-0.5 pl-5">
                              <strong>Quantity:</strong>{' '}
                              <span className="font-medium text-gray-800">
                                {book.quantity || 1}
                              </span>
                            </p>
                          </div>
                        ));
                      }
                      
                      return (
                        <div className="text-sm text-gray-500 italic text-left">
                          No items in this order.
                        </div>
                      );
                    })()}
                  </div>


                  {/* delivery voucher */}
                  <div className="mt-4 bg-gray-50 p-4 rounded border border-dashed border-gray-300 text-left">
                    <p className="font-bold mb-3 text-xs tracking-wider text-gray-500 uppercase">DELIVERY VOUCHER</p>
                    <div className="text-sm space-y-2 text-black">
                      <p><strong>Name:</strong> {order.customerName || 'N/A'}</p>
                      <p><strong>Address:</strong> {order.deliveryAddress || 'No Address Provided'}</p>
                      <p className="pt-2 border-t border-dashed border-gray-300 mt-1">
                        <strong>Mobile:</strong> {order.mobileNumber || 'N/A'}
                      </p>
                    </div>
                  </div>

                </div>

                {/* status buttons */}
                <div className="mt-5 pt-4 border-t border-gray-100 flex gap-2 justify-start items-center">
                  <p className="text-sm font-semibold mr-2 text-black">Update Status</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className={cn("text-xs", order.status === 'Shipped' && "bg-purple-50 border-purple-200 text-purple-700")}
                    onClick={() => handleUpdateStatus(order.id, 'Shipped')}
                  >
                    🚚 Shipped
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className={cn("text-xs", order.status === 'Delivered' && "bg-green-50 border-green-200 text-green-700")}
                    onClick={() => handleUpdateStatus(order.id, 'Delivered')}
                  >
                    ✅ Delivered
                  </Button>
                </div>
                        </AccordionContent>
        </AccordionItem>
          ))
        ) : (
          <p className="text-center text-gray-400 py-8 italic">
            No orders on this specific date.
          </p>
        )}
      </Accordion>
    </div>
  );
}
