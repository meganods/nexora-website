const fs = require('fs');
let content = fs.readFileSync('src/app/admin/dashboard/page.tsx', 'utf8');

// 1. Recent Bookings
const recentBookingsMock = `{[
                        { id: '#BKB492', customer: 'Rahul Sharma', service: 'Home Cleaning', status: 'Confirmed', amount: '₹1,299', statusColor: 'bg-green-100 text-green-700' },
                        { id: '#BKB491', customer: 'Priya Patel', service: 'AC Repair', status: 'Pending', amount: '₹899', statusColor: 'bg-amber-100 text-amber-700' },
                        { id: '#BKB490', customer: 'Amit Verma', service: 'Salon at Home', status: 'Confirmed', amount: '₹1,199', statusColor: 'bg-green-100 text-green-700' },
                        { id: '#BKB489', customer: 'Neha Singh', service: 'Pest Control', status: 'Completed', amount: '₹999', statusColor: 'bg-emerald-100 text-emerald-700' },
                        { id: '#BKB488', customer: 'Vikram Joshi', service: 'Bathroom Cleaning', status: 'Confirmed', amount: '₹1,499', statusColor: 'bg-green-100 text-green-700' }
                      ].map((b, idx) => (
                        <tr key={idx} className="hover:bg-cream/10">
                          <td className="py-3 text-primary">{b.id}</td>
                          <td className="py-3">{b.customer}</td>
                          <td className="py-3 font-medium text-foreground">{b.service}</td>
                          <td className="py-3">
                            <span className={\`text-[9px] font-bold px-2 py-0.5 rounded-full \${b.statusColor}\`}>{b.status}</span>
                          </td>
                          <td className="py-3 text-right text-primary font-bold">{b.amount}</td>
                        </tr>
                      ))}`;

const recentBookingsReal = `{recentBookings.length === 0 ? (
                        <tr><td colSpan={5} className="py-6 text-center text-foreground/45">No bookings yet.</td></tr>
                      ) : recentBookings.map((b: any) => (
                        <tr key={b._id} className="hover:bg-cream/10">
                          <td className="py-3 text-primary">#{b._id.slice(-6).toUpperCase()}</td>
                          <td className="py-3">{b.userId?.name || 'Unknown'}</td>
                          <td className="py-3 font-medium text-foreground">{b.serviceId?.name || 'Unknown Service'}</td>
                          <td className="py-3">
                            <span className={\`text-[9px] font-bold px-2 py-0.5 rounded-full \${b.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : b.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}\`}>{b.status}</span>
                          </td>
                          <td className="py-3 text-right text-primary font-bold">₹{b.paymentDetails?.amount || 0}</td>
                        </tr>
                      ))}`;
content = content.replace(recentBookingsMock, recentBookingsReal);

// 2. Pending Approvals
const pendingMockStr = `                  const allPending = [
                    { id: 'Rohit Services', type: 'Service Partner', name: 'Rohit Services', date: '31 May 2024' },
                    { id: 'CleanPro Solutions', type: 'Service Partner', name: 'CleanPro Solutions', date: '31 May 2024' },
                    { id: 'Deep Cleaning', type: 'Service', name: 'Deep Cleaning', date: '30 May 2024' },
                    { id: 'Sofa Cleaning', type: 'Service', name: 'Sofa Cleaning', date: '30 May 2024' },
                    { id: 'Summer Special Offer', type: 'Deal', name: 'Summer Special Offer', date: '30 May 2024' }
                  ];
                  const visible = allPending.filter(p => !approvedItems.includes(p.id));`;

const pendingRealStr = `                  const visible = pendingVendors.filter(p => !approvedItems.includes(p._id)).slice(0, 5);`;
content = content.replace(pendingMockStr, pendingRealStr);

const pendingTableMock = `{visible.map((p) => (
                            <tr key={p.id} className="hover:bg-cream/10 transition-colors">
                              <td className="py-2.5">
                                <span className={\`text-[9px] font-bold px-2 py-0.5 rounded-full \${p.type === 'Service Partner' ? 'bg-purple-100 text-purple-700' : p.type === 'Service' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}\`}>{p.type}</span>
                              </td>
                              <td className="py-2.5 text-primary">{p.name}</td>
                              <td className="py-2.5 text-foreground/50">{p.date}</td>
                              <td className="py-2.5 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => setApprovedItems(prev => [...prev, p.id])}
                                    className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-[9px] font-bold transition-all active:scale-95"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => setApprovedItems(prev => [...prev, p.id])}
                                    className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-[9px] font-bold transition-all active:scale-95"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}`;
