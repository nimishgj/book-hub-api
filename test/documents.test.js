const { getDocumentsByOwner,getDocumentsBySubject } = require("../controllers/documents");
const { sendInvalidParameterResponse, sendServerError } = require("../util/Responses");
const docs = require("../models/Document.model");
const Users = require("../models/User.model");


// Mocking the logger module
jest.mock("../middleware/logger/logger", () => ({
  saveLog: jest.fn(),
}));

describe('Testing Getting Documents By Uploader', () => {
  let originalFind;
  
  beforeEach(() => {
    originalFind = docs.find;
    docs.find = jest.fn();
  });

  afterEach(() => {
    docs.find = originalFind;
  });

  it('Should return a list of documents when valid ownerId is provided', async () => {
    // Arrange
    let req = { params: { ownerId: "1234567890" }, user: { name: "asd", _id: "dfdsf" } };
    const res = {
      status: jest.fn(() => res),
      json: jest.fn()
    };

    // Mocking the Users.findById function
    Users.findById = jest.fn((id) => {
      if (id === "dfdsf") {
        return {
          id: "dfdsf",
          name: "asd",
          documents: [
            { id: "doc1", name: "Document 1" },
            { id: "doc2", name: "Document 2" },
          ],
        };
      } else {
        return null;
      }
    });

    // Act
    await getDocumentsByOwner(req, res);

    // Assert
    expect(Users.findById).toHaveBeenCalledWith("dfdsf");
    expect(require("../middleware/logger/logger").saveLog).toHaveBeenCalledWith(
      req,
      `asd Fetched All the Documents By OwnerId 1234567890`,
      "controllers/documents.js/getDocumentsByOwner",
      "api request",
      "info"
    );
    expect(res.json).toHaveBeenCalledWith({ "documents": [], "success": true });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("send invalid parameters response", async () => {
     // Arrange
    const req = {
      params: {},
      user: {},
    };
    const res = {
      status: jest.fn(() => res),
      json: jest.fn()
    };

    // Act
    await getDocumentsByOwner(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: "Invalid Request,Missing Parameters" });
  
  });

  it("send server error response", async () => {
    docs.find = jest.fn();
        docs.find.mockImplementation(() => {
        throw new Error('Error fetching documents');
       });
        const req={
            params:{
                ownerId:"123"
            },
            user:{_id:"dfdsf",name:"asd"}
        }
        const res={
            status:jest.fn(()=>res),
            json:jest.fn()
        }
        await getDocumentsByOwner(req,res)
        expect(require("../middleware/logger/logger").saveLog).toHaveBeenCalledWith(
            req,
            `Error Occured While Fetching All the Documents from user dfdsf`,
            "controllers/documents.js/getDocumentsByOwner",
            "api request",
            "error"
        );
        expect(res.status).toHaveBeenCalledWith(500)
        expect(res.json).toHaveBeenCalledWith({success:false,error:"Internal Server Error"})
    
  });
});


describe('Testing Getting Documents by Subject',()=>{
    let originalFind;
  
  beforeEach(() => {
    originalFind = docs.find;
    
  });

  afterEach(() => {
    docs.find = originalFind;
  });

  it("Should return a list of documents when valid ownerId and subject is provided'", async () => {
    let req = { params: { ownerId: "1234567890", subject: "english" }, user: { name: "asd", _id: "dfdsf" } };
    const res = {
      status: jest.fn(() => res),
      json: jest.fn()
    };

    docs.find = jest.fn((subject)=>{
            return []
        
    });

    // Mocking the Users.findById function
    Users.findById = jest.fn((id) => {
      if (id === "dfdsf") {
        return {
          id: "dfdsf",
          name: "asd",
          documents: [
            { id: "doc1", name: "Document 1" },
            { id: "doc2", name: "Document 2" },
          ],
        };
      } else {
        return null;
      }
    });

     await getDocumentsBySubject(req,res)

    console.log(req)

    expect(require("../middleware/logger/logger").saveLog).toHaveBeenCalledWith(
        req,
        `asd Fetched All the Documents By Subject english`,
        "controllers/documents.js/getDocumentsBySubject",
        "api request",
        "info"
    );
    expect(res.status).toHaveBeenCalledWith(200)

    expect(res.json).toHaveBeenCalledWith({ "documents": [], "success": true });

  });

  it("Sending Invalid Subject and Recieving an Error",async()=>{
    let req = { params: { ownerId: "1234567890", subject: "english" }, user: { name: "asd", _id: "dfdsf" } };
    const res = {
      status: jest.fn(() => res),
      json: jest.fn()
    };

    docs.find = jest.fn((subject)=>{
        return null
    
});

    // Mocking the Users.findById function
    Users.findById = jest.fn((id) => {
      if (id === "dfdsf") {
        return {
          id: "dfdsf",
          name: "asd",
          documents: [
            { id: "doc1", name: "Document 1" },
            { id: "doc2", name: "Document 2" },
          ],
        };
      } else {
        return null;
      }
    });

    await getDocumentsBySubject(req,res)

    expect(res.status).toHaveBeenCalledWith(300)
    expect(res.json).toHaveBeenCalledWith({success:false,message:"Invalid Subject Selected"})
  })

})


describe("Testing getting Documents by Scheme",()=>{
  let originalFind;
  
  beforeEach(() => {
    originalFind = docs.find;
    
  });

  afterEach(() => {
    docs.find = originalFind;
  });

})