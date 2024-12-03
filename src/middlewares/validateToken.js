import jwt from 'jsonwebtoken';
export const validateToken = (req, res , next) => {
    const token = req.cookies.token;
    if(!token) return res.status(401).json({success: false, message: 'Unathorized'});
    try{    
        const decoded = jwt.decode(token, process.env.TOKEN_SECRET);
        if(!decoded) return res.status(401).json({success: false, message: "Unauthorized - invalid token"});
        req.userId = decoded.id;
        next();
    }catch(error){
        return res.status(500).json({success : false, message : "Server error"})
    }
}