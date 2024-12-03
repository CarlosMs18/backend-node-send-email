import bcryptjs from 'bcryptjs';
import crypto from 'crypto';

import {User} from '../models/user.model.js';
import { createAccessToken } from '../libs/jwt.js';
import { setHeadersCookie } from '../libs/setHeadersCookie.js';

export const register = async(req, res) => {

    const {username, email , password} = req.body;
    console.log(username, email, password);
    try{
        const userFound = await User.findOne({email});
        if(userFound) return res.status(400).json({message: 'User already exists'});

        const passwordHash = await bcryptjs.hash(password, 10);
       

        const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
        
        const newUser = new User({
            username,
            email,
            password: passwordHash,
            verificationToken,
            verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000
        })

        const userSaved = await newUser.save();
        const token = await createAccessToken({id:userSaved._id});

        setHeadersCookie(res,token);

        //TODO: FALTARIA AGREGAR UN BOTON AL CORREO PARA DIRECCIONAR AL VERIFICADOD EL EMAIL

        res.status(201).json({
            id: userSaved._id,
            username : userSaved.username,
            email: userSaved.email,
            createdAt:userSaved.createdAt,
            updatedAt: userSaved.updatedAt
        })
        
    }catch(error){
        res.status(500).json({message: error.message})
    }
}

export const login = async(req, res) => {
    //TODO: AGREGAR VALIDACIION PARA EL EMAIL VERIFICADO
    const {email, password} =req.body;
    try{
        const user = await User.findOne({email});
        if(!user) return res.status(400).json({success: false, message: 'Invalid credentials'});

        const isPasswordMatch = await bcryptjs.compare(password, user.password);
        if(!isPasswordMatch) return res.status(400).json({success:'false', message:'Invalid credentials'});

        const token = await createAccessToken({id:user._id});
        setHeadersCookie(res,token);
        user.lastLogin = new Date();
        await user.save();

        res.json({
            id: user._id,
            username : user.username,
            email: user.email,
            createdAt:user.createdAt,
            updatedAt: user.updatedAt
        })

    }catch(error){
        res.status(400).json({success : false, message : error.message})
    }
}

export const verifyEmail = async(req, res) => {
    console.log(req.body)
    const {code} = req.body;
    console.log(code)
    try{
        if(!code) return res.status(400).json({success:'false',message:'Code no provider'});

        const user = await User.findOne({
            verificationToken : code,
            verificationTokenExpiresAt: {$gt:Date.now()}
        })

        if(!user) return res.status(400).json({success: false, message: 'Invalid or expired verification code'});

        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpiresAt = undefined;

        await user.save();  

        //TODO: FALTA EL CORREO DE BIENVENIDA QUE SE ENVIE UNA VEZ SE DE TODO OK EL CODIGO

        //TODO : VERIFICAR AL ENTRAR  ALA PAGINA  SI EL CORREO YA ESTA VERIDFICADO,
        // INSPECCIONAR ESO SI ES VIABLE O NO PEUSTO QUE ES UN NUMERO GENERADO LA COMPARACION Y HNO UN ID UNICO

        res.status(200).json({
            success: true,
            message: 'Email verified successfull',
            user : {
                ...user._doc,
                password: undefined
            }
        })
    }catch(error){
        res.status(500).json({success: false, message: 'Server Error'})
    }
}


export const forgottPassword = async(req, res) => {
    const {email} = req.body;

    try{
        const user = await User.findOne({email});
        if(!user) return res.status(400).json({success: false, message: 'User is not exist'});

        const resetToken = crypto.randomBytes(20).toString('hex');
        const resetTokenExpiresAt = Date.now() + 24 * 60 *60 * 1000;

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpiresAt = resetTokenExpiresAt;

        await user.save();

        //TODO: ENVIAR UN CORREO CON UN BOTON DE LINK UNIENDO URL DEL CLIENTE FRONT CON EL TOKEN

        res.status(200).json({succes: true,  message: 'Password reset link sent to your email'})
    }catch(error){
        res.status(500).json({success: false, message: 'Server Error'})
    }
}

export const resetPassword = async(req, res) => {
    try{
        const {token, email} = req.query;
        const {password} = req.body;

        if(!token || !email) return res.status(400).json({succes: false, message: 'Not parameters provider'});

        

        const user = await User.findOne({
            email,
            resetPasswordToken : token,
            resetPasswordExpiresAt : {$gt: Date.now()}
        })

        if(!user) return res.status(400).json({succes: 'false', message:'Invalid or expired token provider'});

        const hashPassword = await bcryptjs.hash(password, 10);
        user.password = hashPassword;
        user.resetPasswordExpiresAt = undefined;
        user.resetPasswordToken = undefined;

        await user.save();

        //TODO : ENVIAR CORREO DICIENDO QUE SE CAMBIO EL PASSWORD CON EXITO
        res.status(200).json({succes: true, message:'Password reset succesfull'})

    }catch(error){
        res.status(400).json({success: false, message: error.message})
    }
}


export const isCheckAuth = async(req, res) => {
    try{
        const user = await User.findById(req.userId).select('-password');
        if(!user){
            return res.status(400).json({success: false, message:'User not found'});
        }
        res.status(200).json({succes : true, user})
    }catch(error){
         res.status(500).json({success: false, message:'Server error'});
    }
}