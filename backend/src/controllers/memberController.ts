import {Request,Response} from "express";
import { asyncHandler } from "../middlewares/asyncHandler";
import { z } from "zod";
import { HTTPSTATUS } from "../config/http-config";
import { joinWorkspaceByInviteService } from "../services/memberService";


export const joinWorkspaceController = asyncHandler(
    async(req:Request,res:Response) =>{
        const inviteCode = z.string().parse(req.params.inviteCode);
        const userId = req.user?._id;

        const {workspaceId,role} = await joinWorkspaceByInviteService(
            userId,
            inviteCode
        )

        return res.status(HTTPSTATUS.OK).json({
            message: "Successfully joined the workspace",
            workspaceId,
            role,
        })
    }
)