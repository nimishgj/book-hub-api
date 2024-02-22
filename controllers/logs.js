const fs = require('fs');
const logModel = require('../models/Log.model'); // Replace with the actual path to your ErrorModel file
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const Users = require("../models/User.model");

const { saveLog } = require("../middleware/logger/logger");
const { sendError,sendServerError } = require("../util/Responses");

exports.sendLogFile = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const user = await Users.findById({ _id: userId });
    const logs = await logModel.find({});

    if (logs.length === 0) {
      sendError(res, 'No Logs found');
    }

    const csvWriter = createCsvWriter({
      path: 'logs.csv',
      header: [
        { id: 'logInfo', title: 'logInformatio' },
        { id: 'filename', title: 'filename' },
        { id: 'createdAt', title: 'Date' },
        { id: 'type', title: 'type' },
        { id: 'level', title: 'level' },
        { id: 'context', title: 'context' },
      ],
    });

    saveLog(req,
      `${user.name} Downloaded the Log File`,
      'controllers/logs.js/sendLogFile',
      'api request',
      'info'
    );

    const logsWithAdditionalContext = logs.map(log => {
      const context = `IP: ${log.context.ip}, Country: ${log.context.country}, City: ${log.context.city}, Device Type: ${log.context.deviceType}, Browser: ${log.context.browser}, Platform: ${log.context.platform}, OS: ${log.context.os}, Device: ${log.context.device}`;
      return {
        logInfo: log.logInfo,
        filename: log.filename,
        createdAt: log.createdAt,
        type: log.type,
        level: log.level,
        context,
      };
    });

    csvWriter.writeRecords(logs)
  .then(() => {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=logs.csv');

    const fileStream = fs.createReadStream('logs.csv');
    fileStream.pipe(res);

    fileStream.on('end', () => {
      fs.unlinkSync('logs.csv');
    });
  })
  .catch((error) => {
    console.log(error);
    saveLog(req,
      'Error Occurred While Downloading the Log File',
      'controllers/logs.js/sendLogFile-creating CSV file',
      'api request',
      'error'
    );
        sendServerError(res);
      });
  } catch (error) {
    console.log(error);
    saveLog(req,
      'Error Occurred While Downloading the Log File',
      'controllers/logs.js/sendLogFile',
      'api request',
      'error'
    );
    sendServerError(res);
  }
};

exports.getRecentLogs = async (req, res) => {
  try {
    const userId=req.user._id.toString();


    const user=await Users.findById({_id:userId})

   
    

    const logs = await logModel.find({}).sort({ _id: -1 }).limit(10);
    if (logs.length === 0) {
      sendError(res,'No Logs found')
    }

    saveLog(req,`${user.name} Fetched Recent 10 Logs`,"controllers/logs.js/getRecentLogs","api request","info")

    res.status(200).json({success:true,logs});
  } catch (error) {
    saveLog(req,`Error Occured While Fetching Recent 10 Logs`,"controllers/logs.js/getRecentLogs","api request","error")
     sendServerError(res)
  }
};

