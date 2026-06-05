import express from 'express';
import dotenv from 'dotenv';
import router from './src/backend-core/routes/index';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Route Ingress Entrypoint - Developer 4 (Backend Core)
app.use('/api', router);

// Error Handling Middleware Boundary
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('EOC Server Error:', err.message);
  res.status(500).json({ error: 'Internal server error boundary' });
});

app.listen(PORT, () => {
  console.log(`PanicSense Foundation Server running on port ${PORT}`);
});
