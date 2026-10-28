import { type Request, type Response } from 'express'
import { prisma } from '../config/db.prisma.js'

const getHealth = async (
    _req: Request,
    res: Response,
): Promise<void> => {
    try{
        await prisma.$queryRaw`SELECT 1`;
        
        res.status(200).json({
            success: true,
            data:{
                status: 'ok',
                uptime: process.uptime(),
                db: 'ok',
            },
        })
    }catch(error){
        console.error("Health check database query failed:", error)

        res.status(503).json ({
            success: false,
            data: {
                status: 'ok',
                uptime: process.uptime(),
                db: 'unavailable',
            }
        })
    }
}

export { getHealth}