const pendingTableReal = `{visible.map((p: any) => (
                            <tr key={p._id} className="hover:bg-cream/10 transition-colors">
                              <td className="py-2.5">
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">Service Partner</span>
                              </td>
                              <td className="py-2.5 text-primary">{p.businessName || p.userId?.name}</td>
                              <td className="py-2.5 text-foreground/50">{new Date(p.createdAt).toLocaleDateString()}</td>
                              <td className="py-2.5 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleVerify(p._id, 'verify')}
                                    className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-[9px] font-bold transition-all active:scale-95"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleVerify(p._id, 'reject')}
                                    className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-[9px] font-bold transition-all active:scale-95"
                                  >
                                    Reject
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}`;
content = content.replace(pendingTableMock, pendingTableReal);

// 3. Recent Activity
const activityMockStr = `{[
                    { text: "New service partner \\"Rohit Services\\" registered", time: "5 mins ago", color: "text-green-600 bg-green-50" },
                    { text: "Booking #BKB492 confirmed by partner", time: "15 mins ago", color: "text-blue-600 bg-blue-50" },
                    { text: "Payment of ₹1,299 received for booking #BKB487", time: "1 hour ago", color: "text-amber-600 bg-amber-50" },
                    { text: "Service \\"Deep Cleaning\\" submitted for approval", time: "2 hours ago", color: "text-purple-600 bg-purple-50" },
                    { text: "New deal \\"Summer Special Offer\\" created", time: "3 hours ago", color: "text-pink-600 bg-pink-50" }
                  ].map((act, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className={\`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 \${act.color.split(' ')[0]}\`} style={{ backgroundColor: 'currentColor' }} />
                      <div className="min-w-0 flex-grow">
                        <p className="text-foreground/80 leading-normal">{act.text}</p>
                        <span className="text-[10px] text-foreground/45 font-medium block mt-0.5">{act.time}</span>
                      </div>
                    </div>
                  ))}`;
const activityRealStr = `{recentActivity.length === 0 ? (
                    <div className="py-6 text-center text-foreground/45">No recent activity.</div>
                  ) : recentActivity.map((act: any, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 text-primary bg-primary/20" style={{ backgroundColor: 'currentColor' }} />
                      <div className="min-w-0 flex-grow">
                        <p className="text-foreground/80 leading-normal">{act.body || act.title}</p>
                        <span className="text-[10px] text-foreground/45 font-medium block mt-0.5">{new Date(act.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}`;
content = content.replace(activityMockStr, activityRealStr);

// 4. Top Partners
const topPartnersMockStr = `{[
                        { partner: 'CleanPro Solutions', bookings: 320, rating: 4.8, earnings: '₹1,25,430' },
                        { partner: 'HomeShine Services', bookings: 280, rating: 4.7, earnings: '₹95,760' },
                        { partner: 'FixWell Experts', bookings: 260, rating: 4.6, earnings: '₹87,540' },
                        { partner: 'QuickFix Support', bookings: 210, rating: 4.5, earnings: '₹68,320' },
                        { partner: 'Zaika Home Services', bookings: 190, rating: 4.4, earnings: '₹55,980' }
                      ].map((p, idx) => (
                        <tr key={idx} className="hover:bg-cream/10">
                          <td className="py-3 font-medium text-foreground">{p.partner}</td>
                          <td className="py-3">{p.bookings}</td>
                          <td className="py-3">
                            <span className="flex items-center gap-1 text-amber-500 font-bold">
                              <Star className="w-3 h-3 fill-current" />
                              {p.rating}
                            </span>
                          </td>
                          <td className="py-3 text-right text-primary font-bold">{p.earnings}</td>
                        </tr>
                      ))}`;
const topPartnersRealStr = `{topPartnersList.length === 0 ? (
                        <tr><td colSpan={4} className="py-6 text-center text-foreground/45">No service partners yet.</td></tr>
                      ) : topPartnersList.map((p: any, idx) => (
                        <tr key={idx} className="hover:bg-cream/10">
                          <td className="py-3 font-medium text-foreground">{p.businessName}</td>
                          <td className="py-3">{p.totalBookings || 0}</td>
                          <td className="py-3">
                            <span className="flex items-center gap-1 text-amber-500 font-bold">
                              <Star className="w-3 h-3 fill-current" />
                              {p.rating || 'N/A'}
                            </span>
                          </td>
                          <td className="py-3 text-right text-primary font-bold">₹{p.totalEarnings || 0}</td>
                        </tr>
                      ))}`;
