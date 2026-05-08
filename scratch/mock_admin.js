// Run this in the browser console to simulate an admin session
const mockUser = {
  uid: 'admin-test-001',
  displayName: 'Admin QA',
  email: 'admin@expertclub.com',
  role: 'admin',
  subscriptionStatus: 'active'
};
localStorage.setItem('expert_club_user', JSON.stringify(mockUser));
window.location.href = '/admin/dashboard';
