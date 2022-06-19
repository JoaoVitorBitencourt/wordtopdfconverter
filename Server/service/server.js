var PROTO_PATH = __dirname + '/../protos/convertwordtopdf.proto';

var fs = require("fs");
var grpc = require('@grpc/grpc-js');
var protoLoader = require('@grpc/proto-loader');
var packageDefinition = protoLoader.loadSync(
    PROTO_PATH,
    {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true
    });
 var ConvertDoc = grpc.loadPackageDefinition(packageDefinition).ConvertDoc;

var docxConverter = require('docx-pdf');
const { v4 } = require("uuid");

function pathToPdf(call) {
    let fileName = v4();

    call.on("data", async ({ chunk }) => {
        if(chunk) {
            fs.appendFileSync(`${__dirname}/../tmp/${fileName}.docx`, chunk);
        } 
    });

    call.on("end", async () => {
        await docxConverter(`${__dirname}/../tmp/${fileName}.docx`, `${__dirname}/../tmp/${fileName}.pdf`, (err, result) => {
            if(err) console.log(err);
            
            const readStream = fs.createReadStream(`${__dirname}/../tmp/${fileName}.pdf`);
            readStream
                .on("data", chunk => call.write({chunk}))
                .on("end", () => call.end());
            fileName = v4();
        });
    });
}

function main() {
    const dir = `${__dirname}/../tmp/`;

    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }
    
    var server = new grpc.Server();
    server.addService(ConvertDoc.ConvertDocxToPdfService.service, { ConvertDocxToPdf: pathToPdf });
    server.bindAsync('0.0.0.0:50051', grpc.ServerCredentials.createInsecure(), () => {
        server.start();
    });
}

main();
