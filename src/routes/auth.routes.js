import { Router  } from 'express';
import { login, register, verifyEmail, forgottPassword, resetPassword, isCheckAuth } from '../controllers/auth.controller.js';
import { validateToken } from '../middlewares/validateToken.js';
import { validateSchema } from '../middlewares/validator-schema.middleware.js';
import { loginSchema, registerSchema } from '../schemas/auth.schema.js';

const router = Router();

router.post('/register', validateSchema(registerSchema) ,register);

router.post('/login',validateSchema(loginSchema) ,login);

router.post('/verify-email',verifyEmail)

router.post('/forgott-password', forgottPassword)

router.post('/reset-password',resetPassword)

router.get('/check-auth',validateToken, isCheckAuth)
export default router;