content = content.replace(topPartnersMockStr, topPartnersRealStr);

// 5. Wallet & Payout
const walletCardsMock = `<div className="bg-cream/30 border border-gold/15 rounded-2xl p-4 text-center">
                      <p className="text-[9px] font-bold text-foreground/50 uppercase tracking-wider mb-1.5">Total Payouts</p>
                      <p className="text-lg font-serif font-bold text-primary">₹8,75,430</p>
                    </div>
                    <div className="bg-cream/30 border border-gold/15 rounded-2xl p-4 text-center">
                      <p className="text-[9px] font-bold text-foreground/50 uppercase tracking-wider mb-1.5">Pending Payouts</p>
                      <p className="text-lg font-serif font-bold text-amber-600">₹1,24,680</p>
                    </div>
                    <div className="bg-cream/30 border border-gold/15 rounded-2xl p-4 text-center">
                      <p className="text-[9px] font-bold text-foreground/50 uppercase tracking-wider mb-1.5">Available Bal</p>
                      <p className="text-lg font-serif font-bold text-emerald-600">₹62,750</p>
                    </div>`;
const walletCardsReal = `<div className="bg-cream/30 border border-gold/15 rounded-2xl p-4 text-center">
                      <p className="text-[9px] font-bold text-foreground/50 uppercase tracking-wider mb-1.5">Total Payouts</p>
                      <p className="text-lg font-serif font-bold text-primary">₹{(walletPayoutOverview.totalPayouts || 0).toLocaleString('en-IN')}</p>
                    </div>
                    <div className="bg-cream/30 border border-gold/15 rounded-2xl p-4 text-center">
                      <p className="text-[9px] font-bold text-foreground/50 uppercase tracking-wider mb-1.5">Pending Payouts</p>
                      <p className="text-lg font-serif font-bold text-amber-600">₹{(walletPayoutOverview.pendingPayouts || 0).toLocaleString('en-IN')}</p>
                    </div>
                    <div className="bg-cream/30 border border-gold/15 rounded-2xl p-4 text-center">
                      <p className="text-[9px] font-bold text-foreground/50 uppercase tracking-wider mb-1.5">Available Bal</p>
                      <p className="text-lg font-serif font-bold text-emerald-600">₹{(walletPayoutOverview.availableBalance || 0).toLocaleString('en-IN')}</p>
                    </div>`;
content = content.replace(walletCardsMock, walletCardsReal);

const recentPayoutsMock = `{[
                        { partner: 'CleanPro Solutions', date: '31 May 2024', amount: '₹25,000', status: 'Completed', statusColor: 'bg-green-100 text-green-700' },
                        { partner: 'HomeShine Services', date: '31 May 2024', amount: '₹18,750', status: 'Completed', statusColor: 'bg-green-100 text-green-700' },
                        { partner: 'FixWell Experts', date: '30 May 2024', amount: '₹15,500', status: 'Processing', statusColor: 'bg-blue-100 text-blue-700' }
                      ].map((p, idx) => (
                        <tr key={idx} className="hover:bg-cream/10">
                          <td className="py-3 font-medium text-foreground">{p.partner}</td>
                          <td className="py-3 text-foreground/50">{p.date}</td>
                          <td className="py-3 text-primary font-bold">{p.amount}</td>
                          <td className="py-3 text-right">
                            <span className={\`text-[9px] font-bold px-2 py-0.5 rounded-full \${p.statusColor}\`}>{p.status}</span>
                          </td>
                        </tr>
                      ))}`;
const recentPayoutsReal = `{recentPayouts.length === 0 ? (
                        <tr><td colSpan={4} className="py-6 text-center text-foreground/45">No recent payouts.</td></tr>
                      ) : recentPayouts.map((p: any, idx) => (
                        <tr key={idx} className="hover:bg-cream/10">
                          <td className="py-3 font-medium text-foreground">{p.vendorId?.businessName || 'Unknown'}</td>
                          <td className="py-3 text-foreground/50">{new Date(p.createdAt).toLocaleDateString()}</td>
                          <td className="py-3 text-primary font-bold">₹{p.amount?.toLocaleString('en-IN') || 0}</td>
                          <td className="py-3 text-right">
                            <span className={\`text-[9px] font-bold px-2 py-0.5 rounded-full \${p.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}\`}>{p.status}</span>
                          </td>
                        </tr>
                      ))}`;
content = content.replace(recentPayoutsMock, recentPayoutsReal);

fs.writeFileSync('src/app/admin/dashboard/page.tsx', content);
