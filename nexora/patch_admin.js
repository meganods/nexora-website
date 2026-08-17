const fs = require('fs');
let content = fs.readFileSync('frontend/src/app/admin/dashboard/page.tsx', 'utf8');

// 1. Add MessageSquare to imports if not there
if (!content.includes('MessageSquare,')) {
  content = content.replace('LifeBuoy, Receipt', 'LifeBuoy, Receipt, MessageSquare');
}

// 2. Add state and fetch logic
const stateInsertionPoint = "const [adminTickets, setAdminTickets] = useState<any[]>([]);";
const newStates = `const [contactMessages, setContactMessages] = useState<any[]>([]);
  const fetchContactMessages = async () => {
    try {
      const { data } = await api.get('/admin/contact-messages');
      setContactMessages(data.messages || []);
    } catch (err) { console.error(err); }
  };
  useEffect(() => { if (activeTab === 'contact_messages') fetchContactMessages(); }, [activeTab]);

  const updateContactMessageStatus = async (id: string, status: string) => {
    try {
      await api.put(\`/admin/contact-messages/\${id}/status\`, { status });
      fetchContactMessages();
      toast.success('Status updated');
    } catch (err) { toast.error('Failed to update status'); }
  };
`;
if (!content.includes('contactMessages')) {
  content = content.replace(stateInsertionPoint, stateInsertionPoint + '\n  ' + newStates);
}

// 3. Add to TABS
const tabsInsertionPoint = "{ id: 'support_tickets',    label: 'Support Tickets',       icon: LifeBuoy },";
if (!content.includes("id: 'contact_messages'")) {
  content = content.replace(tabsInsertionPoint, tabsInsertionPoint + "\n    { id: 'contact_messages',   label: 'Contact Messages',      icon: MessageSquare },");
}

// 4. Add UI render block
const renderInsertionPoint = "{activeTab === 'support_tickets' && (";
const newRender = `{activeTab === 'contact_messages' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold font-serif text-primary">Contact Messages</h2>
            <div className="bg-white rounded-2xl shadow-sm border border-gold/20 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-cream/50 text-foreground/70 text-sm border-b border-gold/10">
                    <th className="p-4 font-medium">Date</th>
                    <th className="p-4 font-medium">Name</th>
                    <th className="p-4 font-medium">Email</th>
                    <th className="p-4 font-medium">Subject</th>
                    <th className="p-4 font-medium">Message</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gold/10 text-sm">
                  {contactMessages.map((msg: any) => (
                    <tr key={msg._id} className="hover:bg-cream/30 transition-colors">
                      <td className="p-4 text-foreground/70">{new Date(msg.createdAt).toLocaleDateString()}</td>
                      <td className="p-4 font-medium text-primary">{msg.name}</td>
                      <td className="p-4 text-foreground/70">{msg.email}</td>
                      <td className="p-4 text-foreground/70">{msg.subject}</td>
                      <td className="p-4 text-foreground/70 max-w-xs truncate" title={msg.message}>{msg.message}</td>
                      <td className="p-4">
                        <span className={\`px-2 py-1 rounded-full text-xs font-semibold \${msg.status === 'UNREAD' ? 'bg-red-100 text-red-700' : msg.status === 'REPLIED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}\`}>
                          {msg.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <select
                          value={msg.status}
                          onChange={(e) => updateContactMessageStatus(msg._id, e.target.value)}
                          className="border border-gold/30 rounded px-2 py-1 text-xs"
                        >
                          <option value="UNREAD">Unread</option>
                          <option value="READ">Read</option>
                          <option value="REPLIED">Replied</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                  {contactMessages.length === 0 && (
                    <tr><td colSpan={7} className="p-8 text-center text-foreground/50">No contact messages found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        `;
if (!content.includes("activeTab === 'contact_messages' && (")) {
  content = content.replace(renderInsertionPoint, newRender + renderInsertionPoint);
}

fs.writeFileSync('frontend/src/app/admin/dashboard/page.tsx', content);
