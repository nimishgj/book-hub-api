exports.sendError=(res,error,status=300)=>{
    res.status(status)
    res.json({success:false,message:error})
}

exports.sendInvalidParameterResponse=(res)=>{
    res.status(400)
    res.json({success:false,error:"Invalid Request,Missing Parameters"})
}


exports.sendServerError=(res)=>{
    res.status(500)
    res.json({success:false,error:"Internal Server Error"})
}