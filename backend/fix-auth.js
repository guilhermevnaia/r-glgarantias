const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const port = 3010; // Porta diferente para não conflitar

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Rota de teste
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Rota de login
app.post('/api/v1/auth/login', async (req, res) => {
  try {
    console.log('🔐 Tentativa de login:', req.body.email);
    
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email e senha são obrigatórios'
      });
    }

    // Buscar usuário
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single();

    if (error || !user) {
      console.log('❌ Usuário não encontrado:', email);
      return res.status(401).json({
        success: false,
        error: 'Credenciais inválidas'
      });
    }

    // Verificar senha
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      console.log('❌ Senha incorreta para:', email);
      return res.status(401).json({
        success: false,
        error: 'Credenciais inválidas'
      });
    }

    // Gerar token compatível com o servidor principal
    const token = jwt.sign(
      { 
        userId: user.id,  // Mantém userId para compatibilidade
        userID: user.id,  // Adiciona userID como alternativa
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    console.log('✅ Login bem-sucedido:', email);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('❌ Erro no login:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Rota de teste de autenticação
app.post('/api/v1/test-auth', (req, res) => {
  res.json({
    success: true,
    message: 'Endpoint de teste funcionando',
    body: req.body
  });
});

// Iniciar servidor
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Servidor de autenticação rodando na porta ${port}`);
  console.log(`🔐 Login: http://localhost:${port}/api/v1/auth/login`);
  console.log(`🔍 Health: http://localhost:${port}/health`);
});

// Teste automático após 2 segundos
setTimeout(async () => {
  console.log('\n🧪 Testando login automaticamente...');
  
  const http = require('http');
  const postData = JSON.stringify({
    email: 'admin@glgarantias.com',
    password: 'Admin123'
  });

  const options = {
    hostname: 'localhost',
    port: port,
    path: '/api/v1/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Response:', data);
      if (res.statusCode === 200) {
        console.log('✅ AUTENTICAÇÃO FUNCIONANDO!');
        console.log('🔗 Use a URL: http://localhost:' + port + '/api/v1/auth/login');
      } else {
        console.log('❌ Problema na autenticação');
      }
    });
  });

  req.on('error', (e) => {
    console.error(`Erro na requisição: ${e.message}`);
  });

  req.write(postData);
  req.end();
}, 2000); 