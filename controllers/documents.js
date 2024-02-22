
const { saveLog } = require("../middleware/logger/logger");
const { sendError, sendInvalidParameterResponse, sendServerError } = require("../util/Responses");
const  docs  = require("../models/Document.model");
const Users = require("../models/User.model");

const { deleteFile, getObjectSignedUrl, uploadFile } = require("../util/aws/s3");
const crypto = require('crypto');
const { checkScheme } = require("./schemes");

const generateFileName = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

exports.getDocumentsByOwner = async (req, res) => {
  let userId;
  let ownerId;
  try {
    if (!(ownerId = req.params.ownerId) || !(userId = req.user._id.toString())) return sendInvalidParameterResponse(res);

    const user = await Users.findById(req.user._id)

    // TODO unhash the sorting in production

    let documents = await docs.find({ owner: user.name }) //.sort({ created: -1 }).exec();

    // Ensure that documents is always defined, even if it's an empty array
    documents = documents || [];

    await saveLog(req, `${user.name} Fetched All the Documents By OwnerId ${ownerId}`, "controllers/documents.js/getDocumentsByOwner", "api request", "info")

    res.status(200)
    res.json({ success: true, documents });
  } catch (error) {
    console.log(error)
    saveLog(req, `Error Occured While Fetching All the Documents from user ${userId}`, "controllers/documents.js/getDocumentsByOwner", "api request", "error");
    sendServerError(res);
  }
}

exports.getDocumentsByScheme=async(req,res)=>{
  try {
    const { scheme} = req.params;
    const userId=req.user._id.toString();

    if (!userId ||!scheme) return sendInvalidParameterResponse(res);

    const user = await Users.findById(userId)


    let documents = await docs.find({scheme}).sort({ created: -1 }).exec();

    if(!documents) return sendError(res,"Invalid Scheme Selected")


    await saveLog(req, `${user.name} Fetched All the Documents By Scheme ${scheme}`, "controllers/documents.js/getDocumentsByScheme", "api request", "info")

    res.status(200).json({success:true,documents});
  } catch (error) {
    saveLog(req, `Error Occured While Fetching All the Documents By Scheme ${scheme}`, "controllers/documents.js/getDocumentsByScheme", "api request", "error");
    sendServerError(res);
  }

}

exports.getDocumentsBySubject=async(req,res)=>{
  try {
    const { subject } = req.params;
    const userId=req.user._id.toString();

    if (!userId ||!subject) return sendInvalidParameterResponse(res);


    const user = await Users.findById(userId)

    let documents = await docs.find({subject})//.sort({ created: -1 }).exec();

    if(!documents) return sendError(res,"Invalid Subject Selected")

    await saveLog(req, `${user.name} Fetched All the Documents By Subject ${subject}`, "controllers/documents.js/getDocumentsBySubject", "api request", "info")
    
    res.status(200)
    res.json({success:true,documents});
  } catch (error) {
    saveLog(req, `Error Occured While Fetching All the Documents By Subject ${subject}`, "controllers/documents.js/getDocumentsBySubject", "api request", "error");
    sendServerError(res);
  }
}

exports.getDocuments = async (req, res) => {
  try {
    const userId  = req.user._id.toString();

    const user = await Users.findById(userId);
    
    let documents = await docs.find().sort({ created: -1 }).exec();

    if (!documents) return sendError(res, "No Documents found");

    await saveLog(req, `${user.name} Fetched All the Documents`, "controllers/documents.js/getDocuments", "api request", "info");
    res.status(200).json({ success: true, documents });
  } catch (error) {
    console.log(error)
    saveLog(req, `Error Occured While Fetching All the Documents`, "controllers/documents.js/getDocuments", "api request", "error");
    sendServerError(res);
  }
};


exports.uploadDocument=async(req,res)=>{
    const file = req.file
        const fileName = generateFileName()
        const fileBuffer =file.buffer
        const name= req.body.name
        const scheme=req.body.scheme
        const subject=req.body.subject
        const userId=req.user._id.toString()
    try {
        
        
        if(!name || !subject || !scheme || !userId ) return sendInvalidParameterResponse(res)

       
        
        const user=await Users.findById(userId)

        const isSchemeValid = await checkScheme(scheme,subject)
      
        if(!isSchemeValid){
          return sendError(res,"Invalid Scheme or Subject Provided")
        }

        const existingDocument = await docs.findOne({ name: name });
        if (existingDocument) {
          return sendError(res, "File with the Same Name Exists");
        }

        

        

        const document=new docs({
            name,
            filename:fileName,
            owner:user.name,
            subject,
            scheme
        })

        await uploadFile(fileBuffer, fileName, file.mimetype)

        await document.save()

        saveLog(req, `${user.name} Uploaded Document ${document.name} `, "controllers/documents.js/uploadDocument", "api request", "info");
        
        res.status(200).json({success:true,message:"Document Uploaded Successfully"})
    } catch (error) {
      console.log(error)
        saveLog(req, `Error Occured While Uploading Document`, "controllers/documents.js/uploadDocument", "api request", "error");
        sendServerError(res)
    }
}

exports.downloadDocument=async (req, res) => {
    const {documentName}=req.params;
    const userId=req.user._id.toString()
  
    try {
      if(!documentName || !userId) return sendInvalidParameterResponse(res)


      const user=await Users.findById(userId)

      saveLog(req, `${user.name} Downloaded Document ${documentName} `, "controllers/documents.js/downloadDocument", "api request", "info");

      const downloadUrl = await getObjectSignedUrl(documentName);
      res.header('Content-Disposition', 'attachment; filename="downloaded.csv"'); // Set the download filename
      res.redirect(downloadUrl); // Redirect to the signed URL for download
    } catch (error) {
      saveLog(req, `Error Occured While Downloading Document ${documentName}`, "controllers/documents.js/downloadDocument", "api request", "error");
      sendServerError(res)
    } 
};

exports.deleteDocument=async(req,res)=>{
  try {
    const {fileName}=req.params;
    const userId=req.user._id.toString()
    if(!userId || !fileName) return sendInvalidParameterResponse(res)

    const user=await Users.findById(userId)
    
    await deleteFile(fileName);
    await docs.findOneAndDelete({filename:fileName})

    saveLog(req, `${user.name} Deleted Document ${fileName} `, "controllers/documents.js/deleteDocument", "api request", "info");
    res.status(200).json({success:true,message:"File Deleted Successfully"})
  } catch (error) {
    saveLog(req, `Error Occured While Deleting Document ${fileName}`, "controllers/documents.js/deleteDocument", "api request", "error");
    sendServerError(res)
  }

}

exports.deleteDocumentByUserName=async(userName)=>{
  try {

    await docs.deleteMany({owner:userName})
    saveLog(req, `Deleted All Documents of User ${userName}`, "controllers/documents.js/deleteDocumentByUserName", "api request", "info");
    return true;
  } catch (error) {
    saveLog(req, `Error Occured While Deleting All Documents of User ${userName}`, "controllers/documents.js/deleteDocumentByUserName", "api request", "error");
    return false
  }
}