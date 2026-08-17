const fs = require('fs');
let content = fs.readFileSync('src/app/admin/dashboard/page.tsx', 'utf8');

// 1. Top Partners Fix
const topPartnersMockStr = `{[
                        { name: 'CleanPro Solutions', bookings: '320', rating: '4.8', earnings: '₹1,25,430' },
                        { name: 'HomeShine Services', bookings: '280', rating: '4.7', earnings: '₹95,760' },
                        { name: 'FixWell Experts', bookings: '260', rating: '4.6', earnings: '₹87,540' },
                        { name: 'QuickFix Support', bookings: '210', rating: '4.5', earnings: '₹68,320' },
                        { name: 'Zaika Home Services', bookings: '190', rating: '4.4', earnings: '₹55,980' }
                      ].map((p, idx) => (
                        <tr key={idx} className="hover:bg-cream/10">
                          <td className="py-3 font-medium text-foreground">{p.name}</td>
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

// 2. Recent Payouts Fix
const recentPayoutsMockStr = `{[
                        { name: 'CleanPro Solutions', date: '31 May 2024', amount: '₹25,000', status: 'Completed', color: 'bg-green-100 text-green-700' },
                        { name: 'HomeShine Services', date: '31 May 2024', amount: '₹18,750', status: 'Completed', color: 'bg-green-100 text-green-700' },
                        { name: 'FixWell Experts', date: '30 May 2024', amount: '₹15,500', status: 'Processing', color: 'bg-blue-100 text-blue-700' }
                      ].map((p, idx) => (
                        <tr key={idx} className="hover:bg-cream/10">
                          <td className="py-2.5 text-primary">{p.name}</td>
                          <td className="py-2.5 text-foreground/50">{p.date}</td>
                          <td className="py-2.5 font-bold text-foreground">{p.amount}</td>
                          <td className="py-2.5 text-right">
                            <span className={\`text-[9px] font-bold px-2 py-0.5 rounded-full \${p.color}\`}>{p.status}</span>
                          </td>
                        </tr>
                      ))}`;

const recentPayoutsRealStr = `{recentPayouts.length === 0 ? (
                        <tr><td colSpan={4} className="py-6 text-center text-foreground/45">No recent payouts.</td></tr>
                      ) : recentPayouts.map((p: any, idx) => (
                        <tr key={idx} className="hover:bg-cream/10">
                          <td className="py-2.5 text-primary">{p.vendorId?.businessName || 'Unknown'}</td>
                          <td className="py-2.5 text-foreground/50">{new Date(p.createdAt).toLocaleDateString()}</td>
                          <td className="py-2.5 font-bold text-foreground">₹{p.amount?.toLocaleString('en-IN') || 0}</td>
                          <td className="py-2.5 text-right">
                            <span className={\`text-[9px] font-bold px-2 py-0.5 rounded-full \${p.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}\`}>{p.status}</span>
                          </td>
                        </tr>
                      ))}`;

content = content.replace(recentPayoutsMockStr, recentPayoutsRealStr);

fs.writeFileSync('src/app/admin/dashboard/page.tsx', content);
