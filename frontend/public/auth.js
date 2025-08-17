// Script para login automático durante desenvolvimento
(function() {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjYsImVtYWlsIjoiYWRtaW5AdGVzdC5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTQ5MTMwNDAsImV4cCI6MTc1NDk5OTQ0MH0.AJ6Yx9kcaYXFVzhlTdJhc8mUfTFZpY9uYQhfQlm3y7Q';
  const user = {
    id: 6,
    email: 'admin@test.com',
    name: 'Admin Teste',
    role: 'admin'
  };
  
  localStorage.setItem('auth-token', token);
  localStorage.setItem('user', JSON.stringify(user));
  
  console.log('🔑 Token de desenvolvimento configurado automaticamente');
  console.log('📧 Usuário: admin@test.com');
  
  // Recarregar a página após configurar o token
  if (!window.location.hash.includes('token-configured')) {
    window.location.hash = 'token-configured';
    window.location.reload();
  }
})();